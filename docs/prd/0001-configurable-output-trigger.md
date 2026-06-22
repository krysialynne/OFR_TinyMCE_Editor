# PRD: Configurable output trigger ("Trigger Output" property)

> Intended triage label: `ready-for-agent`. Saved locally because GitHub Issues is
> disabled on the repo and the available token cannot enable it. See note at top of
> the conversation for how to publish.

## Problem Statement

End users of the OFR TinyMCE Editor must click the **Save** button in the editor toolbar before any of their edits become visible to the surrounding Power App. Until they do, the bound `contentHtml` column holds stale data — typing, formatting, inserting tables, etc. update only the editor's in-memory state. This is surprising and error-prone:

- Makers expect a field control to behave like the built-in modern **Text Input**, whose `TriggerOutput` property lets them decide *when* the value is committed. Our control offers no such choice — it is hard-wired to "Save button only."
- Users frequently navigate away or submit a form assuming their text was captured, and silently lose it because they never pressed Save.
- There is no way to get a "commits on blur" or "commits as you pause typing" experience without forking and editing source.

## Solution

Introduce a configurable **trigger mode** that controls when the control performs an **output push** (calling `notifyOutputChanged` so the host can read the latest HTML), mirroring the built-in Text Input's `TriggerOutput` property so makers reuse existing intuition.

A new maker-facing **"Trigger Output"** property exposes three choices:

- **Focus Out** (`FocusOut`) — push when the editor loses focus (blur). **Default**, so the control commits without any menu-clicking out of the box.
- **Delayed** (`Delayed`) — push after a fixed 500 ms debounce once the user pauses typing.
- **Save Button** (`Manual`) — push only when the user clicks the Save toolbar button. This preserves the control's original behavior for anyone who wants it.

`Keypress`-style per-keystroke pushing is intentionally not offered (see ADR-0001 and Out of Scope).

This is governed by `docs/adr/0001-configurable-output-trigger.md` and the glossary terms in `CONTEXT.md` (output push, trigger mode, Save button).

## User Stories

1. As a Power Apps maker, I want a "Trigger Output" property on the control, so that I can choose when edits are committed without forking the source.
2. As a maker, I want the property to look and read like the built-in Text Input's `TriggerOutput`, so that I can apply knowledge I already have.
3. As a maker, I want "Focus Out" to be the default, so that a freshly placed control commits edits without me configuring anything.
4. As a maker, I want the three choices labelled "Focus Out", "Delayed", and "Save Button" in the config panel, so that each option's behavior is self-evident.
5. As a maker who relied on the old behavior, I want a "Save Button" option, so that I can keep the original Save-button-only workflow after upgrading.
6. As an end user in Focus Out mode, I want my edits committed when I click or tab out of the editor, so that I don't have to find and press a Save button.
7. As an end user in Delayed mode, I want my edits committed shortly after I stop typing, so that downstream formulas and previews stay current as I work.
8. As an end user in Delayed mode, I want rapid consecutive keystrokes to result in a single commit after I pause, so that performance stays smooth on large documents.
9. As an end user in Save Button mode, I want the Save button present on the toolbar, so that I have an explicit commit action.
10. As an end user in Save Button mode, I want my cursor position preserved after I press Save, so that I can keep editing where I left off.
11. As an end user in Focus Out or Delayed mode, I want the Save button absent from the toolbar, so that I am not misled into thinking a manual save is required.
12. As a maker switching from Save Button to an auto mode at design time, I want the toolbar to update accordingly, so that the configured behavior matches what I see.
13. As a maker switching between Focus Out and Delayed, I want the editor not to needlessly reload, so that my in-progress design state is preserved.
14. As a form user, I want whatever is currently in the editor to be the value the host reads when a push occurs, so that no edits are dropped.
15. As a maker, I want an unset or unrecognized Trigger Output value to fall back to Focus Out, so that misconfiguration never leaves the control unable to commit.
16. As a maintainer, I want the push-timing logic isolated from React and TinyMCE, so that it can be unit-tested deterministically.
17. As a maintainer, I want debounce coalescing covered by tests with simulated time, so that timing regressions are caught without a real clock.
18. As a developer in a GCC environment, I want the feature to add no external network calls, so that the control stays fully offline-compliant.
19. As an upgrading maker, I want the behavior change (default is now Focus Out, not Save-button-only) called out, so that I am not surprised when existing placements start auto-committing.
20. As an accessibility-minded user, I want focus-out commits to fire on standard blur, so that keyboard navigation (Tab away) commits my work.

## Implementation Decisions

