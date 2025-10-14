import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight/lib/core";
import Placeholder from "@tiptap/extension-placeholder";
import MathBlock from "@tiptap-pro/extension-math-block";
import MathInline from "@tiptap-pro/extension-math-inline";
// You'll need to install `@tiptap-pro` for math support, or use a custom extension

import { Toolbar } from "./TiptapToolbar";
import { EditorDialog } from "./EditorDialog";

export function TiptapEditor({ initialContent = "", recordName, editingMode = "visual" }) {
  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    data: {},
    selection: "",
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({ levels: [2, 3, 4] }),
      Link,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: "এখানে লেখা শুরু করুন...",
      }),
      MathBlock,
      MathInline,
      // Add more extensions for template/reference as needed
    ],
    content: initialContent,
  });

  // Dialog command handlers
  const handleCommand = (command, ...args) => {
    if (!editor) return;
    // Dialog-based tools
    if (
      [
        "link",
        "image",
        "video",
        "codeBlock",
        "math",
        "table",
        "template",
        "reference",
      ].includes(command)
    ) {
      setDialog({
        open: true,
        type: command,
        data: {},
        selection: editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          " "
        ),
      });
      return;
    }
    // Inline/Block formatting
    switch (command) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "underline":
        editor.chain().focus().toggleUnderline().run();
        break;
      case "strikethrough":
        editor.chain().focus().toggleStrike().run();
        break;
      case "superscript":
        editor.chain().focus().setSuperscript().run();
        break;
      case "subscript":
        editor.chain().focus().setSubscript().run();
        break;
      case "inlineCode":
        editor.chain().focus().toggleCode().run();
        break;
      case "heading":
        editor.chain().focus().toggleHeading({ level: args[0] || 2 }).run();
        break;
      case "horizontalRule":
        editor.chain().focus().setHorizontalRule().run();
        break;
      case "unorderedList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "undo":
        editor.chain().focus().undo().run();
        break;
      case "redo":
        editor.chain().focus().redo().run();
        break;
      default:
        break;
    }
  };

  // Dialog submit handler
  const handleDialogSubmit = (data) => {
    if (!editor) return;
    switch (dialog.type) {
      case "link":
        editor.chain().focus().extendMarkRange("link").setLink({
          href: data.url || "https://example.com",
          target: "_blank",
        }).run();
        break;
      case "image":
        editor.chain().focus().setImage({
          src: data.src || "",
          alt: data.alt || "",
          title: data.title || "",
        }).run();
        break;
      case "video":
        // Tiptap does not have a built-in video extension; you can make a custom extension for video
        if (editor.commands.insertContent) {
          editor.commands.insertContent(`<video src="${data.src}" controls width="${data.width || 400}"></video>`);
        }
        break;
      case "codeBlock":
        editor.chain().focus().setCodeBlock({ language: data.language || "javascript" }).insertContent(data.code || "").run();
        break;
      case "math":
        if (data.display) {
          editor.chain().focus().insertContent(`<math-block>${data.formula}</math-block>`).run();
        } else {
          editor.chain().focus().insertContent(`<math-inline>${data.formula}</math-inline>`).run();
        }
        break;
      case "table":
        editor.chain().focus().insertTable({ rows: data.rows || 3, cols: data.cols || 3, withHeaderRow: true }).run();
        break;
      case "template":
        // You can implement a custom extension for templates
        editor.chain().focus().insertContent(`{% ${data.name || "template"} ${Object.entries(data.params || {}).map(([k, v]) => `${k}=${v}`).join(" ")} %}`).run();
        break;
      case "reference":
        // Custom extension needed for references; here we insert as plain text
        editor.chain().focus().insertContent(`[@${data.id || "ref1"}]`).run();
        break;
      default:
        break;
    }
    setDialog({ open: false, type: null, data: {}, selection: "" });
  };

  // Save handler (simulate backend save)
  const [title, setTitle] = useState(recordName ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
    } catch (err) {
      setError("সংরক্ষণে ত্রুটি হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="border-b bg-white flex items-center justify-between py-4 px-4">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="নিবন্ধের শিরোনাম লিখুন..."
          className="text-lg font-semibold text-gray-800 bg-transparent border-none outline-none w-full"
        />
        <div className="bg-white flex items-center justify-end gap-2">
          {editor && (
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <span>{editor.storage.characterCount.characters()} words</span>
              {/* Reading time logic if needed */}
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      <Toolbar editor={editor} onCommand={handleCommand} handleSave={handleSave} />
      <div className="max-w-7xl mx-auto bg-white min-h-[70vh] border rounded-lg shadow-sm">
        <EditorContent editor={editor} className="min-h-[70vh] p-4 outline-none prose max-w-none" />
      </div>
      <EditorDialog
        open={dialog.open}
        type={dialog.type}
        data={dialog.data}
        selection={dialog.selection}
        onClose={() => setDialog({ open: false, type: null, data: {}, selection: "" })}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}
export default TiptapEditor;