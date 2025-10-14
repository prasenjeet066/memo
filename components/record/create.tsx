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
import { common, createLowlight } from "lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
// import MathBlock from "@tiptap-pro/extension-math-block";
// import MathInline from "@tiptap-pro/extension-math-inline";
// Uncomment above if you have @tiptap-pro license

import { Toolbar } from "./TiptapToolbar";
import { EditorDialog } from "./EditorDialog";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface TiptapEditorProps {
  initialContent ? : string;
  recordName ? : string;
  editingMode ? : "visual" | "markdown";
}

export function TiptapEditor({
  initialContent = "",
  recordName,
  editingMode = "visual"
}: TiptapEditorProps) {
  const [dialog, setDialog] = useState({
    open: false,
    type: null as string | null,
    data: {} as any,
    selection: "",
  });
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block to use CodeBlockLowlight
      }),
      Heading.configure({ levels: [2, 3, 4] }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
      }),
      Placeholder.configure({
        placeholder: "এখানে লেখা শুরু করুন...",
      }),
      // MathBlock,
      // MathInline,
      // Uncomment above if you have @tiptap-pro license
    ],
    content: initialContent,
  });
  
  // Dialog command handlers
  const handleCommand = (command: string, ...args: any[]) => {
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
        editor.chain().focus().toggleSuperscript().run();
        break;
      case "subscript":
        editor.chain().focus().toggleSubscript().run();
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
  const handleDialogSubmit = (data: any) => {
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
        editor.commands.insertContent(`<video src="${data.src}" controls width="${data.width || 400}"></video>`);
        break;
      case "codeBlock":
        editor.chain().focus().setCodeBlock({
          language: data.language || "javascript"
        }).run();
        if (data.code) {
          editor.commands.insertContent(data.code);
        }
        break;
      case "math":
        // If you have @tiptap-pro math extensions enabled:
        // if (data.display) {
        //   editor.chain().focus().insertContent({ type: 'mathBlock', attrs: { content: data.formula } }).run();
        // } else {
        //   editor.chain().focus().insertContent({ type: 'mathInline', attrs: { content: data.formula } }).run();
        // }
        
        // Fallback without pro extensions:
        if (data.display) {
          editor.commands.insertContent(`$$${data.formula}$$`);
        } else {
          editor.commands.insertContent(`$${data.formula}$`);
        }
        break;
      case "table":
        editor.chain().focus().insertTable({
          rows: data.rows || 3,
          cols: data.cols || 3,
          withHeaderRow: true
        }).run();
        break;
      case "template":
        // You can implement a custom extension for templates
        const params = Object.entries(data.params || {})
          .map(([k, v]) => `${k}=${v}`)
          .join(" ");
        editor.commands.insertContent(`{% ${data.name || "template"} ${params} %}`);
        break;
      case "reference":
        // Custom extension needed for references; here we insert as plain text
        editor.commands.insertContent(`[@${data.id || "ref1"}]`);
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
  
  const characterCount = editor?.storage?.characterCount?.characters?.() || 0;
  
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
              <span>{characterCount} characters</span>
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
      <Toolbar editor={editor} onCommand={handleCommand} handleSave={handleSave} isSaving={isSaving} />
      <div className="max-w-7xl mx-auto bg-white min-h-[70vh] border rounded-lg shadow-sm mt-4">
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