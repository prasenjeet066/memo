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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  parseMarkup,
  applyEditorCommand,
  EditorCommands,
  DEFAULT_STYLES,
  type ParseResult,
} from "../../lib/utils/dist/markup";

function setCaretToEnd(el: HTMLElement) {
  if (!el) return;
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [parseResult, setParseResult] = useState<ParseResult>(parseMarkup(""));
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string>("");

  // Popover for alerts
  const [showPopover, setShowPopover] = useState(false);

  // Dialog for prompts
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptLabel, setPromptLabel] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [promptResolve, setPromptResolve] = useState<
    ((value: string | null) => void) | null
  >(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const debounceTimer = useRef<number | null>(null);

  const showPrompt = useCallback((label: string, defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setPromptLabel(label);
      setPromptValue(defaultValue);
      setPromptResolve(() => resolve);
      setPromptOpen(true);
    });
  }, []);

  const updateWikitextDebounced = useCallback((newText: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setWikitext(newText);
      addToHistory(newText);
    }, 300);
  }, []);

  const addToHistory = (text: string) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(text);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setWikitext(history[newIndex]);
      if (editorMode === "visual" && visualRef.current) {
        const result = parseMarkup(history[newIndex]);
        visualRef.current.innerHTML = result.html || "<p><br></p>";
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setWikitext(history[newIndex]);
      if (editorMode === "visual" && visualRef.current) {
        const result = parseMarkup(history[newIndex]);
        visualRef.current.innerHTML = result.html || "<p><br></p>";
      }
    }
  };

  useEffect(() => {
    if (!isUpdatingRef.current) {
      try {
        const result = parseMarkup(wikitext);
        setParseResult(result);
        setWordCount(wikitext.split(/\s+/).filter((w) => w.length > 0).length);
        setError("");
      } catch (err) {
        setError("পার্সিং ত্রুটি: " + (err as Error).message);
      }
    }
  }, [wikitext]);

  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && !isUpdatingRef.current) {
      const content = parseResult.html || "<p><br></p>";
      if (visualRef.current.innerHTML !== content) {
        visualRef.current.innerHTML = content;
      }
    }
  }, [editorMode, parseResult.html]);

  const handleVisualInput = () => {
    if (visualRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      updateWikitextDebounced(newWikitext);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  const handleModeSwitch = () => {
    if (editorMode === "visual" && visualRef.current) {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      setWikitext(newWikitext);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
    setEditorMode(editorMode === "visual" ? "source" : "visual");
  };

  const handleCommand = async (command: string, ...args: any[]) => {
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
          case "link": {
            const linkTarget = await showPrompt(
              "লিঙ্ক টার্গেট লিখুন:",
              text || "পাতার নাম"
            );
            if (linkTarget) {
              const link = document.createElement("a");
              link.href = "#" + linkTarget;
              link.textContent = text || linkTarget;
              range.deleteContents();
              range.insertNode(link);
            }
            break;
          }
          case "image": {
            const imgSrc = await showPrompt("ছবির ফাইল নাম:", "example.jpg");
            if (imgSrc) {
              const caption = await showPrompt("ক্যাপশন (ঐচ্ছিক):", "");
              const img = document.createElement("img");
              img.src = imgSrc;
              img.alt = caption || "";
              range.deleteContents();
              range.insertNode(img);
            }
            break;
          }
          case "video": {
            const videoSrc = await showPrompt("ভিডিও ফাইল নাম:", "example.mp4");
            if (videoSrc) {
              const video = document.createElement("video");
              video.src = videoSrc;
              video.controls = true;
              video.className = "media-video";
              range.deleteContents();
              range.insertNode(video);
            }
            break;
          }
          case "math": {
            const latex = await showPrompt("LaTeX সূত্র:", "E = mc^2");
            if (latex) {
              const math = document.createElement("span");
              math.className = "math-inline";
              math.textContent = latex;
              range.deleteContents();
              range.insertNode(math);
            }
            break;
          }
          case "table": {
            const rows = parseInt((await showPrompt("সারির সংখ্যা:", "3")) || "3");
            const cols = parseInt((await showPrompt("কলামের সংখ্যা:", "3")) || "3");
            const table = document.createElement("table");
            table.className = "wikitable";
            const tbody = document.createElement("tbody");
            const headerRow = document.createElement("tr");
            for (let i = 0; i < cols; i++) {
              const th = document.createElement("th");
              th.textContent = `শিরোনাম ${i + 1}`;
              headerRow.appendChild(th);
            }
            tbody.appendChild(headerRow);
            for (let i = 0; i < rows - 1; i++) {
              const tr = document.createElement("tr");
              for (let j = 0; j < cols; j++) {
                const td = document.createElement("td");
                td.textContent = "তথ্য";
                tr.appendChild(td);
              }
              tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            range.deleteContents();
            range.insertNode(table);
            range.insertNode(document.createElement("br"));
            break;
          }
        }
        handleVisualInput();
      } catch (err) {
        setError("ফরম্যাটিং ত্রুটি: " + (err as Error).message);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
    } catch (err) {
      setError("সংরক্ষণে ত্রুটি: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toolbar icons omitted for brevity...

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header ... (same as before) */}

      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "সংরক্ষণ হচ্ছে..." : "প্রকাশ করুন"}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="text-sm bg-green-50 border-green-300 text-green-700 rounded-lg px-4 py-2 shadow-md"
        >
          ✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!
        </PopoverContent>
      </Popover>

      {/* ...Rest of editor layout... */}

      {/* Prompt Dialog */}
      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{promptLabel}</DialogTitle>
          </DialogHeader>
          <Input
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                promptResolve?.(promptValue.trim() || null);
                setPromptOpen(false);
              }
            }}
            className="mt-2"
            placeholder="এখানে লিখুন..."
            autoFocus
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                promptResolve?.(null);
                setPromptOpen(false);
              }}
            >
              বাতিল
            </Button>
            <Button
              onClick={() => {
                promptResolve?.(promptValue.trim() || null);
                setPromptOpen(false);
              }}
            >
              ঠিক আছে
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper stub
function htmlToWikitext(html: string): string {
  return html; // Replace with your actual converter
}