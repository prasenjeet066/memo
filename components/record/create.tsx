import { useState, useRef, useEffect } from "react";
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

// Main Editor component
export default function MediaWikiEditor() {
  // Editor states
  const [wikitext, setWikitext] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [parseResult, setParseResult] = useState<ParseResult>(parseMarkup(""));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Parse wikitext whenever it changes (only in source mode or initial load)
  useEffect(() => {
    if (!isUpdatingRef.current) {
      const result = parseMarkup(wikitext);
      setParseResult(result);
    }
  }, [wikitext]);

  // Update visual editor when switching to visual mode
  useEffect(() => {
    if (editorMode === "visual" && visualRef.current && !isUpdatingRef.current) {
      visualRef.current.innerHTML = parseResult.html || '<p><br></p>';
    }
  }, [editorMode, parseResult.html]);

  // Convert HTML back to wikitext (basic conversion)
  const htmlToWikitext = (html: string): string => {
    let text = html;
    
    // Remove empty paragraphs at start/end
    text = text.replace(/^<p><br><\/p>/, '').replace(/<p><br><\/p>$/, '');
    
    // Headings
    text = text.replace(/<h2>(.*?)<\/h2>/g, '== $1 ==\n');
    text = text.replace(/<h3>(.*?)<\/h3>/g, '=== $1 ===\n');
    text = text.replace(/<h4>(.*?)<\/h4>/g, '==== $1 ====\n');
    text = text.replace(/<h5>(.*?)<\/h5>/g, '===== $1 =====\n');
    text = text.replace(/<h6>(.*?)<\/h6>/g, '====== $1 ======\n');
    
    // Bold and italic
    text = text.replace(/<strong><em>(.*?)<\/em><\/strong>/g, "'''''$1'''''");
    text = text.replace(/<em><strong>(.*?)<\/strong><\/em>/g, "'''''$1'''''");
    text = text.replace(/<strong>(.*?)<\/strong>/g, "'''$1'''");
    text = text.replace(/<b>(.*?)<\/b>/g, "'''$1'''");
    text = text.replace(/<em>(.*?)<\/em>/g, "''$1''");
    text = text.replace(/<i>(.*?)<\/i>/g, "''$1''");
    
    // Other formatting
    text = text.replace(/<s>(.*?)<\/s>/g, '<s>$1</s>');
    text = text.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    text = text.replace(/<code>(.*?)<\/code>/g, '<code>$1</code>');
    text = text.replace(/<sup>(.*?)<\/sup>/g, '<sup>$1</sup>');
    text = text.replace(/<sub>(.*?)<\/sub>/g, '<sub>$1</sub>');
    
    // Links
    text = text.replace(/<a href="#([^"]+)">([^<]+)<\/a>/g, (match, href, linkText) => {
      return href === linkText ? `[[${href}]]` : `[[${href}|${linkText}]]`;
    });
    
    // Lists
    text = text.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
      return content.replace(/<li>(.*?)<\/li>/g, '* $1\n');
    });
    text = text.replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
      return content.replace(/<li>(.*?)<\/li>/g, '# $1\n');
    });
    
    // Horizontal rule
    text = text.replace(/<hr\s*\/?>/g, '----\n');
    
    // Code blocks
    text = text.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '<syntaxhighlight lang="javascript">$1</syntaxhighlight>');
    
    // Paragraphs
    text = text.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
    text = text.replace(/<br\s*\/?>/g, '\n');
    
    // Clean up
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    
    return text;
  };

  // Handle visual editor input
  const handleVisualInput = () => {
    if (visualRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      setWikitext(newWikitext);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  };

  // Switch modes
  const handleModeSwitch = () => {
    if (editorMode === "visual" && visualRef.current) {
      // Sync any changes before switching
      const html = visualRef.current.innerHTML;
      const newWikitext = htmlToWikitext(html);
      setWikitext(newWikitext);
    }
    setEditorMode(editorMode === "visual" ? "source" : "visual");
  };

  // Toolbar command handler
  const handleCommand = (command: string, ...args: any[]) => {
    if (editorMode === "source") {
      // Source mode: modify wikitext string
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const result = applyEditorCommand(wikitext, command, start, end, ...args);
      setWikitext(result.text);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
      }, 0);
    } else {
      // Visual mode: apply formatting directly
      const el = visualRef.current;
      if (!el) return;
      
      document.execCommand('styleWithCSS', false, 'false');
      
      const selInfo = getSelectionInfo(el);
      if (!selInfo) {
        el.focus();
        return;
      }

      const { range, text, hasSelection } = selInfo;
      
      // Handle different commands
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
          if (hasSelection) {
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
          const url = prompt('Enter link target:', text || 'Page name');
          if (url) {
            const link = document.createElement('a');
            link.href = '#' + url;
            link.textContent = text || url;
            range.deleteContents();
            range.insertNode(link);
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
          const pre = document.createElement('pre');
          const codeEl = document.createElement('code');
          codeEl.textContent = text || '// code here';
          pre.appendChild(codeEl);
          range.deleteContents();
          range.insertNode(pre);
          break;
        default:
          // Use markup command
          if (EditorCommands[command]) {
            const markup = EditorCommands[command].execute(text, ...args);
            const parsed = parseMarkup(markup);
            const temp = document.createElement('div');
            temp.innerHTML = parsed.html;
            range.deleteContents();
            while (temp.firstChild) {
              range.insertNode(temp.firstChild);
            }
          }
      }
      
      handleVisualInput();
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
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
      }
    }
  };

  const handleSave = () => {
    console.log("Saving:", { title, wikitext, metadata: parseResult.metadata });
    alert("Article saved! Check console for details.");
  };

  // Toolbar blocks
  const Blocks = [
    { icon: Bold, action: "bold", label: "Bold (Ctrl+B)" },
    { icon: Italic, action: "italic", label: "Italic (Ctrl+I)" },
    {
      name: "Heading",
      items: [
        { icon: Heading1, action: "heading", label: "Heading 2", args: [2] },
        { icon: Heading2, action: "heading", label: "Heading 3", args: [3] },
        { icon: Heading3, action: "heading", label: "Heading 4", args: [4] },
      ],
    },
    { icon: Type, action: "boldItalic", label: "Bold Italic" },
    { icon: Strikethrough, action: "strikethrough", label: "Strikethrough" },
    { icon: Underline, action: "underline", label: "Underline (Ctrl+U)" },
    { icon: Code, action: "inlineCode", label: "Inline Code" },
    { icon: Link, action: "link", label: "Link (Ctrl+K)" },
    { icon: Image, action: "image", label: "Image" },
    { icon: Video, action: "video", label: "Video" },
    { icon: FileCode, action: "codeBlock", label: "Code Block" },
    { icon: Sigma, action: "math", label: "Math" },
    { icon: List, action: "unorderedList", label: "Bullet List" },
    { icon: ListOrdered, action: "orderedList", label: "Numbered List" },
    { icon: Table, action: "table", label: "Table" },
    { icon: Puzzle, action: "template", label: "Template" },
    { icon: Minus, action: "horizontalRule", label: "Horizontal Rule" },
    { icon: Superscript, action: "superscript", label: "Superscript" },
    { icon: Subscript, action: "subscript", label: "Subscript" },
    { icon: FileText, action: "reference", label: "Reference" },
    { icon: ListChecks, action: "refList", label: "Reference List" },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <List className="h-5 w-5 text-gray-600" />
          <h1 className="text-lg font-semibold">MediaWiki Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 px-2">
            Mode: {editorMode === "visual" ? "Visual" : "Source"}
          </span>
          <button
            className="p-2 hover:bg-gray-100 rounded transition border"
            onClick={handleModeSwitch}
            title="Toggle editor mode"
          >
            <Languages className="h-5 w-5" />
          </button>
          <button
            onClick={handleSave}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center flex-wrap gap-1 p-2">
          {Blocks.map((block, i) =>
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

      {/* Editor / Preview Area */}
      <div className="flex gap-4 p-4">
        {editorMode === "source" && (
          <>
            <textarea
              ref={textareaRef}
              value={wikitext}
              onChange={(e) => setWikitext(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[70vh] rounded-lg p-4 outline-none text-sm border-2 border-gray-300 bg-white focus:border-blue-500 font-mono resize-none"
              placeholder="Start writing your article using MediaWiki syntax...

Examples:
'''Bold text'''
''Italic text''
== Heading ==
* List item
[[Link]]"
            />
            <div className="flex-1 bg-white rounded-lg p-6 border-2 border-gray-300 overflow-auto min-h-[70vh]">
              <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
              <div dangerouslySetInnerHTML={{ __html: parseResult.html || '<p class="text-gray-400">Preview will appear here...</p>' }} />
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
              className="min-h-[70vh] rounded-lg p-6 bg-white border-2 border-gray-300 focus:border-blue-500 outline-none"
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