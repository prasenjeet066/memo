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
  let nodeStack: Node[] = [element];
  let foundStart = false;
  
  while (!foundStart && nodeStack.length > 0) {
    const node = nodeStack.pop();
    if (!node) continue;
    
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
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
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
  const [dialog, setDialog] = useState<{ open: boolean; type: string | null; data: any; selection: string }>({ 
    open: false, 
    type: null, 
    data: {}, 
    selection: "" 
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { history, historyIndex, addToHistory, handleUndo, handleRedo } = useEditorHistory(markup, setMarkup);

  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && !visualRef.current.innerHTML.trim()) {
      visualRef.current.innerHTML = "<p>Welcome to the Rich Text Editor!</p><p>You can start typing here and use the toolbar above to format your text.</p>";
    }
  }, [editorMode]);

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

  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && parseResult && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const currentHtml = visualRef.current.innerHTML;
      
      if (currentHtml !== parseResult.html) {
        const caretOffset = getCaretCharacterOffset(visualRef.current);
        visualRef.current.innerHTML = parseResult.html;
        
        requestAnimationFrame(() => {
          setCaretPosition(visualRef.current, caretOffset);
          isUpdatingRef.current = false;
        });
      } else {
        isUpdatingRef.current = false;
      }
    }
  }, [editorMode, parseResult]);

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
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const handleVisualInput = useCallback(() => {
    if (!visualRef.current || isUpdatingRef.current) return;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    const caretOffset = getCaretCharacterOffset(visualRef.current);
    
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
    } else if (editorMode === "recordmx" && newMode === "visual") {
      setMarkup(prev => prev + " ");
      setTimeout(() => {
        setMarkup(prev => prev.trim());
      }, 10);
    }
    
    setEditorMode(newMode as "visual" | "recordmx");
  }, [editorMode, addToHistory]);

  const handleCommand = useCallback((command: string, ...args: any[]) => {
    if (editorMode === "visual") {
      handleVisualCommand(command, ...args);
    } else {
      handleRecordMXCommand(command, ...args);
    }
  }, [editorMode]);

  const handleVisualCommand = useCallback((command: string, ...args: any[]) => {
    const el = visualRef.current;
    
    if (!el) return;
    
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const text = sel.toString();
    
    // Commands that need dialog
    if (["link", "image", "video", "audio", "gallery", "codeBlock", "math", "table", "template", "reference", "infoBox", "warningBox", "tipBox", "errorBox", "questionBox", "quoteBox", "spoiler", "columns", "collapsible"].includes(command)) {
      setDialog({ open: true, type: command, data: {}, selection: text });
      return;
    }
    
    // Direct formatting commands
    const commandMap: Record<string, () => void> = {
      bold: () => document.execCommand('bold', false, null),
      italic: () => document.execCommand('italic', false, null),
      underline: () => document.execCommand('underline', false, null),
      strikethrough: () => document.execCommand('strikeThrough', false, null),
      superscript: () => document.execCommand('superscript', false, null),
      subscript: () => document.execCommand('subscript', false, null),
      
      highlight: () => {
        document.execCommand('hiliteColor', false, '#ffff00');
      },
      
      textColor: () => {
        const color = prompt('Enter color (hex or name):', '#000000');
        if (color) document.execCommand('foreColor', false, color);
      },
      
      backgroundColor: () => {
        const color = prompt('Enter background color:', '#ffffff');
        if (color) document.execCommand('hiliteColor', false, color);
      },
      
      fontSize: () => {
        const size = prompt('Enter font size (1-7):', '3');
        if (size) document.execCommand('fontSize', false, size);
      },
      
      fontFamily: () => {
        const font = prompt('Enter font family:', 'Arial');
        if (font) document.execCommand('fontName', false, font);
      },
      
      inlineCode: () => {
        const span = document.createElement('code');
        span.style.fontFamily = 'monospace';
        span.style.backgroundColor = '#f1f3f4';
        span.style.padding = '2px 4px';
        span.style.borderRadius = '3px';
        span.textContent = text;
        
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(span);
      },
      
      heading: () => {
        const level = args[0] || 2;
        document.execCommand('formatBlock', false, `h${level}`);
      },
      
      paragraph: () => {
        document.execCommand('formatBlock', false, 'p');
      },
      
      blockquote: () => {
        document.execCommand('formatBlock', false, 'blockquote');
      },
      
      horizontalRule: () => {
        const hr = document.createElement('hr');
        const range = sel.getRangeAt(0);
        range.insertNode(hr);
      },
      
      unorderedList: () => document.execCommand('insertUnorderedList', false, null),
      orderedList: () => document.execCommand('insertOrderedList', false, null),
      
      taskList: () => {
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none';
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.marginRight = '8px';
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(text || 'Task item'));
        ul.appendChild(li);
        
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(ul);
      },
      
      indent: () => document.execCommand('indent', false, null),
      outdent: () => document.execCommand('outdent', false, null),
      
      alignLeft: () => document.execCommand('justifyLeft', false, null),
      alignCenter: () => document.execCommand('justifyCenter', false, null),
      alignRight: () => document.execCommand('justifyRight', false, null),
      alignJustify: () => document.execCommand('justifyFull', false, null),
      
      unlink: () => document.execCommand('unlink', false, null),
      
      date: () => {
        const today = new Date().toLocaleDateString();
        document.execCommand('insertText', false, today);
      },
      
      timestamp: () => {
        const now = new Date().toLocaleString();
        document.execCommand('insertText', false, now);
      },
      
      clearFormatting: () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
      },
      
      clearAll: () => {
        if (confirm('Are you sure you want to clear all content?')) {
          if (visualRef.current) {
            visualRef.current.innerHTML = '<p><br></p>';
          }
        }
      },
      
      undo: () => handleUndo(),
      redo: () => handleRedo()
    };
    
    if (commandMap[command]) {
      commandMap[command]();
      handleVisualInput();
    }
  }, [handleVisualInput, handleUndo, handleRedo]);

  const handleRecordMXCommand = useCallback((command: string, ...args: any[]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markup.substring(start, end);
    
    const commandMap: Record<string, string> = {
      bold: `**${selectedText}**`,
      italic: `*${selectedText}*`,
      underline: `__${selectedText}__`,
      strikethrough: `~~${selectedText}~~`,
      superscript: `^${selectedText}^`,
      subscript: `~${selectedText}~`,
      inlineCode: `\`${selectedText}\``,
      highlight: `==${selectedText}==`,
      heading: `${'#'.repeat(args[0] || 2)} ${selectedText}`,
      blockquote: `> ${selectedText}`,
      horizontalRule: '\n\n---\n\n',
      unorderedList: `- ${selectedText}`,
      orderedList: `1. ${selectedText}`,
      taskList: `- [ ] ${selectedText}`,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toLocaleString(),
    };
    
    let insertText = commandMap[command];
    
    if (["link", "image", "video", "audio", "gallery", "codeBlock", "math", "table", "template", "reference", "infoBox", "warningBox", "tipBox", "errorBox", "questionBox", "quoteBox", "spoiler", "columns", "collapsible"].includes(command)) {
      setDialog({ open: true, type: command, data: {}, selection: selectedText });
      return;
    }
    
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
  }, [markup, addToHistory]);

  const handleDialogSubmit = useCallback((data: any) => {
    const type = dialog.type;
    const selection = dialog.selection;
    
    let insertText = '';
    
    switch (type) {
      case 'link':
        insertText = `[${selection || data.text || 'Link'}](${data.url || 'https://example.com'}${data.title ? ` "${data.title}"` : ''})`;
        break;
        
      case 'image':
        insertText = `![${data.alt || 'Image'}](${data.src || ''})${data.width || data.height ? `{${data.width || ''}${data.height ? 'x' + data.height : ''}}` : ''}${data.caption ? `\n*${data.caption}*` : ''}`;
        break;
        
      case 'video':
        const provider = data.provider || 'youtube';
        if (provider === 'custom') {
          insertText = `@[video](${data.src || ''})`;
        } else {
          insertText = `@[${provider}](${data.src || ''})`;
        }
        if (data.width || data.height) {
          insertText += `{${data.width || ''}${data.height ? 'x' + data.height : ''}}`;
        }
        break;
        
      case 'audio':
        insertText = `@[audio](${data.src || ''})`;
        break;
        
      case 'gallery':
        const images = data.images || [];
        insertText = `@[gallery]\n${images.map(img => `  - ${img.url} | ${img.caption || ''}`).join('\n')}\n@[/gallery]`;
        break;
        
      case 'codeBlock':
        insertText = `\`\`\`${data.language || 'javascript'}${data.filename ? ` file:${data.filename}` : ''}${data.lineNumbers ? ' line-numbers' : ''}\n${selection || data.code || ''}\n\`\`\``;
        break;
        
      case 'math':
        insertText = data.display ? `$${data.formula || ''}$` : `$${data.formula || ''}$`;
        break;
        
      case 'table':
        const rows = parseInt(data.rows || '3');
        const cols = parseInt(data.cols || '3');
        const headers = Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`);
        const separator = Array(cols).fill('---');
        const bodyRows = Array(rows - (data.hasHeader !== false ? 1 : 0)).fill(0).map((_, i) =>
          Array(cols).fill('Cell').map((c, j) => `${c} ${i + 1}-${j + 1}`)
        );
        
        insertText = data.hasHeader !== false
          ? `| ${headers.join(' | ')} |\n| ${separator.join(' | ')} |\n${bodyRows.map(row => `| ${row.join(' | ')} |`).join('\n')}`
          : `${bodyRows.map(row => `| ${row.join(' | ')} |`).join('\n')}\n| ${separator.join(' | ')} |`;
          
        if (data.caption) {
          insertText = `${insertText}\n*Table: ${data.caption}*`;
        }
        break;
        
      case 'template':
        const params = data.params || {};
        const paramStr = Object.entries(params).map(([k, v]) => `${k} = ${v}`).join(' | ');
        insertText = `{{${data.name || 'template'}${paramStr ? ' | ' + paramStr : ''}}}`;
        break;
        
      case 'reference':
        if (data.citeType) {
          insertText = `[@${data.id || 'ref'}: ${data.author || ''}, "${data.citationTitle || ''}", ${data.citationUrl || ''}, ${data.date || ''}]`;
        } else {
          insertText = `[@${data.id || 'ref1'}${data.text ? ': ' + data.text : ''}]`;
        }
        break;
        
      case 'infoBox':
        insertText = `::: info\n${selection || 'Information content here'}\n:::`;
        break;
        
      case 'warningBox':
        insertText = `::: warning\n${selection || 'Warning content here'}\n:::`;
        break;
        
      case 'tipBox':
        insertText = `::: tip\n${selection || 'Tip content here'}\n:::`;
        break;
        
      case 'errorBox':
        insertText = `::: error\n${selection || 'Error content here'}\n:::`;
        break;
        
      case 'questionBox':
        insertText = `::: question\n${selection || 'Question content here'}\n:::`;
        break;
        
      case 'quoteBox':
        insertText = `> ${selection || 'Quote text here'}\n> \n> — *Author Name*`;
        break;
        
      case 'spoiler':
        insertText = `::spoiler[${data.title || 'Click to reveal'}]\n${selection || 'Hidden content'}\n::`;
        break;
        
      case 'columns':
        const numCols = data.columns || 2;
        insertText = `::: columns {${numCols}}\n${Array(numCols).fill(0).map((_, i) => `Column ${i + 1} content`).join('\n\n---\n\n')}\n:::`;
        break;
        
      case 'collapsible':
        insertText = `<details>\n<summary>${data.title || 'Click to expand'}</summary>\n\n${selection || 'Collapsible content here'}\n\n</details>`;
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
  }, [dialog, editorMode, markup, handleVisualInput, addToHistory]);
  
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      let finalMarkup = markup;
      if (editorMode === "visual" && visualRef.current) {
        finalMarkup = convertHtmlToRecordMX(visualRef.current.innerHTML);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Saving:', { title, markup: finalMarkup, metadata: parseResult?.metadata });
      alert("✓ Article saved successfully!");
    } catch (err: any) {
      setError(err?.message || "Save error occurred");
    } finally {
      setIsSaving(false);
    }
  }, [title, markup, editorMode, parseResult]);
  
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
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter article title..."
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
      
      <div className="max-w-7xl mx-auto bg-white min-h-[70vh] border rounded-lg shadow-sm mt-4">
        {editorMode === "recordmx" ? (
          <textarea
            ref={textareaRef}
            value={markup}
            onChange={e => {
              setMarkup(e.target.value);
              addToHistory(e.target.value);
            }}
            className="w-full min-h-[70vh] p-4 outline-none text-sm font-mono resize-none border-none"
            placeholder="Write RecordMX markup here..."
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
            data-placeholder="Start writing here..."
          />
        )}
      </div>
      
      {parseResult && (parseResult.errors.length > 0 || parseResult.warnings.length > 0) && (
        <div className="max-w-7xl mx-auto mt-4 p-4">
          {parseResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
              <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
              {parseResult.errors.map((error, index) => (
                <div key={index} className="text-red-700 text-sm">{error}</div>
              ))}
            </div>
          )}
          {parseResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h3 className="font-semibold text-yellow-800 mb-2">Warnings:</h3>
              {parseResult.warnings.map((warning, index) => (
                <div key={index} className="text-yellow-700 text-sm">{warning}</div>
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
        editorMode={editorMode}
      />
    </div>
  );
}

export default MediaWikiEditor;