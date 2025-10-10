import { useState, useRef, useEffect } from 'react';
import { parseMarkup, EditorCommands, applyEditorCommand } from '@/lib/utils/dist/markup';

export default function CreateRecord() {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update preview when content changes
  useEffect(() => {
    const result = parseMarkup(content);
    setPreview(result.html);
    setMetadata(result.metadata);
  }, [content]);

  // Apply editor command
  const applyCommand = (command: string, ...args: any[]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const result = applyEditorCommand(content, command, start, end, ...args);
    setContent(result.text);

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
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);

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
    console.log('Saving:', { title, content, metadata });
    alert('Record saved! (Check console)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Record</h1>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save Record
            </button>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
            className="w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-24 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 rounded ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1 rounded ${mode === 'split' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded ${mode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Preview
            </button>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-2">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button onClick={() => applyCommand('bold')} className="toolbar-btn" title="Bold (Ctrl+B)">
                <strong>B</strong>
              </button>
              <button onClick={() => applyCommand('italic')} className="toolbar-btn" title="Italic (Ctrl+I)">
                <em>I</em>
              </button>
              <button onClick={() => applyCommand('strikethrough')} className="toolbar-btn" title="Strikethrough">
                <s>S</s>
              </button>
              <button onClick={() => applyCommand('underline')} className="toolbar-btn" title="Underline">
                <u>U</u>
              </button>
              <button onClick={() => applyCommand('highlight')} className="toolbar-btn" title="Highlight">
                <mark>H</mark>
              </button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              {[1, 2, 3, 4, 5, 6].map(level => (
                <button
                  key={level}
                  onClick={() => applyCommand('heading', level)}
                  className="toolbar-btn"
                  title={`Heading ${level}`}
                >
                  H{level}
                </button>
              ))}
            </div>

            {/* Links & Media */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) applyCommand('link', url);
                }}
                className="toolbar-btn"
                title="Link (Ctrl+K)"
              >
                🔗
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
                🖼️
              </button>
              <button
                onClick={() => {
                  const id = prompt('Enter YouTube video ID or URL:');
                  if (id) insertText(`[!youtube](${id})`);
                }}
                className="toolbar-btn"
                title="YouTube"
              >
                ▶️
              </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  const lines = content.substring(textarea.selectionStart, textarea.selectionEnd).split('\n');
                  const list = lines.map(l => `- ${l}`).join('\n');
                  applyCommand('unorderedList', lines);
                }}
                className="toolbar-btn"
                title="Bullet List"
              >
                • List
              </button>
              <button
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  const lines = content.substring(textarea.selectionStart, textarea.selectionEnd).split('\n');
                  const list = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
                  insertText(list);
                }}
                className="toolbar-btn"
                title="Numbered List"
              >
                1. List
              </button>
              <button
                onClick={() => insertText('- [ ] ')}
                className="toolbar-btn"
                title="Task List"
              >
                ☑️
              </button>
            </div>

            {/* Code & Math */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button onClick={() => applyCommand('inlineCode')} className="toolbar-btn" title="Inline Code">
                &lt;/&gt;
              </button>
              <button
                onClick={() => {
                  const lang = prompt('Language (optional):') || '';
                  insertText(`\`\`\`${lang}\n\n\`\`\``);
                }}
                className="toolbar-btn"
                title="Code Block"
              >
                { }
              </button>
              <button
                onClick={() => applyCommand('mathInline')}
                className="toolbar-btn"
                title="Inline Math"
              >
                $x$
              </button>
              <button
                onClick={() => insertText('$$\n\n$$')}
                className="toolbar-btn"
                title="Math Block"
              >
                $$
              </button>
            </div>

            {/* Other */}
            <div className="flex gap-1">
              <button onClick={() => applyCommand('blockquote')} className="toolbar-btn" title="Quote">
                "
              </button>
              <button
                onClick={() => {
                  const type = prompt('Type (info/warning/success/error/note/tip):') || 'info';
                  insertText(`!!! ${type}\nYour content here\n!!!`);
                }}
                className="toolbar-btn"
                title="Callout"
              >
                ⚠️
              </button>
              <button
                onClick={() => insertText('| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n')}
                className="toolbar-btn"
                title="Table"
              >
                ⊞
              </button>
              <button onClick={() => applyCommand('horizontalRule')} className="toolbar-btn" title="Horizontal Rule">
                ―
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid ${mode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Editor */}
          {(mode === 'edit' || mode === 'split') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                <h3 className="font-semibold text-gray-700">Markdown Editor</h3>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your content here...

Try some formatting:
- **Bold** or __bold__
- *Italic* or _italic_
- ~~Strikethrough~~
- ==Highlight==
- `inline code`
- $x^2 + y^2 = z^2$ (inline math)

# Heading 1
## Heading 2

> Blockquote

- Bullet list
1. Numbered list
- [ ] Task list

```javascript
code block
```

$$
E = mc^2
$$

| Table | Header |
|-------|--------|
| Cell  | Data   |
"
                className="w-full h-[calc(100vh-400px)] p-4 font-mono text-sm resize-none focus:outline-none"
              />
            </div>
          )}

          {/* Preview */}
          {(mode === 'preview' || mode === 'split') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                <h3 className="font-semibold text-gray-700">Preview</h3>
              </div>
              <div
                className="prose prose-sm max-w-none p-4 h-[calc(100vh-400px)] overflow-auto"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}
        </div>

        {/* Metadata Panel */}
        {metadata && Object.keys(metadata).some(key => metadata[key]?.length > 0) && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Document Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {metadata.headings?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Headings:</span>
                  <span className="ml-2 text-gray-900">{metadata.headings.length}</span>
                </div>
              )}
              {metadata.images?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Images:</span>
                  <span className="ml-2 text-gray-900">{metadata.images.length}</span>
                </div>
              )}
              {metadata.links?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Links:</span>
                  <span className="ml-2 text-gray-900">{metadata.links.length}</span>
                </div>
              )}
              {metadata.videos?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Videos:</span>
                  <span className="ml-2 text-gray-900">{metadata.videos.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .toolbar-btn {
          @apply px-3 py-1 rounded hover:bg-gray-100 border border-gray-300 text-sm font-medium transition;
        }
        
        .prose {
          @apply text-gray-800;
        }
        
        .prose h1 { @apply text-3xl font-bold mt-6 mb-4; }
        .prose h2 { @apply text-2xl font-bold mt-5 mb-3; }
        .prose h3 { @apply text-xl font-bold mt-4 mb-2; }
        .prose h4 { @apply text-lg font-semibold mt-3 mb-2; }
        .prose h5 { @apply text-base font-semibold mt-2 mb-1; }
        .prose h6 { @apply text-sm font-semibold mt-2 mb-1; }
        
        .prose p { @apply my-3 leading-relaxed; }
        .prose a { @apply text-blue-600 hover:underline; }
        .prose strong { @apply font-bold; }
        .prose em { @apply italic; }
        .prose code { @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono; }
        .prose pre { @apply bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4; }
        .prose blockquote { @apply border-l-4 border-gray-300 pl-4 italic my-4; }
        .prose hr { @apply my-6 border-gray-300; }
        .prose ul { @apply list-disc pl-6 my-3; }
        .prose ol { @apply list-decimal pl-6 my-3; }
        .prose li { @apply my-1; }
        .prose table { @apply border-collapse w-full my-4; }
        .prose th { @apply border border-gray-300 px-4 py-2 bg-gray-50 font-semibold; }
        .prose td { @apply border border-gray-300 px-4 py-2; }
        .prose img { @apply max-w-full h-auto rounded-lg my-4; }
        .prose mark { @apply bg-yellow-200 px-1; }
        .prose del { @apply line-through; }
        .prose ins { @apply underline; }
        .prose kbd { @apply bg-gray-200 px-2 py-1 rounded text-sm font-mono border border-gray-400; }
        
        .prose .alert { @apply rounded-lg my-4; }
        .prose .math-block { @apply my-4 overflow-x-auto; }
        .prose .math-inline { @apply mx-1; }
        
        .prose .table-of-contents {
          @apply bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6;
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
          @apply border border-gray-300 rounded-lg p-4 my-4;
        }
        .prose summary {
          @apply font-semibold cursor-pointer;
        }
        
        .prose figure {
          @apply my-6;
        }
        .prose figcaption {
          @apply text-center text-sm text-gray-600 mt-2;
        }
      `}</style>
    </div>
  );
}