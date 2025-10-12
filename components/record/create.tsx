import { useState, useRef, useEffect, useCallback } from "react";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Save,
  Undo,
  Redo,
} from "lucide-react";
import {
  parseMarkup,
  htmlToWikitext,
  applyEditorCommand,
  DEFAULT_STYLES,
  type ParseResult,
} from "../../lib/utils/dist/markup";

// Types
interface CursorPosition {
  node: Node | null;
  offset: number;
}

interface MediaWikiEditorProps {
  recordName?: string;
  editingMode?: "visual" | "source";
}

interface DialogState {
  open: boolean;
  type: 'link' | 'image' | 'video' | 'code' | 'math' | 'table' | 'template' | 'reference' | null;
  data: Record<string, string>;
  selection?: string;
}

// Utility Functions
const saveCursorPosition = (el: HTMLElement): CursorPosition | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  
  const range = sel.getRangeAt(0);
  return {
    node: range.startContainer,
    offset: range.startOffset,
  };
};

const restoreCursorPosition = (
  el: HTMLElement,
  position: CursorPosition | null
) => {
  if (!position || !position.node) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return;
  }
  
  try {
    const range = document.createRange();
    range.setStart(
      position.node,
      Math.min(position.offset, position.node.textContent?.length || 0)
    );
    range.collapse(true);
    
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch (e) {
    console.error('Error restoring cursor position:', e);
    el.focus();
  }
};