- **New manifest input property.** Add `triggerOutput` to `ControlManifest.Input.xml` as `of-type="Enum"`, `usage="input"`, with three `<value>` children: `FocusOut` (marked default), `Delayed`, `Manual`. Maker-facing labels: property "Trigger Output"; values "Focus Out", "Delayed", "Save Button". Re-run `npm run refreshTypes` to regenerate `ManifestTypes` after the manifest change.
- **Seam 1 — pure trigger-output policy module (new).** A pure module, free of React/TinyMCE/DOM, exposing:
  - `resolveTriggerMode(raw: string | null | undefined): TriggerMode` — normalizes the manifest enum value; returns `FocusOut` for unset/unknown input.
  - `triggerBehavior(mode: TriggerMode)` — returns the derived shape:

    ```ts
    // derived from the design discussion; shape encodes ADR-0001
    type TriggerMode = "FocusOut" | "Delayed" | "Manual";
    interface TriggerBehavior {
      pushOn: "blur" | "debounced-change" | "save";
      debounceMs: number | null; // 500 for Delayed, null otherwise
      showSaveButton: boolean;   // true only for Manual
      isManual: boolean;         // == (mode === "Manual")
    }
    ```
- **Seam 2 — injectable push controller (new).** A factory (e.g. `createOutputPusher`) that takes the resolved `TriggerBehavior`, a `notify` callback (wired to `notifyOutputChanged`), and an injectable timer/clock, and returns handlers: `onChange()`, `onBlur()`, and `dispose()`/`flush()`. Internally it decides — based on `pushOn`/`debounceMs` — whether a given event causes an immediate push, a debounced push, or nothing. The injectable timer makes debounce behavior testable with simulated time.
- **`index.ts`** reads `context.parameters.triggerOutput.raw`, runs it through `resolveTriggerMode`, and passes the mode into `EditorRenderer`. `collectContent` continues to update `_outputContent` on every editor change in all modes (cheap string assignment); only the `notifyOutputChanged` call is gated by mode, so `getOutputs` always returns the freshest HTML.
- **`EditorRenderer.tsx`** becomes a thin consumer: derive `behavior` from the mode; compute the toolbar/plugin set from `behavior.showSaveButton` (include the `save` plugin + Save toolbar item only when `isManual`); wire `onChange`/`blur` to the push controller for auto modes; keep the existing `save_onsavecallback` + bookmark cursor-restore path for Manual mode only.
- **Mode-switch reactivity (per ADR-0001).** Remount the `<Editor>` only when crossing the Manual boundary, via a React `key` tied to `isManual`. Focus Out ↔ Delayed swaps the push handler reactively (no remount), preserving editor state.
- **Debounce interval is a fixed 500 ms constant**, not a property (matches built-in `DelayOutput` feel; promote to a property later only if a real need emerges).
- **Test runner.** Introduce a lightweight runner (recommend Vitest — TypeScript out of the box, built-in fake timers via `vi.useFakeTimers()`, minimal config) and a `test` script in `package.json`. No DOM/jsdom required because both seams are pure.

## Testing Decisions

- **Test external behavior, not implementation.** Tests assert *what the policy decides* and *when pushes happen*, never internal field names or call order beyond observable effect (i.e. "notify was called once after 500 ms of quiet", not "the private timer handle was set").
- **Policy module (Seam 1).** Cover: every mode maps to the correct `TriggerBehavior`; `FocusOut` is returned for `null`, `undefined`, empty string, and unknown values; `showSaveButton`/`isManual` are true only for `Manual`; `debounceMs` is 500 only for `Delayed`.
- **Push controller (Seam 2), using simulated time.** Cover: in `FocusOut`, `onBlur()` pushes immediately and `onChange()` does not; in `Delayed`, a burst of `onChange()` calls coalesces into a single push 500 ms after the last one, and a `onBlur()`/`flush()` commits any pending push; in `Manual`, neither `onChange()` nor `onBlur()` pushes (only the save path does); `dispose()` cancels any pending debounced push.
- **Prior art.** None in this repo (no existing tests). Establish the convention: pure-module unit tests colocated with the modules under test, fake timers for any time-dependent behavior.
- **Wiring stays harness-verified.** `EditorRenderer`/`index.ts` React + TinyMCE integration (real blur events, bookmark cursor restore, host `getOutputs`) is verified manually via `npm run start` across all three modes — not unit-tested.

## Out of Scope

- **General toolbar configurability** (which buttons/menus appear) — explicitly deferred; only the Save button's presence changes, and only as a consequence of the trigger mode.
- **A `Keypress` trigger mode** — deliberately excluded (full-HTML serialization on every keystroke is too expensive; see ADR-0001).
- **A configurable debounce interval property** — fixed at 500 ms for now.
- **Changes to the `autosave` plugin** (local draft restore) — unrelated to output push.
- **Automated UI/integration tests** of the React/TinyMCE layer — covered manually via the harness.

## Further Notes

- **Behavior change for existing placements:** the default flips from Save-button-only to Focus Out. Existing forks/placements that relied on manual save will begin auto-committing on blur unless the maker explicitly selects "Save Button". Call this out in release notes.
- **Frozen names:** once shipped, renaming `triggerOutput` or its enum values breaks maker bindings, so the names are effectively final.
- **Offline/GCC constraint preserved:** no new network calls; all logic is local.
- Decisions trace to `docs/adr/0001-configurable-output-trigger.md`; vocabulary is defined in `CONTEXT.md`.
