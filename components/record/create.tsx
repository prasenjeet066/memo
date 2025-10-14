import React, { useState, useRef } from "react";
import {
  MDXEditor,
  MDXEditorMethods,
  codeBlockPlugin,
  tablePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  frontmatterPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  ListsToggle,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

// Custom Toolbar Component
function CustomToolbar({ onSave, isSaving }) {
  return (
    <div className="flex items-center justify-between border-b p-2 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2 flex-wrap">
        <UndoRedo />
        <BoldItalicUnderlineToggles />
        <BlockTypeSelect />
        <CodeToggle />
        <CreateLink />
        <InsertImage />
        <InsertTable />
        <ListsToggle />
      </div>
      <button
        className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Publish"}
      </button>
    </div>
  );
}

export function MediaWikiEditor({
  recordName,
  editingMode = "visual",
}) {
  const [title, setTitle] = useState(recordName ?? "");
  const [markdown, setMarkdown] = useState("# Welcome\n\nStart editing your content here...");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  const editorRef = useRef(null);
  
  const handleSave = async () => {
    if (!title.trim()) {
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log("Saved content:", { title, markdown });
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
      setError("");
    } catch (err) {
      setError(err?.message || "সংরক্ষণে ত্রুটি হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="w-full min-h-screen bg-gray-50 py-4">
      <div className="max-w-5xl mx-auto bg-white min-h-[70vh] border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="নিবন্ধের শিরোনাম লিখুন..."
            className="text-2xl font-semibold text-gray-800 bg-transparent border-none outline-none w-full focus:ring-0"
          />
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <MDXEditor
          ref={editorRef}
          markdown={markdown}
          onChange={setMarkdown}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin(),
            tablePlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
            frontmatterPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => <CustomToolbar onSave={handleSave} isSaving={isSaving} />
            })
          ]}
          contentEditableClassName="prose max-w-none p-4 min-h-[500px] focus:outline-none"
        />
      </div>
    </div>
  );
}

export default MediaWikiEditor;