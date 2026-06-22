/**
 * Pure trigger-output policy (Seam 1 of the configurable Trigger Output feature).
 *
 * Free of React, TinyMCE, and the DOM so it can be unit-tested deterministically.
 * Encodes the decisions in docs/adr/0001-configurable-output-trigger.md; see also
 * the "trigger mode" and "output push" glossary terms in CONTEXT.md.
 */

/** The configured policy deciding when an output push happens. `Manual` is surfaced to makers as "Save Button". */
export type TriggerMode = "FocusOut" | "Delayed" | "Manual";

/** The derived behavior a trigger mode implies — what the editor/push layers consume. */
export interface TriggerBehavior {
  /** Which editor event commits the value to the host. */
  pushOn: "blur" | "debounced-change" | "save";
  /** Debounce window for `debounced-change`; `null` when not debounced. */
  debounceMs: number | null;
  /** Whether the Save toolbar button/plugin is present. */
  showSaveButton: boolean;
  /** Convenience flag for the one mode that crosses the remount boundary. */
  isManual: boolean;
}

const KNOWN_MODES: readonly TriggerMode[] = ["FocusOut", "Delayed", "Manual"];

/**
 * Normalize a raw manifest enum value to a `TriggerMode`. Anything unset or
 * unrecognized (null, undefined, empty, unknown) falls back to `FocusOut` so a
 * misconfiguration never leaves the control unable to commit.
 */
export function resolveTriggerMode(raw: string | null | undefined): TriggerMode {
  return KNOWN_MODES.includes(raw as TriggerMode) ? (raw as TriggerMode) : "FocusOut";
}

const BEHAVIOR_BY_MODE: Record<TriggerMode, TriggerBehavior> = {
  FocusOut: { pushOn: "blur", debounceMs: null, showSaveButton: false, isManual: false },
  Delayed: { pushOn: "debounced-change", debounceMs: 500, showSaveButton: false, isManual: false },
  Manual: { pushOn: "save", debounceMs: null, showSaveButton: true, isManual: true },
};

/** Map a trigger mode to the behavior it implies. */
export function triggerBehavior(mode: TriggerMode): TriggerBehavior {
  return BEHAVIOR_BY_MODE[mode];
}
