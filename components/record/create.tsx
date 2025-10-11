import { useState, useRef, useEffect, useCallback } from "react";
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
  args ? : any[];
}

interface ToolbarBlock {
  name ? : string;
  items ? : ToolbarItem[];
  icon ? : any;
  action ? : string;
  label ? : string;
}

interface MediaWikiEditorProps {
  recordName ? : string;
  editingMode ? : "visual" | "source";
}

// Utility Functions
const htmlToWikitext = (html: string): string => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  const processNode = (node: Node, parentTag: string = ""): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }
    
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    const children = Array.from(element.childNodes)
      .map((child) => processNode(child, tagName))
      .join("");
    
    switch (tagName) {
      case "strong":
      case "b":
        return `'''${children}'''`;
        
      case "em":
      case "i":
        return `''${children}''`;
        
      case "del":
      case "s":
        return `<s>${children}</s>`;
        
      case "ins":
      case "u":
        return `<u>${children}</u>`;
        
      case "code":
        if (element.classList.contains("inline-code")) {
          return `<code>${children}</code>`;
        }
        return children;
        
      case "pre":
        const lang =
          Array.from(element.classList)
          .find((c) => c.startsWith("language-"))
          ?.replace("language-", "") || "text";
        const codeContent =
          element.querySelector("code")?.textContent ||
          element.textContent ||
          "";
        return `\n<syntaxhighlight lang="${lang}">\n${codeContent}\n</syntaxhighlight>\n`;
        
      case "h1":
        return `\n= ${children} =\n`;
      case "h2":
        return `\n== ${children} ==\n`;
      case "h3":
        return `\n=== ${children} ===\n`;
      case "h4":
        return `\n==== ${children} ====\n`;
      case "h5":
        return `\n===== ${children} =====\n`;
      case "h6":
        return `\n====== ${children} ======\n`;
        
      case "a":
        const href = element.getAttribute("href") || "";
        const isExternal = href.startsWith("http");
        
        if (isExternal) {
          return children === href ? `[${href}]` : `[${href} ${children}]`;
        }
        
        const cleanHref = href.replace(/^#/, "");
        return children === cleanHref ?
          `[[${children}]]` :
          `[[${cleanHref}|${children}]]`;
        
      case "img":
        const src = element.getAttribute("src") || "";
        const alt = element.getAttribute("alt") || "";
        const parent = element.parentElement;
        
        if (
          parent?.tagName.toLowerCase() === "figure" &&
          parent.classList.contains("thumb")
        ) {
          const caption = parent.querySelector("figcaption")?.textContent || alt;
          return `[[File:${src}|thumb|${caption}]]`;
        }
        
        return alt ? `[[File:${src}|${alt}]]` : `[[File:${src}]]`;
        
      case "figure":
        if (element.classList.contains("thumb")) {
          const img = element.querySelector("img");
          const caption = element.querySelector("figcaption")?.textContent || "";
          const src = img?.getAttribute("src") || "";
          return `\n[[File:${src}|thumb|${caption}]]\n`;
        }
        return children;
        
      case "ul":
        const ulItems = Array.from(element.children)
          .filter((child) => child.tagName.toLowerCase() === "li")
          .map((li) => `* ${processNode(li, "ul")}`)
          .join("\n");
        return `\n${ulItems}\n`;
        
      case "ol":
        const olItems = Array.from(element.children)
          .filter((child) => child.tagName.toLowerCase() === "li")
          .map((li) => `# ${processNode(li, "ol")}`)
          .join("\n");
        return `\n${olItems}\n`;
        
      case "li":
        return children;
        
      case "table":
        let tableWiki = '\n{| class="wikitable"\n';
        
        const caption = element.querySelector("caption");
        if (caption) {
          tableWiki += `|+ ${caption.textContent}\n`;
        }
        
        const thead = element.querySelector("thead");
        if (thead) {
          const headerRow = thead.querySelector("tr");
          if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll("th")).map(
              (th) => th.textContent?.trim() || ""
            );
            if (headers.length > 0) {
              tableWiki += "! " + headers.join(" !! ") + "\n";
            }
          }
        }
        
        const tbody = element.querySelector("tbody") || element;
        const rows = Array.from(tbody.querySelectorAll("tr")).filter(
          (row) => !row.closest("thead")
        );
        
        rows.forEach((row) => {
          tableWiki += "|-\n";
          const cells = Array.from(row.querySelectorAll("td")).map(
            (td) => td.textContent?.trim() || ""
          );
          if (cells.length > 0) {
            tableWiki += "| " + cells.join(" || ") + "\n";
          }
        });
        
        tableWiki += "|}\n";
        return tableWiki;
        
      case "hr":
        return "\n----\n";
        
      case "sup":
        if (element.classList.contains("reference")) {
          return "";
        }
        return `<sup>${children}</sup>`;
        
      case "sub":
        return `<sub>${children}</sub>`;
        
      case "p":
        return children + "\n\n";
        
      case "br":
        return "\n";
        
      case "div":
        if (element.classList.contains("template")) {
          const templateName =
            element.getAttribute("data-template") || "Template";
          return `{{${templateName}}}`;
        }
        if (element.classList.contains("reflist")) {
          return "\n{{reflist}}\n";
        }
        if (element.classList.contains("math-inline")) {
          const tex =
            element.getAttribute("data-tex") || element.textContent || "";
          return `<math>${tex}</math>`;
        }
        return children;
        
      case "span":
        if (element.classList.contains("math-inline")) {
          const tex =
            element.getAttribute("data-tex") || element.textContent || "";
          return `<math>${tex}</math>`;
        }
        return children;
        
      case "video":
        const videoSrc = element.getAttribute("src") || "";
        return `[[Media:${videoSrc}]]`;
        
      case "audio":
        const audioSrc = element.getAttribute("src") || "";
        return `[[Media:${audioSrc}]]`;
        
      default:
        return children;
    }
  };
  
  let result = processNode(tempDiv);
  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return result;
};

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
    el.focus();
  }
};

