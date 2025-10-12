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

interface ToolbarItem {
  icon: any;
  action: string;
  label: string;
  args?: any[];
}

interface ToolbarBlock {
  name?: string;
  items?: ToolbarItem[];
  icon?: any;
  action?: string;
  label?: string;
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
        setError("পার্সিং ত্রুটি: " + (err as Error).message);
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
        let command = type || '';
        let args: any[] = [];
        
        switch (type) {
          case 'link':
            command = data.url?.startsWith('http') ? 'externalLink' : 'internalLink';
            args = [data.url || selection, data.text || selection];
            break;
          case 'image':
            command = data.caption ? 'thumbnail' : 'image';
            args = data.caption 
              ? [data.filename, data.caption, data.size]
              : [data.filename, data.size];
            break;
          case 'video':
            command = 'video';
            args = [data.filename, data.caption];
            break;
          case 'code':
            command = 'codeBlock';
            args = [selection || data.code, data.language];
            break;
          case 'math':
            command = 'math';
            args = [data.formula];
            break;
          case 'table':
            command = 'table';
            const rows = parseInt(data.rows || '3');
            const cols = parseInt(data.cols || '3');
            const headers = Array(cols).fill('').map((_, i) => `শিরোনাম ${i + 1}`);
            const tableRows = Array(rows).fill('').map(() => Array(cols).fill('তথ্য'));
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
        
        const result = applyEditorCommand(wikitext, command, start, end, ...args);
        setWikitext(result.text);
        lastWikitextRef.current = result.text;
        addToHistory(result.text);
        
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
        });
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
            codeEl.textContent = selection || data.code || "// কোড এখানে লিখুন";
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
            const rows = parseInt(data.rows || "3");
            const cols = parseInt(data.cols || "3");
            const table = document.createElement("table");
            table.className = "wikitable";
            const thead = document.createElement("thead");
            const tbody = document.createElement("tbody");
            
            const headerRow = document.createElement("tr");
            for (let i = 0; i < cols; i++) {
              const th = document.createElement("th");
              th.textContent = `শিরোনাম ${i + 1}`;
              headerRow.appendChild(th);
            }
            thead.appendChild(headerRow);
            
            for (let i = 0; i < rows; i++) {
              const tr = document.createElement("tr");
              for (let j = 0; j < cols; j++) {
                const td = document.createElement("td");
                td.textContent = "তথ্য";
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
      setError("ত্রুটি: " + (err as Error).message);
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
          setError("কমান্ড ত্রুটি: " + (err as Error).message);
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
              refTitle.textContent = "তথ্যসূত্র";
              refDiv.appendChild(refTitle);
              range.deleteContents();
              range.insertNode(refDiv);
              range.insertNode(document.createElement("br"));
              break;
          }
          
          handleVisualInput();
        } catch (err) {
          console.error('Formatting error:', err);
          setError("ফরম্যাটিং ত্রুটি: " + (err as Error).message);
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
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log("সংরক্ষিত:", {
        title,
        wikitext,
        metadata: parseResult.metadata,
        wordCount,
      });
      
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err) {
      console.error('Save error:', err);
      setError("সংরক্ষণে ত্রুটি: " + (err as Error).message);
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
  
  // Toolbar configuration
  const toolbarBlocks: ToolbarBlock[] = [
    { icon: Bold, action: "bold", label: "বোল্ড (Ctrl+B)" },
    { icon: Italic, action: "italic", label: "ইটালিক (Ctrl+I)" },
    {
      name: "শিরোনাম",
      items: [
        { icon: Heading1, action: "heading", label: "শিরোনাম ২", args: [2] },
        { icon: Heading2, action: "heading", label: "শিরোনাম ৩", args: [3] },
        { icon: Heading3, action: "heading", label: "শিরোনাম ৪", args: [4] },
      ],
    },
    { icon: Type, action: "boldItalic", label: "বোল্ড ইটালিক" },
    { icon: Strikethrough, action: "strikethrough", label: "স্ট্রাইকথ্রু" },
    { icon: Underline, action: "underline", label: "আন্ডারলাইন (Ctrl+U)" },
    { icon: Code, action: "inlineCode", label: "ইনলাইন কোড" },
    { icon: Link, action: "link", label: "লিঙ্ক (Ctrl+K)" },
    { icon: Image, action: "image", label: "ছবি" },
    { icon: Video, action: "video", label: "ভিডিও" },
    { icon: FileCode, action: "codeBlock", label: "কোড ব্লক" },
    { icon: Sigma, action: "math", label: "গণিত" },
    { icon: List, action: "unorderedList", label: "বুলেট তালিকা" },
    { icon: ListOrdered, action: "orderedList", label: "সংখ্যাযুক্ত তালিকা" },
    { icon: Table, action: "table", label: "টেবিল" },
    { icon: Puzzle, action: "template", label: "টেমপ্লেট" },
    { icon: Minus, action: "horizontalRule", label: "অনুভূমিক রেখা" },
    { icon: Superscript, action: "superscript", label: "সুপারস্ক্রিপ্ট" },
    { icon: Subscript, action: "subscript", label: "সাবস্ক্রিপ্ট" },
    { icon: FileText, action: "reference", label: "তথ্যসূত্র" },
    { icon: ListChecks, action: "refList", label: "তথ্যসূত্র তালিকা" },
  ];
  
  // Dialog content renderer
  const renderDialogContent = () => {
    const { type, data } = dialog;
    
    switch (type) {
      case 'link':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-url">লিঙ্ক URL/পাতার নাম</Label>
                <Input
                  id="link-url"
                  value={data.url || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, url: e.target.value }
                  }))}
                  placeholder="https://example.com অথবা পাতার_নাম"
                />
              </div>
              <div>
                <Label htmlFor="link-text">প্রদর্শন টেক্সট (ঐচ্ছিক)</Label>
                <Input
                  id="link-text"
                  value={data.text || ''}
                  onChange={(e) => setDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, text: e.target.value }
                  }))}
                  placeholder={dialog.selection || "লিঙ্ক টেক্সট"}
                />
              </div>
            </div>
          </>
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-filename">ছবির ফাইল নাম</Label>
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
              <Label htmlFor="image-caption">ক্যাপশন (ঐচ্ছিক)</Label>
              <Input
                id="image-caption"
                value={data.caption || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, caption: e.target.value }
                }))}
                placeholder="ছবির বিবরণ"
              />
            </div>
            <div>
              <Label htmlFor="image-size">আকার (ঐচ্ছিক)</Label>
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
              <Label htmlFor="video-filename">ভিডিও ফাইল নাম</Label>
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
              <Label htmlFor="video-caption">ক্যাপশন (ঐচ্ছিক)</Label>
              <Input
                id="video-caption"
                value={data.caption || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, caption: e.target.value }
                }))}
                placeholder="ভিডিওর বিবরণ"
              />
            </div>
          </div>
        );
        
      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code-language">প্রোগ্রামিং ভাষা</Label>
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
              <Label htmlFor="code-content">কোড (ঐচ্ছিক - নির্বাচিত টেক্সট ব্যবহার হবে)</Label>
              <Input
                id="code-content"
                value={data.code || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, code: e.target.value }
                }))}
                placeholder="// কোড এখানে"
              />
            </div>
          </div>
        );
        
      case 'math':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="math-formula">LaTeX সূত্র</Label>
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
              <Label htmlFor="table-rows">সারির সংখ্যা</Label>
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
              <Label htmlFor="table-cols">কলামের সংখ্যা</Label>
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
              <Label htmlFor="table-caption">ক্যাপশন (ঐচ্ছিক)</Label>
              <Input
                id="table-caption"
                value={data.caption || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, caption: e.target.value }
                }))}
                placeholder="টেবিলের শিরোনাম"
              />
            </div>
          </div>
        );
        
      case 'template':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">টেমপ্লেটের নাম</Label>
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
              <Label htmlFor="ref-text">তথ্যসূত্রের বিষয়বস্তু</Label>
              <Input
                id="ref-text"
                value={data.text || ''}
                onChange={(e) => setDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, text: e.target.value }
                }))}
                placeholder="তথ্যসূত্রের টেক্সট"
              />
            </div>
            <div>
              <Label htmlFor="ref-name">নাম (ঐচ্ছিক - পুনরায় ব্যবহারের জন্য)</Label>
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
      case 'link': return 'লিঙ্ক যোগ করুন';
      case 'image': return 'ছবি যোগ করুন';
      case 'video': return 'ভিডিও যোগ করুন';
      case 'code': return 'কোড ব্লক যোগ করুন';
      case 'math': return 'গণিত সূত্র যোগ করুন';
      case 'table': return 'টেবিল যোগ করুন';
      case 'template': return 'টেমপ্লেট যোগ করুন';
      case 'reference': return 'তথ্যসূত্র যোগ করুন';
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
                {recordName || "নতুন নিবন্ধ"}
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
                <TooltipContent>পূর্বাবস্থায় ফিরুন (Ctrl+Z)</TooltipContent>
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
                <TooltipContent>পুনরায় করুন (Ctrl+Y)</TooltipContent>
              </Tooltip>
              
              <div className="h-6 w-px bg-gray-300 mx-1" />
              
              <span className="text-xs text-gray-500 px-2 hidden sm:inline">
                {editorMode === "visual" ? "ভিজুয়াল" : "সোর্স"} • {wordCount} শব্দ
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
                <TooltipContent>এডিটর মোড পরিবর্তন করুন</TooltipContent>
              </Tooltip>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "সংরক্ষণ হচ্ছে..." : "প্রকাশ করুন"}
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
            {toolbarBlocks.map((block, i) =>
              !block.name ? (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => block.action && handleCommand(block.action)}
                      className="p-2 hover:bg-blue-50 rounded transition active:bg-blue-100 flex-shrink-0"
                    >
                      {block.icon && <block.icon className="h-4 w-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{block.label}</TooltipContent>
                </Tooltip>
              ) : (
                <Select
                  key={i}
                  onValueChange={(value) => {
                    if (value && block.items) {
                      const item = block.items.find((itm) => itm.action === value);
                      handleCommand(value, ...(item?.args || []));
                    }
                  }}
                >
                  <SelectTrigger className="w-[150px] h-9 text-sm flex-shrink-0">
                    <SelectValue placeholder={block.name} />
                  </SelectTrigger>
                  <SelectContent>
                    {block.items?.map((item, idx) => (
                      <SelectItem key={idx} value={item.action}>
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            )}
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
                    placeholder="উইকিটেক্সট এখানে লিখুন..."
                  />
                </div>

                {/* Preview */}
                <div className="bg-white border rounded-lg overflow-auto">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-2 border-b">
                      প্রিভিউ
                    </h3>
                    <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
                    <div
                      className="min-h-[65vh]"
                      dangerouslySetInnerHTML={{
                        __html:
                          parseResult.html ||
                          '<p class="text-gray-400">প্রিভিউ এখানে দেখা যাবে...</p>',
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
                  data-placeholder="এখানে লেখা শুরু করুন..."
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}

        {/* Dialog */}
        <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="sm:max-w-[425px] bg-white border-none">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>
                প্রয়োজনীয় তথ্য পূরণ করুন
              </DialogDescription>
            </DialogHeader>
            {renderDialogContent()}
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                বাতিল
              </Button>
              <Button onClick={handleDialogSubmit}>
                যোগ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default MediaWikiEditor;