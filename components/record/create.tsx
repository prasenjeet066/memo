"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Video,
  Table,
  Sigma,
  List,
  ListOrdered,
  Minus,
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

function htmlToWikitext(html: string): string {
  // Simple placeholder converter — replace with your own parser
  return html
    .replace(/<b>(.*?)<\/b>/g, "'''$1'''")
    .replace(/<i>(.*?)<\/i>/g, "''$1''")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/<br\s*\/?>/g, "\n");
}

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState("");
  const [title, setTitle] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [parseResult, setParseResult] = useState<ParseResult>(parseMarkup(""));
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState("");

  // ✅ Popover for success/error
  const [showPopover, setShowPopover] = useState(false);
  const [popoverMessage, setPopoverMessage] = useState("");
  const [popoverType, setPopoverType] = useState<"success" | "error">("success");

  // ✅ Dialog-based prompt
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

  const showNotification = useCallback((msg: string, type: "success" | "error") => {
    setPopoverMessage(msg);
    setPopoverType(type);
    setShowPopover(true);
    setTimeout(() => setShowPopover(false), 3000);
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

  const handleCommand = async (command: string) => {
    const el = visualRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const text = sel.toString();

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
        const target = await showPrompt("লিঙ্ক টার্গেট লিখুন:", text || "পাতার নাম");
        if (target) {
          const a = document.createElement("a");
          a.href = "#" + target;
          a.textContent = text || target;
          range.deleteContents();
          range.insertNode(a);
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
        const vidSrc = await showPrompt("ভিডিও ফাইল নাম:", "example.mp4");
        if (vidSrc) {
          const video = document.createElement("video");
          video.src = vidSrc;
          video.controls = true;
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
    }
    handleVisualInput();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showNotification("দয়া করে একটি শিরোনাম লিখুন", "error");
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      showNotification("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!", "success");
    } catch (err) {
      showNotification("সংরক্ষণে ত্রুটি", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="শিরোনাম লিখুন..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-semibold text-lg"
        />

        <Popover open={showPopover} onOpenChange={setShowPopover}>
          <PopoverTrigger asChild>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "সংরক্ষণ হচ্ছে..." : "প্রকাশ করুন"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className={`text-sm rounded-lg px-4 py-2 shadow-md ${
              popoverType === "success"
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-red-50 border-red-300 text-red-700"
            }`}
          >
            {popoverMessage}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="icon" onClick={() => handleCommand("bold")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleCommand("italic")}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleCommand("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleCommand("link")}>
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleCommand("image")}>
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleCommand("video")}>
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleCommand("math")}>
          <Sigma className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleRedo}>
          <Redo className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={handleModeSwitch}>
          {editorMode === "visual" ? "সোর্স মোড" : "ভিজ্যুয়াল মোড"}
        </Button>
      </div>

      <div className="border rounded-md bg-white p-3 min-h-[400px]">
        {editorMode === "source" ? (
          <textarea
            ref={textareaRef}
            value={wikitext}
            onChange={(e) => setWikitext(e.target.value)}
            className="w-full h-[400px] p-2 border-none outline-none font-mono text-sm resize-none"
          />
        ) : (
          <div
            ref={visualRef}
            contentEditable
            className="w-full min-h-[400px] outline-none"
            onInput={handleVisualInput}
            suppressContentEditableWarning
          />
        )}
      </div>

      {/* Dialog-based Prompt */}
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