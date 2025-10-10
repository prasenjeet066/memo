import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Link, Image, Eye, FileCode, Highlighter, Type, Minus, Video, CheckSquare } from 'lucide-react';
import { parseMarkup, applyEditorCommand } from '@/lib/utils/dist/markup';

export default function WYSIWYGEditor() {
  const [markdown, setMarkdown] = useState('');
  const [preview, setPreview] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update preview when markdown changes
  useEffect(() => {
    const result = parseMarkup(markdown);
    setPreview(result.html);
    setMetadata(result.metadata);
  }, [markdown]);

  // Apply editor command
  const applyCommand = (command: string, ...args: any[]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const result = applyEditorCommand(markdown, command, start, end, ...args);
    setMarkdown(result.text);

    // Restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
    }, 0);
  };

  // Insert text at cursor
  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = markdown.substring(0, start) + text + markdown.substring(end);
    setMarkdown(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          applyCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          applyCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          applyCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) applyCommand('link', url);
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  const handleSave = () => {
    console.log('Saving:', { title, markdown, metadata });
    alert('Document saved! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Rich Text Editor
              </h1>
              <p className="text-sm text-gray-500 mt-1">Powered by markup.ts parser</p>
            </div>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl font-medium"
            >
              Save Document
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title..."
            className="w-full px-5 py-3.5 text-xl font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white shadow-sm"
          />
        </div>
      </header>

      {/* Mode Toggle & Toolbar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-[132px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                mode === 'edit' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileCode size={16} />
              Edit
            </button>
            <button
              onClick={() => setMode('split')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                mode === 'split' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type size={16} />
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                mode === 'preview' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-1.5">
            {/* Text Formatting */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button onClick={() => applyCommand('bold')} className="toolbar-btn" title="Bold (Ctrl+B)">
                <Bold size={18} />
              </button>
              <button onClick={() => applyCommand('italic')} className="toolbar-btn" title="Italic (Ctrl+I)">
                <Italic size={18} />
              </button>
              <button onClick={() => applyCommand('underline')} className="toolbar-btn" title="Underline (Ctrl+U)">
                <Underline size={18} />
              </button>
              <button onClick={() => applyCommand('strikethrough')} className="toolbar-btn" title="Strikethrough">
                <Strikethrough size={18} />
              </button>
              <button onClick={() => applyCommand('highlight')} className="toolbar-btn" title="Highlight">
                <Highlighter size={18} />
              </button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button onClick={() => applyCommand('heading', 1)} className="toolbar-btn" title="Heading 1">
                <Heading1 size={18} />
              </button>
              <button onClick={() => applyCommand('heading', 2)} className="toolbar-btn" title="Heading 2">
                <Heading2 size={18} />
              </button>
              <button onClick={() => applyCommand('heading', 3)} className="toolbar-btn" title="Heading 3">
                <Heading3 size={18} />
              </button>
            </div>

            {/* Links & Media */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) applyCommand('link', url);
                }}
                className="toolbar-btn"
                title="Link (Ctrl+K)"
              >
                <Link size={18} />
              </button>
              <button
                onClick={() => {
                  const src = prompt('Enter image URL:');
                  const alt = prompt('Enter alt text:') || '';
                  if (src) insertText(`![${alt}](${src})`);
                }}
                className="toolbar-btn"
                title="Image"
              >
                <Image size={18} />
              </button>
              <button
                onClick={() => {
                  const id = prompt('Enter YouTube video ID or URL:');
                  if (id) insertText(`[!youtube](${id})`);
                }}
                className="toolbar-btn"
                title="YouTube Video"
              >
                <Video size={18} />
              </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => insertText('- ')}
                className="toolbar-btn"
                title="Bullet List"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => insertText('1. ')}
                className="toolbar-btn"
                title="Numbered List"
              >
                <ListOrdered size={18} />
              </button>
              <button
                onClick={() => insertText('- [ ] ')}
                className="toolbar-btn"
                title="Task List"
              >
                <CheckSquare size={18} />
              </button>
            </div>

            {/* Blocks */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button onClick={() => applyCommand('blockquote')} className="toolbar-btn" title="Quote">
                <Quote size={18} />
              </button>
              <button onClick={() => applyCommand('inlineCode')} className="toolbar-btn" title="Inline Code">
                <Code size={18} />
              </button>
              <button
                onClick={() => {
                  const lang = prompt('Language (optional):') || '';
                  insertText(`\`\`\`${lang}\n\n\`\`\``);
                }}
                className="toolbar-btn"
                title="Code Block"
              >
                <span className="text-sm font-bold">{'{}'}</span>
              </button>
            </div>

            {/* Math & Other */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => applyCommand('mathInline')}
                className="toolbar-btn"
                title="Inline Math"
              >
                <span className="text-sm font-bold">$x$</span>
              </button>
              <button
                onClick={() => insertText('$$\n\n$$')}
                className="toolbar-btn"
                title="Math Block"
              >
                <span className="text-sm font-bold">$$</span>
              </button>
              <button onClick={() => applyCommand('horizontalRule')} className="toolbar-btn" title="Horizontal Rule">
                <Minus size={18} />
              </button>
            </div>

            {/* Callout */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => {
                  const type = prompt('Type (info/warning/success/error/note/tip):') || 'info';
                  insertText(`!!! ${type}\nYour content here\n!!!`);
                }}
                className="toolbar-btn"
                title="Callout"
              >
                <span className="text-sm">⚠️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={`grid ${mode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Markdown Editor */}
          {(mode === 'edit' || mode === 'split') && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileCode size={18} className="text-blue-600" />
                  Markdown Editor
                </h3>
              </div>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your content here...

Try some formatting:
**Bold** or __bold__
*Italic* or _italic_
~~Strikethrough~~
==Highlight==
`inline code`
$x^2 + y^2 = z^2$ (inline math)

# Heading 1
## Heading 2

> Blockquote

- Bullet list
1. Numbered list
- [ ] Task list

[Link text](url)
![Alt text](image-url)
[!youtube](video-id)

```javascript
code block
```

$$
E = mc^2
$$

!!! info
Callout boxes
!!!
"
                className="w-full h-[600px] p-6 font-mono text-sm resize-none focus:outline-none"
              />
            </div>
          )}

          {/* Preview */}
          {(mode === 'preview' || mode === 'split') && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Eye size={18} className="text-indigo-600" />
                  Live Preview
                </h3>
              </div>
              <div
                className="prose prose-lg max-w-none p-6 h-[600px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}
        </div>

        {/* Metadata Panel */}
        {metadata && Object.keys(metadata).some(key => metadata[key]?.length > 0) && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-lg">Document Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metadata.headings?.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <span className="font-medium text-blue-900 text-sm">Headings</span>
                  <div className="text-2xl font-bold text-blue-700 mt-1">{metadata.headings.length}</div>
                </div>
              )}
              {metadata.images?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <span className="font-medium text-green-900 text-sm">Images</span>
                  <div className="text-2xl font-bold text-green-700 mt-1">{metadata.images.length}</div>
                </div>
              )}
              {metadata.links?.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <span className="font-medium text-purple-900 text-sm">Links</span>
                  <div className="text-2xl font-bold text-purple-700 mt-1">{metadata.links.length}</div>
                </div>
              )}
              {metadata.videos?.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <span className="font-medium text-orange-900 text-sm">Videos</span>
                  <div className="text-2xl font-bold text-orange-700 mt-1">{metadata.videos.length}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .toolbar-btn {
          @apply p-2 rounded-md hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition text-gray-700 hover:text-blue-600;
        }
        
        .prose {
          @apply text-gray-800;
        }
        
        .prose h1 { @apply text-4xl font-bold mt-8 mb-4 text-gray-900; }
        .prose h2 { @apply text-3xl font-bold mt-6 mb-3 text-gray-900; }
        .prose h3 { @apply text-2xl font-bold mt-5 mb-2 text-gray-900; }
        .prose h4 { @apply text-xl font-semibold mt-4 mb-2 text-gray-800; }
        .prose h5 { @apply text-lg font-semibold mt-3 mb-1 text-gray-800; }
        .prose h6 { @apply text-base font-semibold mt-2 mb-1 text-gray-800; }
        
        .prose p { @apply my-4 leading-relaxed; }
        .prose a { @apply text-blue-600 hover:text-blue-700 hover:underline transition; }
        .prose strong { @apply font-bold text-gray-900; }
        .prose em { @apply italic; }
        .prose code { @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono text-pink-600; }
        .prose pre { @apply bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4; }
        .prose blockquote { @apply border-l-4 border-blue-500 pl-4 italic my-4 text-gray-700 bg-blue-50 py-2 rounded-r; }
        .prose hr { @apply my-8 border-gray-300; }
        .prose ul { @apply list-disc pl-6 my-4; }
        .prose ol { @apply list-decimal pl-6 my-4; }
        .prose li { @apply my-2; }
        .prose table { @apply border-collapse w-full my-4 shadow-sm; }
        .prose th { @apply border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left; }
        .prose td { @apply border border-gray-300 px-4 py-2; }
        .prose img { @apply max-w-full h-auto rounded-lg my-4 shadow-md; }
        .prose mark { @apply bg-yellow-200 px-1 rounded; }
        .prose del { @apply line-through text-gray-500; }
        .prose ins { @apply underline decoration-green-500; }
        .prose kbd { @apply bg-gray-200 px-2 py-1 rounded text-sm font-mono border border-gray-400 shadow-sm; }
        
        .prose .alert { @apply rounded-lg my-4 shadow-sm; }
        .prose .math-block { @apply my-4 overflow-x-auto bg-gray-50 p-4 rounded-lg border border-gray-200; }
        .prose .math-inline { @apply mx-1; }
        
        .prose .table-of-contents {
          @apply bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6 shadow-md;
        }
        .prose .table-of-contents ul {
          @apply list-none pl-0;
        }
        .prose .table-of-contents li {
          @apply my-1;
        }
        .prose .toc-level-2 { @apply pl-4; }
        .prose .toc-level-3 { @apply pl-8; }
        .prose .toc-level-4 { @apply pl-12; }
        .prose .toc-level-5 { @apply pl-16; }
        .prose .toc-level-6 { @apply pl-20; }
        
        .prose details {
          @apply border-2 border-gray-300 rounded-lg p-4 my-4 shadow-sm;
        }
        .prose summary {
          @apply font-semibold cursor-pointer hover:text-blue-600 transition;
        }
        
        .prose figure {
          @apply my-6;
        }
        .prose figcaption {
          @apply text-center text-sm text-gray-600 mt-2 italic;
        }

        .prose .youtube-embed {
          @apply rounded-lg shadow-lg my-6;
        }

        .prose .task-item {
          @apply list-none;
        }

        .prose .task-item input {
          @apply mr-2;
        }
      `}</style>
    </div>
  );
}