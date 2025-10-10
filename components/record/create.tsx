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

// Inline the markup utilities since we can't import from external files
interface ParseResult {
  html: string;
  metadata: any;
  styles: string;
}

const DEFAULT_STYLES = `
.markup-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #202122;
  padding: 20px;
}
.markup-content h1, .markup-content h2, .markup-content h3 {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #000;
}
.markup-content h1 { font-size: 2em; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.25em; }
.markup-content h2 { font-size: 1.7em; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.25em; }
.markup-content h3 { font-size: 1.4em; }
.markup-content p { margin: 0.5em 0 1em 0; }
.markup-content a { color: #0645ad; text-decoration: none; }
.markup-content a:hover { text-decoration: underline; }
.markup-content strong { font-weight: 700; }
.markup-content em { font-style: italic; }
`;

const parseMarkup = (text: string): ParseResult => {
  let html = text;
  const metadata = {
    images: [],
    videos: [],
    links: [],
    headings: [],
    footnotes: [],
    templates: []
  };

  // Basic MediaWiki parsing
  // Bold and italic
  html = html.replace(/'''''(.+?)'''''/g, '<strong><em>$1</em></strong>');
  html = html.replace(/'''(.+?)'''/g, '<strong>$1</strong>');
  html = html.replace(/''(.+?)''/g, '<em>$1</em>');

  // Headings
  for (let i = 6; i >= 1; i--) {
    const equals = '='.repeat(i);
    const pattern = new RegExp(`^${equals}\\s*([^=]+?)\\s*${equals}\\s*$`, 'gm');
    html = html.replace(pattern, (m, text) => {
      const trimmedText = text.trim();
      return `<h${i}>${trimmedText}</h${i}>`;
    });
  }

  // Paragraphs
  html = html
    .split(/\n{2,}/)
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed || trimmed.match(/^<(h[1-6]|table|pre|div)/i)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  html = `<div class="markup-content">${html}</div>`;
  return { html, metadata, styles: DEFAULT_STYLES };
};