// Main Component
export default function MediaWikiEditor({
  recordName,
  editingMode,
}: MediaWikiEditorProps) {
  // State
  const [wikitext, setWikitext] = useState < string > ("");
  const [title, setTitle] = useState < string > ("");
  const [editorMode, setEditorMode] = useState < "visual" | "source" > ("visual");
  const [parseResult, setParseResult] = useState < ParseResult > (parseMarkup(""));
  const [history, setHistory] = useState < string[] > ([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState < string > ("");
  
  // Refs
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  const visualRef = useRef < HTMLDivElement > (null);
  const isUpdatingRef = useRef(false);
  const debounceTimer = useRef < number | null > (null);
  const lastWikitextRef = useRef < string > ("");
  const cursorPositionRef = useRef < CursorPosition | null > (null);
  
  // Initialize from props
  useEffect(() => {
    if (recordName && editingMode) {
      const validModes: Array < "visual" | "source" > = ["visual", "source"];
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
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
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
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  }, [historyIndex, history, editorMode]);
  
  const handleAutoSave = useCallback(()=>{
    if (wikitext) {
      
      setWikitext((prev)=>prev+'')
      lastWikitextRef.current = wikitext;
      addToHistory(wikitext);
    }
  },[wikitext])
  
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
        
        setTimeout(() => {
          if (visualRef.current) {
            restoreCursorPosition(visualRef.current, cursorPos);
          }
        }, 0);
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
          
          setTimeout(() => {
            isUpdatingRef.current = false;
            if (visualRef.current && cursorPositionRef.current) {
              restoreCursorPosition(visualRef.current, cursorPositionRef.current);
            }
          }, 50);
        }
      }, 500);
    }
  }, [addToHistory]);
  
  // Mode switch
  const handleModeSwitch = useCallback(() => {
    if (editorMode === "visual" && visualRef.current) {
      // Visual → Source
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      setWikitext(newWikitext);
      lastWikitextRef.current = newWikitext;
      addToHistory(newWikitext);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
      setEditorMode("source");
    } else if (editorMode === "source") {
      // Source → Visual
      const result = parseMarkup(wikitext);
      setParseResult(result);
      setTimeout(() => {
        if (visualRef.current) {
          visualRef.current.innerHTML = result.html || "<p><br></p>";
        }
      }, 0);
      setEditorMode("visual");
    }
  }, [editorMode, wikitext, addToHistory]);
  
  // Command handler
  const handleCommand = useCallback(
    (command: string, ...args: any[]) => {
      if (editorMode === "source") {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        try {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const result = applyEditorCommand(
            wikitext,
            command,
            start,
            end,
            ...args
          );
          setWikitext(result.text);
          lastWikitextRef.current = result.text;
          addToHistory(result.text);
          
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
              result.newSelectionStart,
              result.newSelectionEnd
            );
          }, 0);
        } catch (err) {
          setError("কমান্ড ত্রুটি: " + (err as Error).message);
        }
      } else {
        const el = visualRef.current;
        if (!el) return;
        
        el.focus();
        document.execCommand("styleWithCSS", false, "false");
        
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        
        const range = sel.getRangeAt(0);
        const text = sel.toString();
        
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
            case "link":
              const linkTarget = prompt(
                "লিঙ্ক টার্গেট লিখুন:",
                text || "পাতার নাম"
              );
              if (linkTarget) {
                const link = document.createElement("a");
                link.href = linkTarget.startsWith("http") ?
                  linkTarget :
                  "#" + linkTarget;
                link.className = linkTarget.startsWith("http") ?
                  "external" :
                  "internal";
                link.textContent = text || linkTarget;
                range.deleteContents();
                range.insertNode(link);
              }
              break;
            case "image":
              const imgSrc = prompt("ছবির ফাইল নাম:", "example.jpg");
              if (imgSrc) {
                const caption = prompt("ক্যাপশন (ঐচ্ছিক):", "");
                const figure = document.createElement("figure");
                figure.className = "thumb";
                const img = document.createElement("img");
                img.src = imgSrc;
                img.alt = caption || "";
                img.className = "media-image";
                figure.appendChild(img);
                if (caption) {
                  const figcaption = document.createElement("figcaption");
                  figcaption.textContent = caption;
                  figure.appendChild(figcaption);
                }
                range.deleteContents();
                range.insertNode(figure);
                range.insertNode(document.createElement("br"));
              }
              break;
            case "video":
              const videoSrc = prompt("ভিডিও ফাইল নাম:", "example.mp4");
              if (videoSrc) {
                const video = document.createElement("video");
                video.src = videoSrc;
                video.controls = true;
                video.className = "media-video";
                range.deleteContents();
                range.insertNode(video);
                range.insertNode(document.createElement("br"));
              }
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
            case "codeBlock":
              const lang = prompt("প্রোগ্রামিং ভাষা:", "javascript");
              const pre = document.createElement("pre");
              pre.className = `code-block language-${lang || "text"}`;
              const codeEl = document.createElement("code");
              codeEl.textContent = text || "// কোড এখানে লিখুন";
              pre.appendChild(codeEl);
              range.deleteContents();
              range.insertNode(pre);
              range.insertNode(document.createElement("p"));
              range.insertNode(document.createElement("br"));
              break;
            case "math":
              const latex = prompt("LaTeX সূত্র:", "E = mc^2");
              if (latex) {
                const math = document.createElement("span");
                math.className = "math-inline";
                math.setAttribute("data-tex", latex);
                math.textContent = latex;
                range.deleteContents();
                range.insertNode(math);
              }
              break;
            case "table":
              const rows = parseInt(prompt("সারির সংখ্যা:", "3") || "3");
              const cols = parseInt(prompt("কলামের সংখ্যা:", "3") || "3");
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
            case "template":
              const templateName = prompt("টেমপ্লেটের নাম:", "Infobox");
              if (templateName) {
                const tmpl = document.createElement("div");
                tmpl.className = "template";
                tmpl.setAttribute("data-template", templateName);
                tmpl.textContent = `{{${templateName}}}`;
                range.deleteContents();
                range.insertNode(tmpl);
              }
              break;
            case "reference":
              const refText = prompt("তথ্যসূত্রের বিষয়বস্তু:");
              if (refText) {
                const sup = document.createElement("sup");
                sup.className = "reference";
                sup.textContent = `[${parseResult.metadata.footnotes.length + 1}]`;
                range.deleteContents();
                range.insertNode(sup);
              }
              break;
            case "refList":
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
          setError("ফরম্যাটিং ত্রুটি: " + (err as Error).message);
        }
      }
    },
    [editorMode, wikitext, addToHistory, handleVisualInput, parseResult]
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
      setError("সংরক্ষণে ত্রুটি: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [title, wikitext, parseResult.metadata, wordCount]);
  
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
  
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3 flex-1">
            <List className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold">{recordName || "নতুন নিবন্ধ"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-30"
              title="পূর্বাবস্থায় ফিরুন (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-30"
              title="পুনরায় করুন (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <span className="text-xs text-gray-500 px-2">
              {editorMode === "visual" ? "ভিজুয়াল" : "সোর্স"} • {wordCount} শব্দ
            </span>
            <button
              onClick={handleModeSwitch}
              className="p-2 hover:bg-gray-100 rounded transition border"
              title="এডিটর মোড পরিবর্তন করুন"
            >
              <Languages className="h-5 w-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "সংরক্ষণ হচ্ছে..." : "প্রকাশ করুন"}
            </button>
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
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center flex-wrap gap-1 border-t border-b p-2">
          {toolbarBlocks.map((block, i) =>
            !block.name ? (
              <button
                key={i}
                onClick={() => block.action && handleCommand(block.action)}
                className="p-2  hover:bg-blue-50 transition active:bg-blue-100"
                title={block.label}
              >
                {block.icon && <block.icon className="h-4 w-4" />}
              </button>
            ) : (
              <select
                key={i}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && block.items) {
                    const item = block.items.find((itm) => itm.action === value);
                    handleCommand(value, ...(item?.args || []));
                    e.target.value = "";
                  }
                }}
                className="p-2 border rounded hover:bg-gray-50 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  {block.name}
                </option>
                {block.items?.map((item, idx) => (
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
      <div className="flex gap-4">
        {editorMode === "source" && (
          <>
            {/* Source Editor */}
            <div className="flex-1">
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
                className="w-full min-h-[70vh]  outline-none text-sm font-mono bg-white border rounded-lg focus:border-blue-500 resize-none"
                placeholder="উইকিটেক্সট এখানে লিখুন..."
              />
            </div>

            {/* Preview */}
            <div className="flex-1 bg-white border rounded-lg overflow-auto min-h-[70vh]">
              <div className="">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-2 border-b">
                  প্রিভিউ
                </h3>
                <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      parseResult.html ||
                      '<p class="text-gray-400">প্রিভিউ এখানে দেখা যাবে...</p>',
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Visual WYSIWYG Editor */}
        {editorMode === "visual" && (
          <div className="flex-1 bg-white border rounded-lg p-2">
            <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
            <div
              ref={visualRef}
              onBlur={handleAutoSave}
              onInput={handleVisualInput}
              onKeyDown={handleKeyDown}
              className="min-h-[70vh]  outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
              data-placeholder="এখানে লেখা শুরু করুন..."
              contentEditable
              suppressContentEditableWarning
              spellCheck={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}