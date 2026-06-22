# 1. Configurable output trigger ("Trigger Output")

Date: 2026-06-22

## Status

Accepted

## Context

The control originally performed an [output push](../../CONTEXT.md#output-push) (calling
`notifyOutputChanged`) **only** when the user clicked the TinyMCE Save toolbar button.
Every other edit updated in-memory state but stayed invisible to the host until that click.
This forces makers and end users to click through the toolbar to commit a value, which is
surprising compared to the built-in modern Text Input, whose `TriggerOutput` property lets
the maker choose when the value is pushed.

We want to make the push behavior configurable, mirroring that built-in property so makers
reuse existing intuition. Toolbar configurability in general is explicitly **out of scope**
for this change.

## Decision

Add an `Enum` input property **`triggerOutput`** ("Trigger Output") with three
[trigger modes](../../CONTEXT.md#trigger-mode):

- **Focus Out** (`FocusOut`) — push on editor blur. **Default.**
- **Delayed** (`Delayed`) — push after a **fixed 500 ms** debounce once editing pauses.
- **Save Button** (`Manual`) — push only on the Save toolbar button (the original behavior).

Supporting decisions:

- **No `Keypress` mode.** The built-in offers it (and defaults to it), but serializing and
  pushing the entire HTML document on every keystroke is too expensive for a rich text
  editor and undermines this control's stability-in-heavy-editing purpose.
- **Default is `FocusOut`, not `Manual`.** The whole point is to avoid menu-clicking by
  default. This is a behavior change for existing placements (see Consequences).
- **The Save button / `save` plugin is mode-dependent.** Present only in `Manual` mode,
  where it carries the existing bookmark cursor-restore workaround (the save action resets
  the cursor; a plain `notifyOutputChanged` on blur/debounce does not). In auto modes the
  save plugin, button, and bookmark logic are all absent.
- **Mode switches remount the editor only across the `Manual` boundary.** A React `key`
  tied to "is Manual" rebuilds the editor when the Save button appears/disappears;
  `FocusOut` ↔ `Delayed` swaps the push handler reactively with no remount.
- Maker-facing labels: property "Trigger Output"; values "Focus Out", "Delayed",
  "Save Button". `Manual` remains the internal/code/glossary term.

## Consequences

- **Behavior change for existing forks/placements:** controls that relied on Save-button-only
  commits will, after upgrade, push on blur unless the maker explicitly selects "Save Button".
  Call this out in release notes.
- The debounce interval is hard-coded (500 ms). If tuning is later required, promote it to a
  numeric property — deferred to avoid speculative surface area.
- Renaming `triggerOutput` or its values after release breaks maker bindings, so the names are
  effectively frozen once shipped.
- `Keypress`-style live updates are unavailable; makers needing per-keystroke reactions have no
  in-control option.
