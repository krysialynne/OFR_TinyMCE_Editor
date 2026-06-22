# Context & Glossary

Domain vocabulary for the OFR TinyMCE Editor PCF control. Glossary only — no implementation details.

## Terms

### Output push
The act of committing the editor's current HTML to the host (Power Apps / Dataverse) by calling the framework's `notifyOutputChanged`, which makes the value readable by the bound `contentHtml` property. Distinct from an in-memory content change, which updates the control's local state but is *not* yet visible to the host.

### Trigger mode
The configured policy that decides *when* an [output push](#output-push) happens. Models the built-in modern Text Input's `TriggerOutput` property. Supported values:

- **FocusOut** — push when the editor loses focus (blur).
- **Delayed** — push after a debounce window elapses once editing pauses.
- **Manual** — push only when the user invokes the Save toolbar button. This is the control's original (pre-configurable) behavior. Surfaced to makers as **"Save Button"**.

**FocusOut** is the default trigger mode. In the maker config panel the whole setting is the **"Trigger Output"** property (mirroring the built-in modern Text Input's `TriggerOutput`), with choices labelled **Focus Out**, **Delayed**, **Save Button**.

> `Keypress` (push on every content change) is intentionally **not** supported: serializing and pushing the entire HTML document on every keystroke is too expensive for a rich text editor.

### Save button
The TinyMCE `save` toolbar/plugin action. Historically the *only* path to an output push. Under configurable trigger modes it is the dedicated mechanism for **Manual** mode (and may or may not remain present in other modes — TBD).
