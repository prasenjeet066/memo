import React, { useState } from "react";
import {
  MDXEditor,
  useEditor,
  codeBlockPlugin,
  tablePlugin,
  linkPlugin,
  imagePlugin,
  frontmatterPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { EditorToolbar } from "./EditorToolbar";

export function MediaWikiEditor({
  recordName,
  editingMode = "visual",
}: {
  recordName ? : string;
  editingMode ? : "visual" | "recordmx";
}) {
  const [title, setTitle] = useState(recordName ?? "");
  const [markdown, setMarkdown] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // This will allow you to dispatch commands to mdxeditor
  const editor = useEditor();
  
  // Map your custom commands to mdxeditor's command API
  const handleCommand = (command: string, ...args: any[]) => {
    if (!editor) return;
    switch (command) {
      case "bold":
        editor?.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor?.chain().focus().toggleItalic().run();
        break;
      case "underline":
        editor?.chain().focus().toggleUnderline().run();
        break;
      case "strikethrough":
        editor?.chain().focus().toggleStrike().run();
        break;
      case "heading":
        const level = args[0] || 2;
        editor?.chain().focus().toggleHeading({ level }).run();
        break;
      case "codeBlock":
        editor?.chain().focus().toggleCodeBlock().run();
        break;
      case "blockquote":
        editor?.chain().focus().toggleBlockquote().run();
        break;
      case "orderedList":
        editor?.chain().focus().toggleOrderedList().run();
        break;
      case "unorderedList":
        editor?.chain().focus().toggleBulletList().run();
        break;
      case "table":
        editor?.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
        break;
      case "link":
        editor?.chain().focus().toggleLink({ href: args[0] || "#" }).run();
        break;
      case "image":
        editor?.chain().focus().insertImage({ src: args[0] || "", alt: args[1] || "" }).run();
        break;
      case "undo":
        editor?.chain().focus().undo().run();
        break;
      case "redo":
        editor?.chain().focus().redo().run();
        break;
      default:
        break;
    }
  };
  
  const handleSave = async () => {
    if (!title.trim()) {
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      setError(err?.message || "সংরক্ষণে ত্রুটি হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="w-full min-h-screen bg-gray-50 py-2">
      <div className="max-w-7xl mx-auto bg-white min-h-[70vh] border rounded-lg shadow-sm p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="নিবন্ধের শিরোনাম লিখুন..."
          className="text-lg font-semibold text-gray-800 bg-transparent border-none outline-none w-full mb-4"
        />

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <EditorToolbar
          onCommand={handleCommand}
          handleSave={handleSave}
          editorMode={"visual"}
          isMobile={false}
          // Add any necessary props for your toolbar
        />

        <MDXEditor
          value={markdown}
          onChange={setMarkdown}
          plugins={[
            codeBlockPlugin(),
            tablePlugin(),
            linkPlugin(),
            imagePlugin(),
            frontmatterPlugin(),
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            markdownShortcutPlugin(),
          ]}
          className="min-h-[500px] bg-white"
          editorRef={editor} // Connects to useEditor (may depend on mdxeditor version)
        />

        <button
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

export default MediaWikiEditor;