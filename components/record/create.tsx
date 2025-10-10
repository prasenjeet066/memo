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
// Import MediaWiki markup utilities
import {
  parseMarkup,
  applyEditorCommand,
  EditorCommands,
  DEFAULT_STYLES,
  type ParseResult,
} from "../../lib/utils/dist/markup";

// Helper: Set caret position
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

function htmlToWikitext (text){
  return text
}
// Helper: Get current selection info
function getSelectionInfo(el: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  
  const range = sel.getRangeAt(0);
  return {
    range,
    text: sel.toString(),
    hasSelection: sel.toString().length > 0
  };
}

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState < string > ("");
  const [title, setTitle] = useState < string > ("");
  const [editorMode, setEditorMode] = useState < "visual" | "source" > ("visual");
  const [parseResult, setParseResult] = useState < ParseResult > (parseMarkup(""));
  const [history, setHistory] = useState < string[] > ([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState < string > ("");
  
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  const visualRef = useRef < HTMLDivElement > (null);
  const isUpdatingRef = useRef(false);
  const debounceTimer = useRef < number | null > (null);
  
  // Debounced wikitext update
  const updateWikitextDebounced = useCallback((newText: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setWikitext(newText);
      addToHistory(newText);
    }, 300);
  }, []);
  
  // Add to history
  const addToHistory = (text: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(text);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };
  
  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setWikitext(history[newIndex]);
      if (editorMode === "visual" && visualRef.current) {
        const result = parseMarkup(history[newIndex]);
        visualRef.current.innerHTML = result.html || '<p><br></p>';
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
        visualRef.current.innerHTML = result.html || '<p><br></p>';
      }
    }
  };
  
  // Parse wikitext
  useEffect(() => {
    if (!isUpdatingRef.current) {
      try {
        const result = parseMarkup(wikitext);
        setParseResult(result);
        setWordCount(wikitext.split(/\s+/).filter(w => w.length > 0).length);
        setError("");
      } catch (err) {
        setError("পার্সিং ত্রুটি: " + (err as Error).message);
      }
    }
  }, [wikitext]);
  
  // Update visual editor
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && !isUpdatingRef.current) {
      const content = parseResult.html || '<p><br></p>';
      if (visualRef.current.innerHTML !== content) {
        visualRef.current.innerHTML = content;
      }
    }
  }, [editorMode, parseResult.html]);
  
  // Handle visual input
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
  
  // Switch modes
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
  
  // Toolbar command handler
  const handleCommand = (command: string, ...args: any[]) => {
    if (editorMode === "source") {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      try {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const result = applyEditorCommand(wikitext, command, start, end, ...args);
        setWikitext(result.text);
        addToHistory(result.text);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
        }, 0);
      } catch (err) {
        setError("কমান্ড ত্রুটি: " + (err as Error).message);
      }
    } else {
      const el = visualRef.current;
      if (!el) return;
      
      el.focus();
      document.execCommand('styleWithCSS', false, 'false');
      
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      
      const range = sel.getRangeAt(0);
      const text = sel.toString();
      
      try {
        switch (command) {
          case "bold":
            document.execCommand('bold', false);
            break;
          case "italic":
            document.execCommand('italic', false);
            break;
          case "underline":
            document.execCommand('underline', false);
            break;
          case "strikethrough":
            document.execCommand('strikethrough', false);
            break;
          case "boldItalic":
            document.execCommand('bold', false);
            document.execCommand('italic', false);
            break;
          case "inlineCode":
            if (text) {
              const code = document.createElement('code');
              code.textContent = text;
              range.deleteContents();
              range.insertNode(code);
            }
            break;
          case "heading":
            const level = args[0] || 2;
            document.execCommand('formatBlock', false, `h${level}`);
            break;
          case "link":
            const linkTarget = prompt('লিঙ্ক টার্গেট লিখুন:', text || 'পাতার নাম');
            if (linkTarget) {
              const link = document.createElement('a');
              link.href = '#' + linkTarget;
              link.textContent = text || linkTarget;
              range.deleteContents();
              range.insertNode(link);
            }
            break;
          case "image":
            const imgSrc = prompt('ছবির ফাইল নাম:', 'example.jpg');
            if (imgSrc) {
              const caption = prompt('ক্যাপশন (ঐচ্ছিক):', '');
              const img = document.createElement('img');
              img.src = imgSrc;
              img.alt = caption || '';
              range.deleteContents();
              range.insertNode(img);
            }
            break;
          case "video":
            const videoSrc = prompt('ভিডিও ফাইল নাম:', 'example.mp4');
            if (videoSrc) {
              const video = document.createElement('video');
              video.src = videoSrc;
              video.controls = true;
              video.className = 'media-video';
              range.deleteContents();
              range.insertNode(video);
            }
            break;
          case "unorderedList":
            document.execCommand('insertUnorderedList', false);
            break;
          case "orderedList":
            document.execCommand('insertOrderedList', false);
            break;
          case "horizontalRule":
            document.execCommand('insertHorizontalRule', false);
            break;
          case "superscript":
            document.execCommand('superscript', false);
            break;
          case "subscript":
            document.execCommand('subscript', false);
            break;
          case "codeBlock":
            const lang = prompt('প্রোগ্রামিং ভাষা:', 'javascript');
            const pre = document.createElement('pre');
            pre.className = `code-block language-${lang || 'text'}`;
            const codeEl = document.createElement('code');
            codeEl.textContent = text || '// কোড এখানে লিখুন';
            pre.appendChild(codeEl);
            range.deleteContents();
            range.insertNode(pre);
            range.insertNode(document.createElement('br'));
            break;
          case "math":
            const latex = prompt('LaTeX সূত্র:', 'E = mc^2');
            if (latex) {
              const math = document.createElement('span');
              math.className = 'math-inline';
              math.textContent = latex;
              range.deleteContents();
              range.insertNode(math);
            }
            break;
          case "table":
            const rows = parseInt(prompt('সারির সংখ্যা:', '3') || '3');
            const cols = parseInt(prompt('কলামের সংখ্যা:', '3') || '3');
            const table = document.createElement('table');
            table.className = 'wikitable';
            const tbody = document.createElement('tbody');
            
            // Header  
            const headerRow = document.createElement('tr');
            for (let i = 0; i < cols; i++) {
              const th = document.createElement('th');
              th.textContent = `শিরোনাম ${i + 1}`;
              headerRow.appendChild(th);
            }
            tbody.appendChild(headerRow);
            
            // Data rows  
            for (let i = 0; i < rows - 1; i++) {
              const tr = document.createElement('tr');
              for (let j = 0; j < cols; j++) {
                const td = document.createElement('td');
                td.textContent = 'তথ্য';
                tr.appendChild(td);
              }
              tbody.appendChild(tr);
            }
            
            table.appendChild(tbody);
            range.deleteContents();
            range.insertNode(table);
            range.insertNode(document.createElement('br'));
            break;
          case "template":
            const templateName = prompt('টেমপ্লেটের নাম:', 'Infobox');
            if (templateName) {
              const tmpl = document.createElement('div');
              tmpl.className = 'template';
              tmpl.textContent = templateName;
              range.deleteContents();
              range.insertNode(tmpl);
            }
            break;
          case "reference":
            const refText = prompt('তথ্যসূত্রের বিষয়বস্তু:');
            if (refText) {
              const refName = prompt('তথ্যসূত্রের নাম (ঐচ্ছিক):', '');
              const sup = document.createElement('sup');
              sup.className = 'reference';
              sup.textContent = '[' + (parseResult.metadata.footnotes.length + 1) + ']';
              range.deleteContents();
              range.insertNode(sup);
            }
            break;
          case "refList":
            const refDiv = document.createElement('div');
            refDiv.className = 'reflist';
            const refTitle = document.createElement('h3');
            refTitle.textContent = 'তথ্যসূত্র';
            refDiv.appendChild(refTitle);
            range.deleteContents();
            range.insertNode(refDiv);
            break;
        }
        
        handleVisualInput();
      } catch (err) {
        setError("ফরম্যাটিং ত্রুটি: " + (err as Error).message);
      }
    }
    
  };
  
  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    
  };
  
  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      setError("দয়া করে একটি শিরোনাম লিখুন");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      // Simulate save  
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("সংরক্ষিত:", {
        title,
        wikitext,
        metadata: parseResult.metadata,
        wordCount
      });
      
      alert("✓ নিবন্ধটি সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err) {
      setError("সংরক্ষণে ত্রুটি: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
    
  };
  
  // Toolbar configuration
  const toolbarBlocks = [
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
<input
type="text"
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="নিবন্ধের শিরোনাম লিখুন..."
className="text-lg font-semibold outline-none border-b-2 border-transparent focus:border-blue-500 transition flex-1 max-w-md"
/>
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
className="p-2 hover:bg-gray-100 rounded transition border"  
onClick={handleModeSwitch}  
title="এডিটর মোড পরিবর্তন করুন"  
>
<Languages className="h-5 w-5" />
</button>
<button  
onClick={handleSave}  
disabled={isSaving}  
className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"  
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
    <div className="flex items-center flex-wrap gap-1 p-2">  
      {toolbarBlocks.map((block, i) =>  
        !block.name ? (  
          <button  
            key={i}  
            onClick={() => handleCommand(block.action)}  
            className="p-2 rounded border hover:bg-blue-50 transition active:bg-blue-100"  
            title={block.label}  
          >  
            <block.icon className="h-4 w-4" />  
          </button>  
        ) : (  
          <select  
            key={i}  
            onChange={(e) => {  
              const value = e.target.value;  
              if (value) {  
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
            {block.items.map((item, idx) => (  
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
              setWikitext(e.target.value);  
              addToHistory(e.target.value);  
            }}  
            onKeyDown={handleKeyDown}  
            className="w-full min-h-[70vh] p-4 outline-none text-sm font-mono bg-white border rounded-lg focus:border-blue-500 resize-none"  
            placeholder="MediaWiki সিনট্যাক্স ব্যবহার করে লেখা শুরু করুন...

উদাহরণ:
'''বোল্ড টেক্সট'''
''ইটালিক টেক্সট''
== শিরোনাম ==

তালিকার আইটেম
[[লিঙ্ক]]
[[File:example.jpg|thumb|ক্যাপশন]]"
/>
</div>

{/* Preview */}  
      <div className="flex-1 bg-white border rounded-lg overflow-auto min-h-[70vh]">  
        <div className="p-4">  
          <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-2 border-b">  
            প্রিভিউ  
          </h3>  
          <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />  
          <div  
            dangerouslySetInnerHTML={{  
              __html: parseResult.html || '<p class="text-gray-400">প্রিভিউ এখানে দেখা যাবে...</p>',  
            }}  
          />  
        </div>  
      </div>  
    </>  
  )}  

  {/* Visual WYSIWYG Editor */}  
  {editorMode === "visual" && (  
    <div className="flex-1">  
      <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />  
      <div  
        ref={visualRef}  
        onInput={handleVisualInput}  
        onKeyDown={handleKeyDown}  
        className="min-h-[70vh] p-6 rounded-lg bg-white border focus:border-blue-500 outline-none"  
        contentEditable  
        suppressContentEditableWarning  
        spellCheck={true}  
      />  
    </div>  
  )}  
</div>  

{/* Metadata Info */}  
{parseResult.metadata.headings.length > 0 && (  
  <div className="mx-4 mb-4 p-4 bg-white border rounded-lg">  
    <h3 className="text-sm font-semibold mb-2">নিবন্ধ তথ্য</h3>  
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">  
      <div>  
        <span className="font-medium">শিরোনাম:</span> {parseResult.metadata.headings.length}  
      </div>  
      <div>  
        <span className="font-medium">ছবি:</span> {parseResult.metadata.images.length}  
      </div>  
      <div>  
        <span className="font-medium">লিঙ্ক:</span> {parseResult.metadata.links.length}  
      </div>  
      <div>  
        <span className="font-medium">তথ্যসূত্র:</span> {parseResult.metadata.footnotes.length}  
      </div>  
    </div>  
  </div>  
)}

  </div>
  );
}