import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Video,
  FileCode,
  Sigma,
  List,
  ListOrdered,
  Table,
  Minus,
  Superscript,
  Subscript,
  Type,
  Languages,
  FileText,
  ListChecks,
  Puzzle,
} from "lucide-react";

import {
  parseMarkup,
  applyEditorCommand,
  EditorCommands,
  DEFAULT_STYLES,
  type ParseResult,
} from "../../lib/utils/dist/markup";

function setCaretToEnd(el: HTMLElement) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [parseResult, setParseResult] = useState<ParseResult>(parseMarkup(""));
  const [visualHtml, setVisualHtml] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  // Parse only when in visual mode
  useEffect(() => {
    if (editorMode === "source") return;
    const result = parseMarkup(wikitext);
    setParseResult(result);
    setVisualHtml(result.html);
  }, [wikitext, editorMode]);

  // Keep HTML in sync without breaking caret
  useEffect(() => {
    if (
      editorMode === "visual" &&
      visualRef.current &&
      document.activeElement !== visualRef.current
    ) {
      visualRef.current.innerHTML = parseResult.html;
    }
  }, [parseResult.html, editorMode]);

  // Switch modes
  const handleModeSwitch = () => {
    if (editorMode === "visual") {
      if (visualRef.current) {
        setWikitext(visualRef.current.innerText);
      }
      setEditorMode("source");
    } else {
      setEditorMode("visual");
    }
  };

  // Apply formatting commands
  const handleCommand = (command: string, ...args: any[]) => {
    if (editorMode === "source") {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const result = applyEditorCommand(wikitext, command, start, end, ...args);
      setWikitext(result.text);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
      }, 0);
    } else {
      const el = visualRef.current;
      if (!el) return;
      el.focus();

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const selectedText = sel.toString();
        let htmlSnippet = "";

        if (EditorCommands[command]) {
          htmlSnippet = EditorCommands[command].execute(selectedText, ...args);
        } else {
          htmlSnippet = selectedText;
        }

        range.deleteContents();
        const fragment = document.createRange().createContextualFragment(
          parseMarkup(htmlSnippet).html.replace(/^<div[^>]*>|<\/div>$/g, "")
        );
        range.insertNode(fragment);

        setWikitext(el.innerText);
        setCaretToEnd(el);
      }
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          handleCommand("bold");
          break;
        case "i":
          e.preventDefault();
          handleCommand("italic");
          break;
        case "u":
          e.preventDefault();
          handleCommand("underline");
          break;
        case "k":
          e.preventDefault();
          handleCommand("link");
          break;
        case "s":
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  const handleSave = () => {
    console.log("Saving:", { title, wikitext, metadata: parseResult.metadata });
    alert("Article saved! Check console for details.");
  };

  const Blocks = [
    { icon: Bold, action: "bold", label: "Bold" },
    { icon: Italic, action: "italic", label: "Italic" },
    {
      name: "Heading",
      items: [
        { icon: Heading1, action: "heading", label: "Heading 1", args: [1] },
        { icon: Heading2, action: "heading", label: "Heading 2", args: [2] },
        { icon: Heading3, action: "heading", label: "Heading 3", args: [3] },
      ],
    },
    { icon: Type, action: "boldItalic", label: "Bold Italic" },
    { icon: Strikethrough, action: "strikethrough", label: "Strikethrough" },
    { icon: Underline, action: "underline", label: "Underline" },
    { icon: Code, action: "inlineCode", label: "Code" },
    { icon: Link, action: "link", label: "Link" },
    { icon: Image, action: "image", label: "Image" },
    { icon: Video, action: "video", label: "Video" },
    { icon: FileCode, action: "codeBlock", label: "Code Block" },
    { icon: Sigma, action: "math", label: "Math" },
    { icon: List, action: "unorderedList", label: "Bullet List" },
    { icon: ListOrdered, action: "orderedList", label: "Numbered List" },
    { icon: Table, action: "table", label: "Table" },
    { icon: Puzzle, action: "template", label: "Template" },
    { icon: Minus, action: "horizontalRule", label: "Horizontal Rule" },
    { icon: Superscript, action: "superscript", label: "Superscript" },
    { icon: Subscript, action: "subscript", label: "Subscript" },
    { icon: FileText, action: "reference", label: "Reference" },
    { icon: ListChecks, action: "refList", label: "Reference List" },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <List className="h-5 w-5 text-gray-600" />
          <h1 className="text-lg font-semibold">MediaWiki Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded transition"
            onClick={handleModeSwitch}
            title="Toggle editor mode"
          >
            <Languages className="h-5 w-5" />
          </button>
          <button
            onClick={handleSave}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center flex-wrap gap-1 p-2">
          {Blocks.map((block, i) =>
            !block.name ? (
              <button
                key={i}
                onClick={() => handleCommand(block.action)}
                className="p-2 rounded border hover:bg-gray-100 transition"
                title={block.label}
              >
                <block.icon className="h-4 w-4" />
              </button>
            ) : (
              <select
                key={i}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const item = block.items.find((itm) => itm.action === value);
                    handleCommand(value, ...(item?.args || []));
                    e.target.value = "";
                  }
                }}
                className="p-2 border rounded hover:bg-gray-50"
                defaultValue=""
              >
                <option value="" disabled>
                  {block.name}
                </option>
                {block.items.map((item, idx) => (
                  <option key={idx} value={item.action}>
                    {item.label}
                  </option>
                ))}
              </select>
            )
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex gap-2">
        {editorMode === "source" && (
          <textarea
            ref={textareaRef}
            value={wikitext}
            onChange={(e) => setWikitext(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[70vh] rounded-lg p-4 outline-none text-sm border-2 border-gray-300 bg-white focus:border-blue-500 font-mono"
            placeholder="Start writing your article using MediaWiki syntax..."
          />
        )}

        {editorMode === "visual" && (
          <div
            ref={visualRef}
            onInput={(e) => setWikitext(e.currentTarget.innerText)}
            className="flex-1 min-h-[70vh] rounded-lg p-6 bg-white outline-none"
            contentEditable
            suppressContentEditableWarning
            spellCheck={true}
            style={{
              fontFamily: "inherit",
              direction: "ltr",
              unicodeBidi: "plaintext",
            }}
            dangerouslySetInnerHTML={{ __html: visualHtml }}
            onKeyDown={handleKeyDown}
          />
        )}

        <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />

        {editorMode === "source" && (
          <div
            className={`bg-white rounded-lg p-6 border-2 border-gray-300 overflow-auto ${
              editorMode === "source" ? "flex-1" : "w-full"
            }`}
          >
            <div
              dangerouslySetInnerHTML={{
                __html:
                  visualHtml ||
                  '<p class="text-gray-400">Preview will appear here...</p>',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}