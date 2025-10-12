import { useState, useRef, useEffect, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorDialog } from "./EditorDialog";
import { saveCursorPosition, restoreCursorPosition, useEditorHistory } from "@/lib/editor/editorUtils";
import { parseRecordMX, convertHtmlToRecordMX } from "@/lib/recordmx/parser";
import type { RecordMXParseResult } from "@/lib/recordmx/parser";

export function MediaWikiEditor({ recordName, editingMode }: { recordName?: string, editingMode?: "visual" | "source" }) {
  const [markup, setMarkup] = useState("");
  const [title, setTitle] = useState(recordName ?? "");
  const [editorMode, setEditorMode] = useState<"visual" | "source">(editingMode ?? "visual");
  const [parseResult, setParseResult] = useState<RecordMXParseResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [dialog, setDialog] = useState<any>({ open: false, type: null, data: {}, selection: "" });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const lastMarkupRef = useRef("");
  const cursorPositionRef = useRef<any>(null);
  
  // Undo/redo stack with custom hook
  const { history, historyIndex, addToHistory, handleUndo, handleRedo } = useEditorHistory(markup, setMarkup);
  
  // Parse RecordMX markup whenever it changes
  useEffect(() => {
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
  }, [markup]);
  
  // Update visual editor content when parse result changes
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && parseResult && !isUpdatingRef.current) {
      const content = parseResult.html || "<p><br></p>";
      if (visualRef.current.innerHTML !== content) {
        const cursorPos = saveCursorPosition(visualRef.current);
        visualRef.current.innerHTML = content;
        requestAnimationFrame(() => restoreCursorPosition(visualRef.current, cursorPos));
      }
    }
  }, [editorMode, parseResult]);
  
  // Inject styles for RecordMX
  useEffect(() => {
    if (parseResult?.styles) {
      const styleId = 'recordmx-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = parseResult.styles;
    }
  }, [parseResult?.styles]);
  
  const handleVisualInput = useCallback(() => {
    if (visualRef.current && !isUpdatingRef.current) {
      cursorPositionRef.current = saveCursorPosition(visualRef.current);
      setTimeout(() => {
        if (visualRef.current) {
          isUpdatingRef.current = true;
          const html = visualRef.current.innerHTML;
          const newMarkup = convertHtmlToRecordMX(html);
          if (newMarkup !== lastMarkupRef.current) {
            lastMarkupRef.current = newMarkup;
            setMarkup(newMarkup);
            addToHistory(newMarkup);
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
      const newMarkup = convertHtmlToRecordMX(html);
      setMarkup(newMarkup);
      lastMarkupRef.current = newMarkup;
      addToHistory(newMarkup);
      setEditorMode("source");
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    } else if (editorMode === "source") {
      setEditorMode("visual");
    }
  }, [editorMode, addToHistory]);
  
  const handleCommand = useCallback((command: string, ...args: any[]) => {
    const el = visualRef.current;
    
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const text = sel.toString();
    
    // Commands that need dialog
    if (["link", "image", "video", "codeBlock", "math", "table", "template", "reference"].includes(command)) {
      setDialog({ open: true, type: command, data: {}, selection: text });
      return;
    }
    
    // Direct formatting commands
    const commandMap: Record<string, () => void> = {
      bold: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`**${text}**`));
        }
      },
      italic: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`*${text}*`));
        }
      },
      underline: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`__${text}__`));
        }
      },
      strikethrough: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`~~${text}~~`));
        }
      },
      superscript: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`^${text}^`));
        }
      },
      subscript: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`~${text}~`));
        }
      },
      inlineCode: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`\`${text}\``));
        }
      },
      heading: () => {
        const level = args[0] || 2;
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`${'#'.repeat(level)} ${text}`));
        }
      },
      horizontalRule: () => {
        const range = sel.getRangeAt(0);
        range.insertNode(document.createTextNode('\n---\n'));
      },
      unorderedList: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`- ${text}`));
        }
      },
      orderedList: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(`1. ${text}`));
        }
      }
    };
    
    if (commandMap[command]) {
      commandMap[command]();
      handleVisualInput();
    }
  }, [handleVisualInput]);
  
  const handleDialogSubmit = useCallback((data: any) => {
    const type = dialog.type;
    const selection = dialog.selection;
    const el = editorMode === "visual" ? visualRef.current : textareaRef.current;
    
    if (!el) return;
    
    let insertText = '';
    
    switch (type) {
      case 'link':
        insertText = `[${selection || data.text || 'Link'}](${data.url || 'https://example.com'})`;
        break;
      case 'image':
        insertText = `![${data.alt || 'Image'}](${data.src || ''})${data.width || data.height ? `{${data.width || ''}${data.height ? 'x' + data.height : ''}}` : ''}`;
        break;
      case 'video':
        insertText = `@[video](${data.src || ''})`;
        break;
      case 'codeBlock':
        insertText = `\`\`\`${data.language || 'javascript'}${data.filename ? ` file:${data.filename}` : ''}\n${selection || data.code || ''}\n\`\`\``;
        break;
      case 'math':
        insertText = data.display ? `$$${data.formula || ''}$$` : `$${data.formula || ''}$`;
        break;
      case 'table':
        const rows = parseInt(data.rows || '3');
        const cols = parseInt(data.cols || '3');
        insertText = Array(rows).fill(0).map((_, i) => 
          '|' + Array(cols).fill('Cell').join('|') + '|' + (i === 0 ? '\n|' + Array(cols).fill('---').join('|') + '|' : '')
        ).join('\n');
        break;
      case 'template':
        insertText = `{% ${data.name || 'template'} ${Object.entries(data.params || {}).map(([k, v]) => `${k}=${v}`).join(' ')} %}`;
        break;
      case 'reference':
        insertText = `[@${data.id || 'ref1'}]`;
        break;
    }
    
    if (editorMode === "visual" && visualRef.current) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(insertText));
      }
      handleVisualInput();
    } else if (editorMode === "source" && textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newMarkup = markup.slice(0, start) + insertText + markup.slice(end);
      setMarkup(newMarkup);
      addToHistory(newMarkup);
    }
    
    setDialog({ open: false, type: null, data: {}, selection: "" });
  }, [dialog, editorMode, markup, handleVisualInput, addToHistory]);
  
  const handleSave = useCallback(async () => {
    if (!title.trim()) return setError("দয়া করে একটি শিরোনাম লিখুন");
    setIsSaving(true);
    try {
      // Here you would save to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Saving:', { title, markup, metadata: parseResult?.metadata });
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } finally {
      setIsSaving(false);
    }
  }, [title, markup, parseResult]);
  
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="border-b bg-white flex items-center justify-between py-4 px-4">
        <h1 className='text-lg font-semibold text-gray-800'>{recordName}</h1>
        <div className='bg-white flex items-center justify-end gap-2'>
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
      
      <EditorToolbar
        mode={editorMode}
        onCommand={handleCommand}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onModeSwitch={handleModeSwitch}
        handleSave={handleSave}
      />
      
      <div className="max-w-7xl mx-auto bg-white">
        {editorMode === "source" ? (
          <textarea
            ref={textareaRef}
            value={markup}
            onChange={e => {
              setMarkup(e.target.value);
              addToHistory(e.target.value);
            }}
            className="w-full min-h-[70vh] p-4 outline-none text-sm font-mono resize-none"
            placeholder="RecordMX মার্কআপ এখানে লিখুন..."
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
      
      {/* Show TOC if available */}
      {parseResult?.toc && editorMode === "visual" && (
        <div className="max-w-7xl mx-auto mt-4" dangerouslySetInnerHTML={{ __html: parseResult.toc }} />
      )}
      
      {/* Show errors/warnings */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Parsing Errors:</h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {parseResult.errors.map((err, i) => (
              <li key={i}>Line {err.line}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}
      
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