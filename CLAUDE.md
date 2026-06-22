# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A PowerApps Component Framework (PCF) **virtual control** that embeds a TinyMCE rich text editor into Power Apps / Dataverse. It is purpose-built for Microsoft GCC (Government Community Cloud) environments: **all TinyMCE scripts, skins, fonts, and assets are bundled locally so the control makes zero external HTTP requests** at load or runtime. Breaking that constraint (e.g. loading TinyMCE from a CDN, using `tinymce.min.js` cloud config, or referencing remote skins) defeats the purpose of the project.

## Commands

```bash
npm run build          # copy-tinymce-skins, then pcf-scripts build
npm run start          # copy-tinymce-skins, then launch the PCF test harness
npm run start:watch    # test harness with watch/rebuild
npm run rebuild        # clean + build
npm run lint           # pcf-scripts lint (eslint flat config)
npm run lint:fix       # auto-fix lint issues
npm run refreshTypes   # regenerate generated/ManifestTypes from the manifest
```

There is **no test suite** — verification is done by running the PCF harness (`npm run start`) and editing in the browser.

### Platform gotcha: `copy-tinymce-skins`
The `build`/`start` scripts depend on `copy-tinymce-skins`, which calls Windows `xcopy` to copy `node_modules/tinymce/skins` into `OFRTinyMCEEditor/assets/skins`. **This fails on Linux/macOS** (including this Linux devcontainer). On non-Windows, copy the skins manually instead, e.g.:

```bash
cp -r node_modules/tinymce/skins OFRTinyMCEEditor/assets/skins
```

The bundled `assets/skins/...` are referenced as `<css>` resources in the manifest, so they must exist before a build that ships them.

## Architecture

The control follows the standard PCF lifecycle but renders via React (`control-type="virtual"`, using the platform-provided React 16.14 + Fluent libraries — see `ControlManifest.Input.xml` `<platform-library>`).

- **`OFRTinyMCEEditor/index.ts`** — the PCF control class (`OFRTinyMCEEditor`). `updateView` returns a React element (it does **not** call `ReactDOM.render`; the platform mounts it because the control is virtual). Holds `_outputContent` and exposes it via `getOutputs()` under the `contentHtml` property.
- **`OFRTinyMCEEditor/EditorRenderer.tsx`** — the React component wrapping `@tinymce/tinymce-react`. Owns all editor config (toolbar strings, plugins, fonts, content styling) and the resize/save behavior.
- **`OFRTinyMCEEditor/TinyMceBundle.tsx`** — **the offline bundling seam.** It `import`s every TinyMCE module (core, dom model, silver theme, default icons, and each plugin) so webpack bundles them locally, and `TinyPlugins()` returns the matching plugin-name list passed to the editor `init`. **These two lists must stay in sync:** if you add a plugin name to the editor config without importing it here, the editor fails to load at runtime; if you reference an unimported plugin, same failure.

### Data flow & the save model

The single bound property is **`contentHtml`** (manifest `of-type="Multiple"`, a multiline text field). Critically, output is **not** pushed on every keystroke:

- `onEditorChange` → `collectContent` updates the in-memory `_outputContent` but does **not** call `notifyOutputChanged`.
- The value is only committed to Power Apps when the user clicks the editor's **Save** button (the `save` plugin / `save_onsavecallback`), which calls `notifyOutputChanged()`.
- Because TinyMCE's save resets the cursor, `EditorRenderer` captures a bookmark in `save_onsavecallback` and restores it via `selection.moveToBookmark` in a `useEffect`.

So "the model doesn't update until Save is pressed" is intentional, not a bug.

### Sizing
The control resizes to Power Apps' allocated container: `index.ts` enables `trackContainerResize(true)` and passes `context.mode.allocatedWidth/Height` into `EditorRenderer`, which manually resizes the TinyMCE container/content-area on height changes.

## Packaging / solution

- **`OFR_TinyMCE_Editor.pcfproj`** — MSBuild project that builds the control (namespace `OFRns`, constructor `OFRTinyMCEEditor`).
- **`TinyMCE_Solution/`** (`TinyMCE_solution.cdsproj`) — the Dataverse solution project that references the pcfproj and packages the control for import into Power Apps.
- **`Manage_Solutions_Build/TinyMCE_solution.zip`** — a prebuilt managed solution artifact.

Building solutions requires the .NET/MSBuild PowerApps targets (Windows tooling); the npm scripts above only build the PCF control bundle itself.

## Agent skills

### Issue tracker

Issues are tracked in GitHub via the `gh` CLI (`origin` = `krysialynne/OFR_TinyMCE_Editor`); external PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
