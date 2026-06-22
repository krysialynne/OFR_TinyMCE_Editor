import { describe, it, expect } from "vitest";
import { resolveTriggerMode, triggerBehavior } from "./triggerOutput";

describe("resolveTriggerMode", () => {
  it("recognizes the Focus Out mode", () => {
    expect(resolveTriggerMode("FocusOut")).toBe("FocusOut");
  });

  it("recognizes the Delayed mode", () => {
    expect(resolveTriggerMode("Delayed")).toBe("Delayed");
  });

  it("recognizes the Manual mode", () => {
    expect(resolveTriggerMode("Manual")).toBe("Manual");
  });

  it("falls back to Focus Out for null", () => {
    expect(resolveTriggerMode(null)).toBe("FocusOut");
  });

  it("falls back to Focus Out for undefined", () => {
    expect(resolveTriggerMode(undefined)).toBe("FocusOut");
  });

  it("falls back to Focus Out for an empty string", () => {
    expect(resolveTriggerMode("")).toBe("FocusOut");
  });

  it("falls back to Focus Out for an unrecognized value", () => {
    expect(resolveTriggerMode("Keypress")).toBe("FocusOut");
  });
});

describe("triggerBehavior", () => {
  it("pushes on blur in Focus Out mode, with no debounce, no save button, not manual", () => {
    expect(triggerBehavior("FocusOut")).toEqual({
      pushOn: "blur",
      debounceMs: null,
      showSaveButton: false,
      isManual: false,
    });
  });

  it("pushes on a 500ms debounced change in Delayed mode, with no save button, not manual", () => {
    expect(triggerBehavior("Delayed")).toEqual({
      pushOn: "debounced-change",
      debounceMs: 500,
      showSaveButton: false,
      isManual: false,
    });
  });

  it("pushes only on save in Manual mode, showing the save button, with no debounce", () => {
    expect(triggerBehavior("Manual")).toEqual({
      pushOn: "save",
      debounceMs: null,
      showSaveButton: true,
      isManual: true,
    });
  });
});