const applyEditorCommand = (
  text: string,
  command: string,
  selectionStart: number,
  selectionEnd: number,
  ...args: any[]
): { text: string; newSelectionStart: number; newSelectionEnd: number } => {
  const before = text.substring(0, selectionStart);
  const selection = text.substring(selectionStart, selectionEnd);
  const after = text.substring(selectionEnd);
  
  let transformed = selection;
  
  switch (command) {
    case 'bold':
      transformed = `'''${selection}'''`;
      break;
    case 'italic':
      transformed = `''${selection}''`;
      break;
    case 'boldItalic':
      transformed = `'''''${selection}'''''`;
      break;
    case 'strikethrough':
      transformed = `<s>${selection}</s>`;
      break;
    case 'underline':
      transformed = `<u>${selection}</u>`;
      break;
    case 'inlineCode':
      transformed = `<code>${selection}</code>`;
      break;
    case 'heading1':
      transformed = `= ${selection} =`;
      break;
    case 'heading2':
      transformed = `== ${selection} ==`;
      break;
    case 'heading3':
      transformed = `=== ${selection} ===`;
      break;
    case 'link':
      const url = prompt("Enter URL:");
      if (url) {
        const linkText = selection || prompt("Link text:");
        transformed = linkText ? `[${url} ${linkText}]` : `[${url}]`;
      }
      break;
    case 'image':
      const filename = prompt("Enter image filename:");
      if (filename) {
        transformed = `[[File:${filename}|thumb|${selection || 'Caption'}]]`;
      }
      break;
    case 'video':
      const videoFile = prompt("Enter video filename:");
      if (videoFile) {
        transformed = `[[Media:${videoFile}|${selection || 'Video'}]]`;
      }
      break;
    case 'codeBlock':
      const lang = prompt("Programming language (optional):");
      transformed = lang 
        ? `<syntaxhighlight lang="${lang}">\n${selection}\n</syntaxhighlight>`
        : `<syntaxhighlight>\n${selection}\n</syntaxhighlight>`;
      break;
    case 'math':
      transformed = `<math>${selection}</math>`;
      break;
    case 'unorderedList':
      transformed = `* ${selection}`;
      break;
    case 'orderedList':
      transformed = `# ${selection}`;
      break;
    case 'table':
      transformed = `{| class="wikitable"\n! Header\n|-\n| ${selection}\n|}`;
      break;
    case 'template':
      const templateName = prompt("Template name:");
      if (templateName) {
        transformed = `{{${templateName}|${selection}}}`;
      }
      break;
    case 'horizontalRule':
      transformed = '----';
      break;
    case 'superscript':
      transformed = `<sup>${selection}</sup>`;
      break;
    case 'subscript':
      transformed = `<sub>${selection}</sub>`;
      break;
    case 'reference':
      transformed = `<ref>${selection}</ref>`;
      break;
    case 'refList':
      transformed = '{{reflist}}';
      break;
  }
  
  const newText = before + transformed + after;
  
  return {
    text: newText,
    newSelectionStart: before.length,
    newSelectionEnd: before.length + transformed.length
  };
};

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState("");
  const [preview, setPreview] = useState("");
  const [metadata, setMetadata] = useState<any>({});
  const [title, setTitle] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Update preview whenever source (wikitext) changes
  useEffect(() => {
    const result = parseMarkup(wikitext);
    setPreview(result.html);
    setMetadata(result.metadata);
  }, [wikitext]);
  
  // Apply formatting commands
  const applyCommand = (command: string, ...args: any[]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const result = applyEditorCommand(wikitext, command, start, end, ...args);
    setWikitext(result.text);
    
    // restore caret
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        result.newSelectionStart,
        result.newSelectionEnd
      );
    }, 0);
  };
  
  // Insert text helper
  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      wikitext.substring(0, start) + text + wikitext.substring(end);
    setWikitext(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };
  
  // Keyboard shortcuts (Ctrl+B, etc.)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          applyCommand("bold");
          break;
        case "i":
          e.preventDefault();
          applyCommand("italic");
          break;
        case "u":
          e.preventDefault();
          applyCommand("underline");
          break;
        case "k":
          e.preventDefault();
          applyCommand("link");
          break;
        case "s":
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };
  
  const handleSave = () => {
    console.log("Saving:", { title, wikitext, metadata });
    alert("Article saved! Check console for details.");
  };
  
  const Blocks = [
    { icon: Bold, action: "bold", label: "Bold" },
    { icon: Italic, action: "italic", label: "Italic" },
    {
      name: "Heading",
      items: [
        { icon: Heading1, action: "heading1", label: "Heading 1" },
        { icon: Heading2, action: "heading2", label: "Heading 2" },
        { icon: Heading3, action: "heading3", label: "Heading 3" },
      ],
    },
    { icon: Type, action: "boldItalic", label: "Bold Italic" },
    { icon: Strikethrough, action: "strikethrough", label: "Strikethrough" },
    { icon: Underline, action: "underline", label: "Underline" },
    { icon: Code, action: "inlineCode", label: "Code" },
    { icon: Link, action: "link", label: "Link" },
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
          <button
            className="p-2 hover:bg-gray-100 rounded transition"
            onClick={() =>
              setEditorMode(editorMode === "visual" ? "source" : "visual")
            }
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
                onClick={() => applyCommand(block.action)}
                className="p-2 rounded border hover:bg-gray-100 transition"
                title={block.label}
              >
                <block.icon className="h-4 w-4" />
              </button>
            ) : (
              <select
                key={i}
                onChange={(e) => {
                  if (e.target.value) {
                    applyCommand(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="p-2 border rounded hover:bg-gray-50"
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
      <div className="flex gap-2 p-4">
        {editorMode === "source" && (
          <textarea
            ref={textareaRef}
            value={wikitext}
            onChange={(e) => setWikitext(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[70vh] rounded-lg p-4 outline-none text-sm border-2 border-gray-300 bg-white focus:border-blue-500 font-mono"
            placeholder="Start writing your article using MediaWiki syntax...

Examples:
'''Bold text'''
''Italic text''
== Heading ==
* List item
[[Link]]"
          />
        )}

        {/* Visual preview */}
        <div
          className={`bg-white rounded-lg p-6 border-2 border-gray-300 overflow-auto ${
            editorMode === "source" ? "flex-1" : "w-full"
          }`}
        >
          <style dangerouslySetInnerHTML={{ __html: DEFAULT_STYLES }} />
          <div dangerouslySetInnerHTML={{ __html: preview || '<p class="text-gray-400">Preview will appear here...</p>' }} />
        </div>
      </div>
    </div>
  );
}