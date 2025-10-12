import { useState, useRef, useEffect, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorDialog } from "./EditorDialog";
import { saveCursorPosition, restoreCursorPosition, useEditorHistory } from "@/lib/editor/editorUtils";
import { parseMarkup, htmlToWikitext, applyEditorCommand, DEFAULT_STYLES, type ParseResult } from "@/lib/utils/dist/markup";

export function MediaWikiEditor({ recordName, editingMode }: { recordName ? : string, editingMode ? : "visual" | "source" }) {
  const [wikitext, setWikitext] = useState("");
  const [title, setTitle] = useState(recordName ?? "");
  const [editorMode, setEditorMode] = useState < "visual" | "source" > (editingMode ?? "visual");
  const [parseResult, setParseResult] = useState < ParseResult > (parseMarkup(""));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [dialog, setDialog] = useState < any > ({ open: false, type: null, data: {}, selection: "" });
  
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  const visualRef = useRef < HTMLDivElement > (null);
  const isUpdatingRef = useRef(false);
  const lastWikitextRef = useRef("");
  const cursorPositionRef = useRef < any > (null);
  
  // Undo/redo stack with custom hook
  const { history, historyIndex, addToHistory, handleUndo, handleRedo } = useEditorHistory(wikitext, setWikitext);
  
  useEffect(() => {
    setParseResult(parseMarkup(wikitext));
    setWordCount(wikitext.split(/\s+/).filter(Boolean).length);
  }, [wikitext]);
  
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && !isUpdatingRef.current) {
      const content = parseResult.html || "<p><br></p>";
      if (visualRef.current.innerHTML !== content) {
        const cursorPos = saveCursorPosition(visualRef.current);
        visualRef.current.innerHTML = content;
        requestAnimationFrame(() => restoreCursorPosition(visualRef.current, cursorPos));
      }
    }
  }, [editorMode, parseResult.html]);
  
  const handleVisualInput = useCallback(() => {
    if (visualRef.current && !isUpdatingRef.current) {
      cursorPositionRef.current = saveCursorPosition(visualRef.current);
      setTimeout(() => {
        if (visualRef.current) {
          isUpdatingRef.current = true;
          const html = visualRef.current.innerHTML;
          const newWikitext = htmlToWikitext(html);
          if (newWikitext !== lastWikitextRef.current) {
            lastWikitextRef.current = newWikitext;
            setWikitext(newWikitext);
            addToHistory(newWikitext);
          }
          requestAnimationFrame(() => {
            isUpdatingRef.current = false;
            restoreCursorPosition(visualRef.current, cursorPositionRef.current);
          });
        }
      }, 500);
    }
  }, [addToHistory]);
  
  const handleModeSwitch = useCallback(() => {
    if (editorMode === "visual" && visualRef.current) {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      setWikitext(newWikitext);
      lastWikitextRef.current = newWikitext;
      addToHistory(newWikitext);
      setEditorMode("source");
    } else if (editorMode === "source") {
      setParseResult(parseMarkup(wikitext));
      if (visualRef.current) visualRef.current.innerHTML = parseResult.html || "<p><br></p>";
      setEditorMode("visual");
    }
  }, [editorMode, wikitext, addToHistory, parseResult.html]);
  
  const handleCommand = useCallback((command: string, ...args: any[]) => {
    if (editorMode === "source") {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selection = wikitext.substring(start, end);
      if (["link", "image", "video", "codeBlock", "math", "table", "template", "reference"].includes(command)) {
        setDialog({ open: true, type: command, data: {}, selection });
        return;
      }
      try {
        const result = applyEditorCommand(wikitext, command, start, end, ...args);
        setWikitext(result.text);
        lastWikitextRef.current = result.text;
        addToHistory(result.text);
        textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
      } catch (err) {
        setError("কমান্ড ত্রুটি: " + (err as Error).message);
      }
    } else {
      // Visual mode
      const el = visualRef.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const text = sel.toString();
      if (["link", "image", "video", "codeBlock", "math", "table", "template", "reference"].includes(command)) {
        setDialog({ open: true, type: command, data: {}, selection: text });
        return;
      }
      handleVisualInput();
    }
  }, [editorMode, wikitext, addToHistory, handleVisualInput]);
  
  const handleDialogSubmit = useCallback((data: any) => {
    // Pass dialog logic to EditorDialog, which handles insert for both modes
    setDialog({ open: false, type: null, data: {}, selection: "" });
  }, []);
  
  const handleSave = useCallback(async () => {
    if (!title.trim()) return setError("দয়া করে একটি শিরোনাম লিখুন");
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } finally {
      setIsSaving(false);
    }
  }, [title]);
  
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="border-b bg-white flex items-center justify-between">
      <h1>{recordName}</h1>
      <div className='bg-white flex items-center justify-end gap-2'>
        <button className='border-l'>
          Publish
        </button>
      </div>
      </div>
      <EditorToolbar
        mode={editorMode}
        onCommand={handleCommand}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onModeSwitch={handleModeSwitch}
      />
      <div className="max-w-7xl mx-auto">
        {editorMode === "source" ? (
          <textarea
            ref={textareaRef}
            value={wikitext}
            onChange={e => {
              setWikitext(e.target.value);
              addToHistory(e.target.value);
            }}
            className="w-full min-h-[70vh] p-4 outline-none text-sm font-mono resize-none"
            placeholder="উইকিটেক্সট এখানে লিখুন..."
          />
        ) : (
          <div
            ref={visualRef}
            onBlur={handleVisualInput}
            onInput={handleVisualInput}
            className="min-h-[70vh] p-4 outline-none"
            contentEditable
            suppressContentEditableWarning
            spellCheck
            data-placeholder="এখানে লেখা শুরু করুন..."
          />
        )}
      </div>
      <EditorDialog
        open={dialog.open}
        type={dialog.type}
        data={dialog.data}
        selection={dialog.selection}
        onClose={() => setDialog({open:false,type:null,data:{},selection:""})}
        onSubmit={handleDialogSubmit}
        editorMode={editorMode}
        ref={editorMode === "visual" ? visualRef : textareaRef}
      />
    </div>
  );
}
export default MediaWikiEditor;