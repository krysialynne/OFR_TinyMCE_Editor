import { describe, it, expect } from "vitest";
import { buildToolbar, buildPlugins } from "./editorConfig";

describe("buildToolbar", () => {
  it("includes save when showSaveButton is true", () => {
    const toolbar = buildToolbar(true);
    expect(toolbar).toContain("save");
  });

  it("excludes save when showSaveButton is false", () => {
    const toolbar = buildToolbar(false);
    expect(toolbar).not.toContain("save");
  });
});

describe("buildPlugins", () => {
  it("includes save when showSaveButton is true", () => {
    const plugins = buildPlugins(true);
    expect(plugins).toContain("save");
  });

  it("excludes save when showSaveButton is false", () => {
    const plugins = buildPlugins(false);
    expect(plugins).not.toContain("save");
  });

  it("always includes all base plugins", () => {
    const withSave = buildPlugins(true);
    const withoutSave = buildPlugins(false);
    for (const plugin of withoutSave) {
      expect(withSave).toContain(plugin);
    }
    expect(withSave.length).toBe(withoutSave.length + 1);
  });
});
