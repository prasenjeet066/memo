import { useState, useRef, useEffect, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorDialog } from "./EditorDialog";
import { saveCursorPosition, restoreCursorPosition, useEditorHistory } from "@/lib/editor/editorUtils";
import { parseRecordMX, convertHtmlToRecordMX, RECORDMX_ADVANCED_STYLES } from "@/lib/recordmx/parser";
import type { RecordMXParseResult } from "@/lib/recordmx/parser";

// Helper function to get caret position
function getCaretCharacterOffset(element: HTMLElement | null): number {
  if (!element) return 0;
  
  let caretOffset = 0;
  const sel = window.getSelection();
  
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  
  return caretOffset;
}

// Helper function to restore caret position
function setCaretPosition(element: HTMLElement | null, offset: number) {
  if (!element) return;
  
  const range = document.createRange();
  const sel = window.getSelection();
  
  if (!sel) return;
  
  let charCount = 0;
  let nodeStack = [element];
  let node: Node | undefined;
  let foundStart = false;
  
  while (!foundStart && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const nextCharCount = charCount + (textNode.length || 0);
      
      if (offset >= charCount && offset <= nextCharCount) {
        range.setStart(textNode, offset - charCount);
        range.collapse(true);
        foundStart = true;
      }
      
      charCount = nextCharCount;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }
  
  if (foundStart) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

export function MediaWikiEditor({ recordName, editingMode }: { recordName?: string, editingMode?: "visual" | "recordmx" }) {
  const [markup, setMarkup] = useState("");
  const [title, setTitle] = useState(recordName ?? "");
  const [editorMode, setEditorMode] = useState<"visual" | "recordmx">(editingMode ?? "visual");
  const [parseResult, setParseResult] = useState<RecordMXParseResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [dialog, setDialog] = useState<any>({ open: false, type: null, data: {}, selection: "" });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Undo/redo stack with custom hook
  const { history, historyIndex, addToHistory, handleUndo, handleRedo } = useEditorHistory(markup, setMarkup);

  // Parse RecordMX markup whenever it changes
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
      console.error("Parse error:", err);
    }
  }, [markup]);
  
  // Update visual editor content when parse result changes (only in visual mode)
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && parseResult && !isUpdatingRef.current) {
      const content = parseResult.html || "<p><br></p>";
      
      // Only update if content has changed
      if (visualRef.current.innerHTML !== content) {
        const caretOffset = getCaretCharacterOffset(visualRef.current);
        visualRef.current.innerHTML = content;
        
        // Restore caret position after render
        requestAnimationFrame(() => {
          setCaretPosition(visualRef.current, caretOffset);
        });
      }
    }
  }, [editorMode, parseResult]);
  
  // Inject styles for RecordMX
  useEffect(() => {
    const styleId = 'recordmx-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = RECORDMX_ADVANCED_STYLES;
    
    return () => {
      // Cleanup on unmount
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Handle visual editor input with debounce
  const handleVisualInput = useCallback(() => {
    if (!visualRef.current || isUpdatingRef.current) return;
    
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Save current caret position
    const caretOffset = getCaretCharacterOffset(visualRef.current);
    
    // Debounce the conversion
    updateTimeoutRef.current = setTimeout(() => {
      if (visualRef.current) {
        isUpdatingRef.current = true;
        
        try {
          const html = visualRef.current.innerHTML;
          const newMarkup = convertHtmlToRecordMX(html);
          
          setMarkup(newMarkup);
          addToHistory(newMarkup);
        } catch (err) {
          console.error("Conversion error:", err);
        } finally {
          // Restore caret position
          requestAnimationFrame(() => {
            setCaretPosition(visualRef.current, caretOffset);
            isUpdatingRef.current = false;
          });
        }
      }
    }, 300);
  }, [addToHistory]);
  
  const handleModeSwitch = useCallback((mode?: string) => {
    const newMode = mode || (editorMode === "visual" ? "recordmx" : "visual");
    
    if (editorMode === "visual" && visualRef.current && newMode === "recordmx") {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newMarkup = convertHtmlToRecordMX(html);
      setMarkup(newMarkup);
      addToHistory(newMarkup);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
    
    setEditorMode(newMode as "visual" | "recordmx");
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
          const textNode = document.createTextNode(`**${text}**`);
          range.insertNode(textNode);
          
          // Move cursor after inserted text
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      italic: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`*${text}*`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      underline: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`__${text}__`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      strikethrough: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`~~${text}~~`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      superscript: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`^${text}^`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      subscript: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`~${text}~`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      inlineCode: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`\`${text}\``);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      heading: () => {
        const level = args[0] || 2;
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`${'#'.repeat(level)} ${text}\n\n`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      horizontalRule: () => {
        const range = sel.getRangeAt(0);
        const textNode = document.createTextNode('\n\n---\n\n');
        range.insertNode(textNode);
        
        range.setStartAfter(textNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      },
      unorderedList: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`- ${text}\n`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      },
      orderedList: () => {
        if (text) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(`1. ${text}\n`);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
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
    }
    
    setDialog({ open: false, type: null, data: {}, selection: "" });
  }, [dialog, editorMode, markup, handleVisualInput, addToHistory]);
  
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      // Here you would save to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Saving:', { title, markup, metadata: parseResult?.metadata });
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      setError(err?.message || "সংরক্ষণে ত্রুটি হয়েছে");
    } finally {
      setIsSaving(false);
    }
  }, [title, markup, parseResult]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="border-b bg-white flex items-center justify-between py-4 px-4">
        <h1 className='text-lg font-semibold text-gray-800'>{recordName || "নতুন নিবন্ধ"}</h1>
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
      
      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      <EditorToolbar
        onCommand={handleCommand}
        onModeSwitch={handleModeSwitch}
        handleSave={handleSave}
      />
      
      <div className="max-w-7xl mx-auto bg-white min-h-[70vh]">
        {editorMode === "recordmx" ? (
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
        onClose={() => setDialog({ open: false, type: null, data: {}, selection: "" })}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}

export default MediaWikiEditor;