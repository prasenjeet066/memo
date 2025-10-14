import React, { useState, useRef, useEffect, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorDialog } from "./EditorDialog";
import {
  useEditorHistory,
} from "@/lib/editor/editorUtils";
import {
  parseRecordMX,
  convertHtmlToRecordMX,
  RECORDMX_ADVANCED_STYLES
} from "@/lib/recordmx/parser";
import type { RecordMXParseResult } from "@/lib/recordmx/parser";

/**
 * Utility: Get caret offset in contenteditable.
 */
function getCaretCharacterOffset(element: HTMLElement | null): number {
  if (!element) return 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }
  return 0;
}

/**
 * Utility: Set caret position in contenteditable.
 */
function setCaretPosition(element: HTMLElement | null, offset: number) {
  if (!element) return;
  const range = document.createRange();
  const sel = window.getSelection();
  if (!sel) return;
  let charCount = 0;
  let nodeStack: Node[] = [element];
  let found = false;
  while (!found && nodeStack.length) {
    const node = nodeStack.pop();
    if (!node) continue;
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharCount = charCount + (node.textContent?.length || 0);
      if (offset >= charCount && offset <= nextCharCount) {
        range.setStart(node, offset - charCount);
        range.collapse(true);
        found = true;
      }
      charCount = nextCharCount;
    } else {
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }
  if (found) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

export function MediaWikiEditor({
  recordName,
  editingMode = "visual"
}: {
  recordName?: string;
  editingMode?: "visual" | "recordmx";
}) {
  const [markup, setMarkup] = useState("");
  const [title, setTitle] = useState(recordName ?? "");
  const [editorMode, setEditorMode] = useState<"visual" | "recordmx">(editingMode);
  const [parseResult, setParseResult] = useState<RecordMXParseResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [dialog, setDialog] = useState({
    open: false,
    type: null as string | null,
    data: {},
    selection: ""
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const ignoreNextInput = useRef(false);

  // Undo/redo stack
  const {
    history,
    historyIndex,
    addToHistory,
    handleUndo,
    handleRedo
  } = useEditorHistory(markup, setMarkup);

  // Initial content for visual mode (only once)
  useEffect(() => {
    if (
      editorMode === "visual" &&
      visualRef.current &&
      !visualRef.current.innerHTML.trim()
    ) {
      visualRef.current.innerHTML =
        "<p>Welcome! Start typing here. Use toolbar for formatting.</p>";
    }
  }, [editorMode]);

  // Sync HTML to markup when switching to recordmx
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current) {
      const parserhtml = convertHtmlToRecordMX(visualRef.current.innerHTML);
      setMarkup(parserhtml);
    }
  }, [visualRef.current, editingMode]);

  // Parse markup to HTML (for preview/word count)
  useEffect(() => {
    try {
      const result = parseRecordMX(markup, {
        sanitize: true,
        allowHtml: false,
        smartQuotes: true,
        autoLinks: true,
        lineBreaks: false,
        mathSupport: true,
        diagramSupport: true,
        emojiSupport: true,
        tableOfContents: true,
        syntaxHighlight: true,
        maxNestingLevel: 10
      });
      setParseResult(result);
      setWordCount(result.metadata.wordCount);
    } catch (err) {
      setParseResult({
        html: markup,
        metadata: {
          wordCount: markup.split(/\s+/).filter(word => word.length > 0).length,
          readingTime: Math.ceil(markup.split(/\s+/).length / 200),
          headings: [],
          links: [],
          images: []
        },
        errors: [],
        warnings: []
      });
    }
  }, [markup]);

  // Sync parseResult to visual editor on mode switch
  useEffect(() => {
    if (
      editorMode === "visual" &&
      visualRef.current &&
      parseResult
    ) {
      const currentHtml = visualRef.current.innerHTML;
      if (currentHtml !== parseResult.html) {
        const caretOffset = getCaretCharacterOffset(visualRef.current);
        ignoreNextInput.current = true;
        visualRef.current.innerHTML = parseResult.html;
        requestAnimationFrame(() => {
          setCaretPosition(visualRef.current, caretOffset);
          ignoreNextInput.current = false;
        });
      }
    }
  }, [editorMode, parseResult]);

  // Inject styles
  useEffect(() => {
    const styleId = "recordmx-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = RECORDMX_ADVANCED_STYLES;
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Handle input (debounced, for visual mode)
  const handleVisualInput = useCallback(() => {
    if (!visualRef.current || ignoreNextInput.current) return;
    const caretOffset = getCaretCharacterOffset(visualRef.current);
    const html = visualRef.current.innerHTML;
    const newMarkup = convertHtmlToRecordMX(html);
    setMarkup(newMarkup);
    addToHistory(newMarkup);
    requestAnimationFrame(() => {
      setCaretPosition(visualRef.current, caretOffset);
    });
  }, [addToHistory]);

  // Mode switch handler
  const handleModeSwitch = useCallback(
    (mode?: string) => {
      const newMode = mode || (editorMode === "visual" ? "recordmx" : "visual");
      if (
        editorMode === "visual" &&
        visualRef.current &&
        newMode === "recordmx"
      ) {
        // Sync current visual HTML to markup
        const html = visualRef.current.innerHTML;
        const newMarkup = convertHtmlToRecordMX(html);
        setMarkup(newMarkup);
        addToHistory(newMarkup);
      }
      setEditorMode(newMode as "visual" | "recordmx");
    },
    [editorMode, addToHistory]
  );

  // Tool command handler
  const handleCommand = useCallback(
    (command: string, ...args: any[]) => {
      if (editorMode === "visual") {
        handleVisualCommand(command, ...args);
      } else {
        handleRecordMXCommand(command, ...args);
      }
    },
    [editorMode]
  );

  // Visual commands
  const handleVisualCommand = useCallback(
    (command: string, ...args: any[]) => {
      const el = visualRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const text = sel.toString();
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
          "reference"
        ].includes(command)
      ) {
        setDialog({ open: true, type: command, data: {}, selection: text });
        return;
      }
      // Inline formatting
      const commandMap: Record<string, () => void> = {
        bold: () => document.execCommand("bold"),
        italic: () => document.execCommand("italic"),
        underline: () => document.execCommand("underline"),
        strikethrough: () => document.execCommand("strikeThrough"),
        superscript: () => document.execCommand("superscript"),
        subscript: () => document.execCommand("subscript"),
        inlineCode: () => {
          const span = document.createElement("span");
          span.style.fontFamily = "monospace";
          span.style.background = "#f1f3f4";
          span.style.padding = "2px 4px";
          span.style.borderRadius = "3px";
          span.textContent = text;
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(span);
        },
        heading: () => {
          const level = args[0] || 2;
          const heading = document.createElement(`h${level}`);
          heading.textContent = text || "Heading";
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(heading);
        },
        horizontalRule: () => {
          const hr = document.createElement("hr");
          const range = sel.getRangeAt(0);
          range.insertNode(hr);
        },
        unorderedList: () => document.execCommand("insertUnorderedList"),
        orderedList: () => document.execCommand("insertOrderedList"),
        indent: () => document.execCommand("indent"),
        outdent: () => document.execCommand("outdent"),
        undo: () => handleUndo(),
        redo: () => handleRedo()
      };
      if (commandMap[command]) {
        commandMap[command]();
        handleVisualInput();
      }
    },
    [handleVisualInput, handleUndo, handleRedo]
  );

  // RecordMX (markdown-like) commands
  const handleRecordMXCommand = useCallback(
    (command: string, ...args: any[]) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = markup.substring(start, end);
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
          "reference"
        ].includes(command)
      ) {
        setDialog({ open: true, type: command, data: {}, selection: selectedText });
        return;
      }
      // Inline formatting
      const commandMap: Record<string, string> = {
        bold: `**${selectedText}**`,
        italic: `*${selectedText}*`,
        underline: `__${selectedText}__`,
        strikethrough: `~~${selectedText}~~`,
        superscript: `^${selectedText}^`,
        subscript: `~${selectedText}~`,
        inlineCode: `\`${selectedText}\``,
        heading: `${"#".repeat(args[0] || 2)} ${selectedText}`,
        horizontalRule: "\n\n---\n\n",
        unorderedList: `- ${selectedText}`,
        orderedList: `1. ${selectedText}`
      };
      let insertText = commandMap[command];
      if (insertText) {
        const newMarkup = markup.substring(0, start) + insertText + markup.substring(end);
        setMarkup(newMarkup);
        addToHistory(newMarkup);
        setTimeout(() => {
          if (textarea) {
            const newPosition = start + insertText.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
          }
        }, 0);
      }
    },
    [markup, addToHistory]
  );

  // Dialog submit handler
  const handleDialogSubmit = useCallback(
    (data: any) => {
      const type = dialog.type;
      const selection = dialog.selection;
      let insertText = "";
      switch (type) {
        case "link":
          insertText = `[${selection || data.text || "Link"}](${data.url || "https://example.com"})`;
          break;
        case "image":
          insertText = `![${data.alt || "Image"}](${data.src || ""})${data.width || data.height ? `{${data.width || ""}${data.height ? "x" + data.height : ""}}` : ""}`;
          break;
        case "video":
          insertText = `@[video](${data.src || ""})`;
          break;
        case "codeBlock":
          insertText = `\`\`\`${data.language || "javascript"}${data.filename ? ` file:${data.filename}` : ""}\n${selection || data.code || ""}\n\`\`\``;
          break;
        case "math":
          insertText = data.display ? `$$${data.formula || ""}$$` : `$${data.formula || ""}$`;
          break;
        case "table":
          const rows = parseInt(data.rows || "3");
          const cols = parseInt(data.cols || "3");
          insertText = Array(rows)
            .fill(0)
            .map(
              (_, i) =>
                "|" +
                Array(cols)
                  .fill("Cell")
                  .join("|") +
                "|" +
                (i === 0 ? "\n|" + Array(cols).fill("---").join("|") + "|" : "")
            )
            .join("\n");
          break;
        case "template":
          insertText = `{% ${data.name || "template"} ${Object.entries(data.params || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")} %}`;
          break;
        case "reference":
          insertText = `[@${data.id || "ref1"}]`;
          break;
        default:
          return;
      }
      if (editorMode === "visual" && visualRef.current) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(insertText);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        handleVisualInput();
      } else if (editorMode === "recordmx" && textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newMarkup = markup.slice(0, start) + insertText + markup.slice(end);
        setMarkup(newMarkup);
        addToHistory(newMarkup);
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = start + insertText.length;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
            textareaRef.current.focus();
          }
        }, 0);
      }
      setDialog({ open: false, type: null, data: {}, selection: "" });
    },
    [dialog, editorMode, markup, handleVisualInput, addToHistory]
  );

  // Save handler (simulate backend save)
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      let finalMarkup = markup;
      if (editorMode === "visual" && visualRef.current) {
        finalMarkup = convertHtmlToRecordMX(visualRef.current.innerHTML);
      }
      await new Promise(resolve => setTimeout(resolve, 800));
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      setError(err?.message || "সংরক্ষণে ত্রুটি হয়েছে");
    } finally {
      setIsSaving(false);
    }
  }, [title, markup, editorMode]);

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
          {parseResult && (
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>{parseResult.metadata.readingTime} min read</span>
              {parseResult.errors.length > 0 && (
                <span className="text-red-600">{parseResult.errors.length} errors</span>
              )}
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      <EditorToolbar
        editorMode={editorMode}
        onCommand={handleCommand}
        onModeSwitch={handleModeSwitch}
        handleSave={handleSave}
      />
      <div className="max-w-7xl mx-auto bg-white min-h-[70vh] border rounded-lg shadow-sm">
        {editorMode === "recordmx" ? (
          <textarea
            ref={textareaRef}
            value={markup}
            onChange={e => {
              setMarkup(e.target.value);
              addToHistory(e.target.value);
            }}
            className="w-full min-h-[70vh] p-4 outline-none text-sm font-mono resize-none border-none"
            placeholder="RecordMX মার্কআপ এখানে লিখুন..."
          />
        ) : (
          <div
            ref={visualRef}
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            className="min-h-[70vh] p-4 outline-none prose max-w-none"
            contentEditable
            suppressContentEditableWarning
            spellCheck
            data-placeholder="এখানে লেখা শুরু করুন..."
          />
        )}
      </div>
      {(parseResult &&
        (parseResult.errors.length > 0 || parseResult.warnings.length > 0)) && (
        <div className="max-w-7xl mx-auto mt-4 p-4">
          {parseResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
              <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
              {parseResult.errors.map((error, index) => (
                <div key={index} className="text-red-700 text-sm">
                  {error}
                </div>
              ))}
            </div>
          )}
          {parseResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h3 className="font-semibold text-yellow-800 mb-2">Warnings:</h3>
              {parseResult.warnings.map((warning, index) => (
                <div key={index} className="text-yellow-700 text-sm">
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

export default MediaWikiEditor;