// Main Component
export function MediaWikiEditor({
  recordName,
  editingMode,
}: MediaWikiEditorProps) {
  // State
  const [wikitext, setWikitext] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [parseResult, setParseResult] = useState<ParseResult>(parseMarkup(""));
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string>("");
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    type: null,
    data: {},
    selection: ''
  });
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const debounceTimer = useRef<number | null>(null);
  const lastWikitextRef = useRef<string>("");
  const cursorPositionRef = useRef<CursorPosition | null>(null);
  
  // Initialize from props
  useEffect(() => {
    if (recordName && editingMode) {
      const validModes: Array<"visual" | "source"> = ["visual", "source"];
      if (validModes.includes(editingMode)) {
        setEditorMode(editingMode);
        setTitle(recordName);
      }
    }
  }, [recordName, editingMode]);
  
  // History management
  const addToHistory = useCallback(
    (text: string) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        if (newHistory[newHistory.length - 1] !== text) {
          newHistory.push(text);
          if (newHistory.length > 50) newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newText = history[newIndex];
      setWikitext(newText);
      lastWikitextRef.current = newText;
      
      if (editorMode === "visual" && visualRef.current) {
        const result = parseMarkup(newText);
        isUpdatingRef.current = true;
        visualRef.current.innerHTML = result.html || "<p><br></p>";
        requestAnimationFrame(() => {
          isUpdatingRef.current = false;
        });
      }
    }
  }, [historyIndex, history, editorMode]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newText = history[newIndex];
      setWikitext(newText);
      lastWikitextRef.current = newText;
      
      if (editorMode === "visual" && visualRef.current) {
        const result = parseMarkup(newText);
        isUpdatingRef.current = true;
        visualRef.current.innerHTML = result.html || "<p><br></p>";
        requestAnimationFrame(() => {
          isUpdatingRef.current = false;
        });
      }
    }
  }, [historyIndex, history, editorMode]);
  
  const handleAutoSave = useCallback(() => {
    if (wikitext && visualRef.current) {
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      if (newWikitext !== lastWikitextRef.current) {
        lastWikitextRef.current = newWikitext;
        setWikitext(newWikitext);
        addToHistory(newWikitext);
      }
    }
  }, [wikitext, addToHistory]);
  
  // Parse wikitext
  useEffect(() => {
    if (!isUpdatingRef.current) {
      try {
        const result = parseMarkup(wikitext);
        setParseResult(result);
        setWordCount(
          wikitext.split(/\s+/).filter((w) => w.length > 0).length
        );
        setError("");
      } catch (err) {
        console.error('Parse error:', err);
        setError("Parsing error: " + (err as Error).message);
      }
    }
  }, [wikitext]);
  
  // Update visual editor
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && !isUpdatingRef.current) {
      const content = parseResult.html || "<p><br></p>";
      
      if (visualRef.current.innerHTML !== content) {
        const cursorPos = saveCursorPosition(visualRef.current);
        visualRef.current.innerHTML = content;
        
        requestAnimationFrame(() => {
          if (visualRef.current) {
            restoreCursorPosition(visualRef.current, cursorPos);
          }
        });
      }
    }
  }, [editorMode, parseResult.html]);
  
  // Visual input handler
  const handleVisualInput = useCallback(() => {
    if (visualRef.current && !isUpdatingRef.current) {
      cursorPositionRef.current = saveCursorPosition(visualRef.current);
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = window.setTimeout(() => {
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
            if (visualRef.current && cursorPositionRef.current) {
              restoreCursorPosition(visualRef.current, cursorPositionRef.current);
            }
          });
        }
      }, 500);
    }
  }, [addToHistory]);
  
  // Mode switch
  const handleModeSwitch = useCallback(() => {
    if (editorMode === "visual" && visualRef.current) {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      setWikitext(newWikitext);
      lastWikitextRef.current = newWikitext;
      addToHistory(newWikitext);
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
      setEditorMode("source");
    } else if (editorMode === "source") {
      const result = parseMarkup(wikitext);
      setParseResult(result);
      requestAnimationFrame(() => {
        if (visualRef.current) {
          visualRef.current.innerHTML = result.html || "<p><br></p>";
        }
      });
      setEditorMode("visual");
    }
  }, [editorMode, wikitext, addToHistory]);
  
  // Open dialog for commands that need input
  const openDialog = useCallback((type: DialogState['type'], selection: string = '') => {
    setDialog({
      open: true,
      type,
      data: {},
      selection
    });
  }, []);
  
  // Close dialog
  const closeDialog = useCallback(() => {
    setDialog({
      open: false,
      type: null,
      data: {},
      selection: ''
    });
  }, []);
  
  // Handle dialog submit
  const handleDialogSubmit = useCallback(() => {
    const { type, data, selection } = dialog;
    
    try {
      if (editorMode === "source") {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        let command = '';
        let args: any[] = [];
        
        switch (type) {
          case 'link':
            if (data.url?.startsWith('http')) {
              command = 'externalLink';
              args = [data.url, data.text || selection];
            } else {
              command = 'internalLink';
              args = [selection || data.text || data.url, data.url];
            }
            break;
          case 'image':
            if (data.caption || data.size) {
              command = 'thumbnail';
              args = [data.filename, data.caption, data.size];
            } else {
              command = 'image';
              args = [data.filename];
            }
            break;
          case 'video':
            command = 'video';
            args = [data.filename, data.caption];
            break;
          case 'code':
            command = 'codeBlock';
            args = [selection || data.code || '// code here', data.language];
            break;
          case 'math':
            command = 'math';
            args = [data.formula];
            break;
          case 'table':
            command = 'table';
            const rows = parseInt(data.rows || '3');
            const cols = parseInt(data.cols || '3');
            const headers = Array(cols).fill('').map((_, i) => `Header ${i + 1}`);
            const tableRows = Array(rows).fill('').map(() => Array(cols).fill('Data'));
            args = [headers, tableRows, data.caption];
            break;
          case 'template':
            command = 'template';
            args = [data.name];
            break;
          case 'reference':
            command = 'reference';
            args = [data.text, data.name];
            break;
        }
        
        if (command) {
          const result = applyEditorCommand(wikitext, command, start, end, ...args);
          setWikitext(result.text);
          lastWikitextRef.current = result.text;
          addToHistory(result.text);
          
          requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
          });
        }
      } else {
        // Visual mode - use execCommand or insert elements
        const el = visualRef.current;
        if (!el) return;
        
        el.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        
        const range = sel.getRangeAt(0);
        
        switch (type) {
          case 'link':
            const link = document.createElement("a");
            link.href = data.url?.startsWith("http") ? data.url : "#" + data.url;
            link.className = data.url?.startsWith("http") ? "external" : "internal";
            link.textContent = data.text || selection || data.url;
            range.deleteContents();
            range.insertNode(link);
            break;
            
          case 'image':
            const figure = document.createElement("figure");
            figure.className = "thumb";
            const img = document.createElement("img");
            img.src = data.filename;
            img.alt = data.caption || "";
            img.className = "media-image";
            if (data.size) img.width = parseInt(data.size);
            figure.appendChild(img);
            if (data.caption) {
              const figcaption = document.createElement("figcaption");
              figcaption.textContent = data.caption;
              figure.appendChild(figcaption);
            }
            range.deleteContents();
            range.insertNode(figure);
            range.insertNode(document.createElement("br"));
            break;
            
          case 'video':
            const video = document.createElement("video");
            video.src = data.filename;
            video.controls = true;
            video.className = "media-video";
            range.deleteContents();
            range.insertNode(video);
            range.insertNode(document.createElement("br"));
            break;
            
          case 'code':
            const pre = document.createElement("pre");
            pre.className = `code-block language-${data.language || "text"}`;
            const codeEl = document.createElement("code");
            codeEl.textContent = selection || data.code || "// code here";
            pre.appendChild(codeEl);
            range.deleteContents();
            range.insertNode(pre);
            range.insertNode(document.createElement("p"));
            break;
            
          case 'math':
            const math = document.createElement("span");
            math.className = "math-inline";
            math.setAttribute("data-tex", data.formula);
            math.textContent = data.formula;
            range.deleteContents();
            range.insertNode(math);
            break;
            
          case 'table':
            const trows = parseInt(data.rows || "3");
            const tcols = parseInt(data.cols || "3");
            const table = document.createElement("table");
            table.className = "wikitable";
            const thead = document.createElement("thead");
            const tbody = document.createElement("tbody");
            
            const headerRow = document.createElement("tr");
            for (let i = 0; i < tcols; i++) {
              const th = document.createElement("th");
              th.textContent = `Header ${i + 1}`;
              headerRow.appendChild(th);
            }
            thead.appendChild(headerRow);
            
            for (let i = 0; i < trows; i++) {
              const tr = document.createElement("tr");
              for (let j = 0; j < tcols; j++) {
                const td = document.createElement("td");
                td.textContent = "Data";
                tr.appendChild(td);
              }
              tbody.appendChild(tr);
            }
            
            table.appendChild(thead);
            table.appendChild(tbody);
            range.deleteContents();
            range.insertNode(table);
            range.insertNode(document.createElement("br"));
            break;
            
          case 'template':
            const tmpl = document.createElement("div");
            tmpl.className = "template";
            tmpl.setAttribute("data-template", data.name);
            tmpl.textContent = `{{${data.name}}}`;
            range.deleteContents();
            range.insertNode(tmpl);
            break;
            
          case 'reference':
            const sup = document.createElement("sup");
            sup.className = "reference";
            sup.textContent = `[${parseResult.metadata.footnotes.length + 1}]`;
            range.deleteContents();
            range.insertNode(sup);
            break;
        }
        
        handleVisualInput();
      }
      
      closeDialog();
    } catch (err) {
      console.error('Dialog submit error:', err);
      setError("Error: " + (err as Error).message);
    }
  }, [dialog, editorMode, wikitext, addToHistory, closeDialog, handleVisualInput, parseResult]);
  
  // Command handler
  const handleCommand = useCallback(
    (command: string, ...args: any[]) => {
      if (editorMode === "source") {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selection = wikitext.substring(start, end);
        
        // Commands that need dialog
        if (['link', 'image', 'video', 'codeBlock', 'math', 'table', 'template', 'reference'].includes(command)) {
          const typeMap: Record<string, DialogState['type']> = {
            'link': 'link',
            'image': 'image',
            'video': 'video',
            'codeBlock': 'code',
            'math': 'math',
            'table': 'table',
            'template': 'template',
            'reference': 'reference'
          };
          openDialog(typeMap[command], selection);
          return;
        }
        
        try {
          const result = applyEditorCommand(wikitext, command, start, end, ...args);
          setWikitext(result.text);
          lastWikitextRef.current = result.text;
          addToHistory(result.text);
          
          requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
          });
        } catch (err) {
          console.error('Command error:', err);
          setError("Command error: " + (err as Error).message);
        }
      } else {
        // Visual mode
        const el = visualRef.current;
        if (!el) return;
        
        el.focus();
        document.execCommand("styleWithCSS", false, "false");
        
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        
        const text = sel.toString();
        
        // Commands that need dialog
        if (['link', 'image', 'video', 'codeBlock', 'math', 'table', 'template', 'reference'].includes(command)) {
          const typeMap: Record<string, DialogState['type']> = {
            'link': 'link',
            'image': 'image',
            'video': 'video',
            'codeBlock': 'code',
            'math': 'math',
            'table': 'table',
            'template': 'template',
            'reference': 'reference'
          };
          openDialog(typeMap[command], text);
          return;
        }
        
        try {
          switch (command) {
            case "bold":
              document.execCommand("bold", false);
              break;
            case "italic":
              document.execCommand("italic", false);
              break;
            case "underline":
              document.execCommand("underline", false);
              break;
            case "strikethrough":
              document.execCommand("strikethrough", false);
              break;
            case "boldItalic":
              document.execCommand("bold", false);
              document.execCommand("italic", false);
              break;
            case "inlineCode":
              if (text) {
                const range = sel.getRangeAt(0);
                const code = document.createElement("code");
                code.className = "inline-code";
                code.textContent = text;
                range.deleteContents();
                range.insertNode(code);
              }
              break;
            case "heading":
              const level = args[0] || 2;
              document.execCommand("formatBlock", false, `h${level}`);
              break;
            case "unorderedList":
              document.execCommand("insertUnorderedList", false);
              break;
            case "orderedList":
              document.execCommand("insertOrderedList", false);
              break;
            case "horizontalRule":
              document.execCommand("insertHorizontalRule", false);
              break;
            case "superscript":
              document.execCommand("superscript", false);
              break;
            case "subscript":
              document.execCommand("subscript", false);
              break;
            case "refList":
              const range = sel.getRangeAt(0);
              const refDiv = document.createElement("div");
              refDiv.className = "reflist";
              const refTitle = document.createElement("h3");
              refTitle.textContent = "References";
              refDiv.appendChild(refTitle);
              range.deleteContents();
              range.insertNode(refDiv);
              range.insertNode(document.createElement("br"));
              break;
          }
          
          handleVisualInput();
        } catch (err) {
          console.error('Formatting error:', err);
          setError("Formatting error: " + (err as Error).message);
        }
      }
    },
    [editorMode, wikitext, addToHistory, handleVisualInput, parseResult, openDialog]
  );
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod) {
        switch (e.key.toLowerCase()) {
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
          case "z":
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case "y":
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    },
    [handleCommand, handleUndo, handleRedo]
  );
  
  // Save handler
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log("Saved:", {
        title,
        wikitext,
        metadata: parseResult.metadata,
        wordCount,
      });
      
      alert("✓ Article saved successfully!");
    } catch (err) {
      console.error('Save error:', err);
      setError("Save error: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [title, wikitext, parseResult.metadata, wordCount]);
  
  // Add missing handleSave to keyboard shortcuts dependency
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleSave]);
  
  // Dialog content renderer
  const renderDialogContent = () => {
    const { type, data } = dialog;
    
    switch (type) {
      case 'link':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-url">Link URL/Page Name</Label>
                <Input
                  id="link-url"
                  value={data.url || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, url: e.target.value }
                  }))}
                  placeholder="https://example.com or Page_Name"
                />
              </div>
              <div>
                <Label htmlFor="link-text">Display Text (optional)</Label>
                <Input
                  id="link-text"
                  value={data.text || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, text: e.target.value }
                  }))}
                  placeholder={dialog.selection || "Link text"}
                />
              </div>
            </div>
          </>
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-filename">Image Filename</Label>
              <Input
                id="image-filename"
                value={data.filename || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, filename: e.target.value }
                }))}
                placeholder="example.jpg"
              />
            </div>
            <div>
              <Label htmlFor="image-caption">Caption (optional)</Label>
              <Input
                id="image-caption"
                value={data.caption || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, caption: e.target.value }
                }))}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label htmlFor="image-size">Size (optional)</Label>
              <Input
                id="image-size"
                value={data.size || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, size: e.target.value }
                }))}
                placeholder="300px"
              />
            </div>
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-filename">Video Filename</Label>
              <Input
                id="video-filename"
                value={data.filename || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, filename: e.target.value }
                }))}
                placeholder="example.mp4"
              />
            </div>
            <div>
              <Label htmlFor="video-caption">Caption (optional)</Label>
              <Input
                id="video-caption"
                value={data.caption || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, caption: e.target.value }
                }))}
                placeholder="Video description"
              />
            </div>
          </div>
        );
        
      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code-language">Programming Language</Label>
              <Input
                id="code-language"
                value={data.language || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, language: e.target.value }
                }))}
                placeholder="javascript"
              />
            </div>
            <div>
              <Label htmlFor="code-content">Code (optional - uses selection)</Label>
              <Input
                id="code-content"
                value={data.code || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, code: e.target.value }
                }))}
                placeholder="// code here"
              />
            </div>
          </div>
        );
        
      case 'math':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="math-formula">LaTeX Formula</Label>
              <Input
                id="math-formula"
                value={data.formula || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, formula: e.target.value }
                }))}
                placeholder="E = mc^2"
              />
            </div>
          </div>
        );
        
      case 'table':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-rows">Number of Rows</Label>
              <Input
                id="table-rows"
                type="number"
                value={data.rows || '3'}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, rows: e.target.value }
                }))}
                min="1"
                max="20"
              />
            </div>
            <div>
              <Label htmlFor="table-cols">Number of Columns</Label>
              <Input
                id="table-cols"
                type="number"
                value={data.cols || '3'}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, cols: e.target.value }
                }))}
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="table-caption">Caption (optional)</Label>
              <Input
                id="table-caption"
                value={data.caption || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, caption: e.target.value }
                }))}
                placeholder="Table title"
              />
            </div>
          </div>
        );
        
      case 'template':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={data.name || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, name: e.target.value }
                }))}
                placeholder="Infobox"
              />
            </div>
          </div>
        );
        
      case 'reference':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ref-text">Reference Content</Label>
              <Input
                id="ref-text"
                value={data.text || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, text: e.target.value }
                }))}
                placeholder="Reference text"
              />
            </div>
            <div>
              <Label htmlFor="ref-name">Name (optional - for reuse)</Label>
              <Input
                id="ref-name"
                value={data.name || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, name: e.target.value }
                }))}
                placeholder="ref1"
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const getDialogTitle = () => {
    switch (dialog.type) {
      case 'link': return 'Add Link';
      case 'image': return 'Add Image';
      case 'video': return 'Add Video';
      case 'code': return 'Add Code Block';
      case 'math': return 'Add Math Formula';
      case 'table': return 'Add Table';
      case 'template': return 'Add Template';
      case 'reference': return 'Add Reference';
      default: return '';
    }
  };
  
  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <List className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg font-semibold truncate">
                {recordName || "New Article"}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Undo className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Redo className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>
              
              <div className="h-6 w-px bg-gray-300 mx-1" />
              
              <span className="text-xs text-gray-500 px-2 hidden sm:inline">
                {editorMode === "visual" ? "Visual" : "Source"} • {wordCount} words
              </span>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleModeSwitch}
                    className="p-2 hover:bg-gray-100 rounded transition border"
                  >
                    <Languages className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Switch Editor Mode</TooltipContent>
              </Tooltip>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Publish"}
              </Button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="bg-white sticky top-0 z-10 border-b">
          <div className="flex items-center gap-1 p-2 overflow-x-auto">
            {/* Text Formatting */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("bold")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Bold className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Bold (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("italic")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Italic className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Italic (Ctrl+I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("boldItalic")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Type className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Bold Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("underline")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Underline className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Underline (Ctrl+U)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("strikethrough")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Strikethrough className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Strikethrough</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Headings */}
            <Select
              onValueChange={(value) => {
                const level = parseInt(value);
                handleCommand("heading", level);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-sm flex-shrink-0">
                <SelectValue placeholder="Heading" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">
                  <div className="flex items-center gap-2">
                    <Heading1 className="h-4 w-4" />
                    <span>Heading 2</span>
                  </div>
                </SelectItem>
                <SelectItem value="3">
                  <div className="flex items-center gap-2">
                    <Heading2 className="h-4 w-4" />
                    <span>Heading 3</span>
                  </div>
                </SelectItem>
                <SelectItem value="4">
                  <div className="flex items-center gap-2">
                    <Heading3 className="h-4 w-4" />
                    <span>Heading 4</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Code */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("inlineCode")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Code className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Inline Code</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("codeBlock")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <FileCode className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Code Block</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Links & Media */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("link")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Link className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Link (Ctrl+K)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("image")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Image className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("video")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Video className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Video</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Lists */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("unorderedList")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <List className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("orderedList")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Advanced */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("table")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Table className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Table</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("math")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Sigma className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Math Formula</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("template")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Puzzle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Template</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Special */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("horizontalRule")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Horizontal Line</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("superscript")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Superscript className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Superscript</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("subscript")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <Subscript className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Subscript</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* References */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("reference")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Reference</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCommand("refList")}
                  className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                >
                  <ListChecks className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Reference List</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Editor Area */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto">
            {editorMode === "source" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Source Editor */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={wikitext}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setWikitext(newText);
                      lastWikitextRef.current = newText;
                      addToHistory(newText);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full min-h-[70vh] p-4 outline-none text-sm font-mono resize-none"
                    placeholder="Write wikitext here..."
                  />
                </div>

                {/* Preview */}
                <div className="bg-white border rounded-lg overflow-auto">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-2 border-b">
                      Preview
                    </h3>
                    <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
                    <div
                      className="min-h-[65vh]"
                      dangerouslySetInnerHTML={{
                        __html:
                          parseResult.html ||
                          '<p class="text-gray-400">Preview will appear here...</p>',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Visual WYSIWYG Editor */
              <div className="bg-white border rounded-lg overflow-hidden">
                <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
                <div
                  ref={visualRef}
                  onBlur={handleAutoSave}
                  onInput={handleVisualInput}
                  onKeyDown={handleKeyDown}
                  className="min-h-[70vh] p-4 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                  data-placeholder="Start writing here..."
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="sm:max-w-[425px] bg-white border-none">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>
                Fill in the required information
              </DialogDescription>
            </DialogHeader>
            {renderDialogContent()}
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleDialogSubmit}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default MediaWikiEditor;