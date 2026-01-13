import * as React from "react";
import "./TinyMceBundle";
import { TinyPlugins } from "./TinyMceBundle";
import { Editor } from "@tinymce/tinymce-react";
import { Editor as TinyEditor } from "tinymce";
import { Bookmark as TinyBookmark } from "tinymce";

export interface IEditorRendererProps {
    content: string;
    onEditorChange: (content: string) => void;
    width: number;
    height: number;
    notifyOutputChanged: () => void;
}

const toolbarString = 'undo redo | blocks | bold italic underline | fontfamily fontsize forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | hr pagebreak | image media link | table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | code help | save';
const toolbar2String = 'alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | hr pagebreak';
const toolbar3String = 'image media link | table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | code help | save';


export const EditorRenderer: React.FC<IEditorRendererProps> = ({ content, onEditorChange, width, height, notifyOutputChanged }) => {
    const editorRef = React.useRef<TinyEditor | null>(null);
    const [isChanged, setIsChanged] = React.useState<boolean>(false);
    const [lastBookmark, setLastBookmark] = React.useState<TinyBookmark >();


    const resizeEditor = (height: number) => {
        // function to get the editor container to resize it

        const editor = editorRef.current;
        if (!editor) return;

        const container = editor.getContainer();
        if (!container) return;

        container.style.height = `${height}px`;

        // Also resize the content area (important)
        const contentArea = editor.getContentAreaContainer();
        if (contentArea) {
            contentArea.style.height = "100%";
        }
    };



    React.useEffect(() => {
        
        if (editorRef.current) {
            console.log("Last Bookmark:", lastBookmark);
            // after saving (cursor reset) we restor the last position of cursor
            editorRef.current.selection.moveToBookmark(lastBookmark!);
            setIsChanged(false);
        }
    },[content, isChanged, lastBookmark]);

    React.useEffect(() => {
        // resize the Editor based on allocatedHeight from Powerapps
        resizeEditor(height);
    },[height]);

    return (
        <div style={{width:`${width}px`, height: `${height}px`}}>
        <Editor
            onInit={(_evn,editor) => editorRef.current = editor}
            initialValue={content}
            licenseKey="gpl"
            init={{
                height: `${height}px`,
                width: "100%",
                menubar: "edit view insert format tools table help",
                plugins: TinyPlugins(),
                toolbar:toolbarString,
                toolbar_mode: "sliding",
                skin: false,
                content_css: false,
                branding: false,
                promotion: false,
                inline: false,
                toolbar_sticky: false, // this was handled using scroll
                min_height: 400,
                max_height: height -20,
                autresize_bottom_margin: 20,
                autoresize_overflow_padding: 10,
                font_family_formats: 'Arial=arial,helvetica; Helvetica=helvetica; Courier New=courier new,courier; Times New Roman=times new roman,times; Georgia=georgia; Verdana=verdana; Segoe UI=segoe ui,segoe;',
                content_style:`body { font-family:Arial,Helvetica; font-size:14px; text-align: left;}`,

                save_onsavecallback: (editor:TinyEditor) => {
                    // keep the last curso position to be restored after save operation (save will reset the cursor)
                    setLastBookmark(editor.selection.getBookmark(2));
                    notifyOutputChanged();
                    setIsChanged(true);
                }
            }}
            onEditorChange={onEditorChange}
            onSaveContent={notifyOutputChanged}
        />
        </div>
    );
};

