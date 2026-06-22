import * as React from "react";
import "./TinyMceBundle";
import { Editor } from "@tinymce/tinymce-react";
import { Editor as TinyEditor } from "tinymce";
import { Bookmark as TinyBookmark } from "tinymce";
import { TriggerBehavior } from "./triggerOutput";
import { buildToolbar, buildPlugins } from "./editorConfig";

export interface IEditorRendererProps {
    content: string;
    onEditorChange: (content: string) => void;
    width: number;
    height: number;
    notifyOutputChanged: () => void;
    behavior: TriggerBehavior;
}

export const EditorRenderer: React.FC<IEditorRendererProps> = ({ content, onEditorChange, width, height, notifyOutputChanged, behavior }) => {
    const editorRef = React.useRef<TinyEditor | null>(null);
    const [isChanged, setIsChanged] = React.useState<boolean>(false);
    const [lastBookmark, setLastBookmark] = React.useState<TinyBookmark>();

    const resizeEditor = (h: number) => {
        const editor = editorRef.current;
        if (!editor) return;

        const container = editor.getContainer();
        if (!container) return;

        container.style.height = `${h}px`;

        const contentArea = editor.getContentAreaContainer();
        if (contentArea) {
            contentArea.style.height = "100%";
        }
    };

    React.useEffect(() => {
        if (behavior.isManual && editorRef.current && lastBookmark) {
            editorRef.current.selection.moveToBookmark(lastBookmark);
            setIsChanged(false);
        }
    }, [content, isChanged, lastBookmark, behavior.isManual]);

    React.useEffect(() => {
        resizeEditor(height);
    }, [height]);

    const toolbar = buildToolbar(behavior.showSaveButton);
    const plugins = buildPlugins(behavior.showSaveButton);

    const initConfig: Record<string, unknown> = {
        height: `${height}px`,
        width: "100%",
        menubar: "edit view insert format tools table help",
        plugins,
        toolbar,
        toolbar_mode: "sliding",
        skin: false,
        content_css: false,
        branding: false,
        promotion: false,
        inline: false,
        toolbar_sticky: false,
        min_height: 400,
        max_height: height - 20,
        autoresize_bottom_margin: 20,
        autoresize_overflow_padding: 10,
        font_family_formats: "Arial=arial,helvetica; Helvetica=helvetica; Courier New=courier new,courier; Times New Roman=times new roman,times; Georgia=georgia; Verdana=verdana; Segoe UI=segoe ui,segoe;",
        content_style: "body { font-family:Arial,Helvetica; font-size:14px; text-align: left;}",
    };

    if (behavior.isManual) {
        initConfig.save_onsavecallback = (editor: TinyEditor) => {
            setLastBookmark(editor.selection.getBookmark(2));
            notifyOutputChanged();
            setIsChanged(true);
        };
    }

    const handleBlur = behavior.pushOn === "blur" ? () => notifyOutputChanged() : undefined;

    return (
        <div style={{ width: `${width}px`, height: `${height}px` }}>
            <Editor
                key={behavior.isManual ? "manual" : "auto"}
                onInit={(_evn, editor) => { editorRef.current = editor; }}
                initialValue={content}
                licenseKey="gpl"
                init={initConfig}
                onEditorChange={onEditorChange}
                onBlur={handleBlur}
            />
        </div>
    );
};

