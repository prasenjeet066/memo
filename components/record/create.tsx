import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Code, Link, Image, Eye, FileCode, Type, Video, Table, Superscript, Subscript, FileText, Hash, Minus, BookOpen, Package, Quote, AlignLeft } from 'lucide-react';
import { parseMarkup, applyEditorCommand } from '@/lib/utils/dist/markup';

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState('');
  const [preview, setPreview] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update preview when wikitext changes
  useEffect(() => {
    const result = parseMarkup(wikitext);
    setPreview(result.html);
    setMetadata(result.metadata);
  }, [wikitext]);

  // Apply editor command
  const applyCommand = (command: string, ...args: any[]) => {
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
  };

  // Insert text at cursor
  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = wikitext.substring(0, start) + text + wikitext.substring(end);
    setWikitext(newContent);

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
          if (url) {
            const text = prompt('Link text (optional):');
            if (text) {
              insertText(`[${url} ${text}]`);
            } else {
              insertText(`[${url}]`);
            }
          }
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  const handleSave = () => {
    console.log('Saving:', { title, wikitext, metadata });
    alert('Article saved! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header - Wikipedia style */}
      <header className="bg-white border-b-2 border-gray-300 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="text-gray-700" size={32} />
                <h1 className="text-2xl font-serif font-bold text-gray-900">
                  MediaWiki Editor
                </h1>
              </div>
              <span className="text-sm text-gray-500 border-l pl-4 ml-4">Visual Editor</span>
            </div>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
            >
              Publish changes
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full px-4 py-2.5 text-xl font-serif border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
          />
        </div>
      </header>

      {/* Mode Toggle & Toolbar - Wikipedia style */}
      <div className="bg-gray-50  z-40">
        <div className="max-w-7xl mx-auto px-6 py-2">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                mode === 'edit' 
                  ? 'bg-white border border-gray-300 border-b-white text-blue-600 -mb-px' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileCode size={14} />
              Edit
            </button>
            <button
              onClick={() => setMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                mode === 'split' 
                  ? 'bg-white border border-gray-300 border-b-white text-blue-600 -mb-px' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type size={14} />
              Split view
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                mode === 'preview' 
                  ? 'bg-white border border-gray-300 border-b-white text-blue-600 -mb-px' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye size={14} />
              Preview
            </button>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-1 pb-2">
            {/* Text Formatting */}
            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
              <button onClick={() => applyCommand('bold')} className="toolbar-btn" title="Bold (Ctrl+B)">
                <Bold size={16} />
              </button>
              <button onClick={() => applyCommand('italic')} className="toolbar-btn" title="Italic (Ctrl+I)">
                <Italic size={16} />
              </button>
              <button onClick={() => applyCommand('underline')} className="toolbar-btn" title="Underline (Ctrl+U)">
                <span className="text-sm font-bold underline">U</span>
              </button>
              <button onClick={() => applyCommand('strikethrough')} className="toolbar-btn" title="Strikethrough">
                <Strikethrough size={16} />
              </button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
              <button onClick={() => applyCommand('heading', 2)} className="toolbar-btn" title="Heading 2">
                <Heading1 size={16} />
              </button>
              <button onClick={() => applyCommand('heading', 3)} className="toolbar-btn" title="Heading 3">
                <Heading2 size={16} />
              </button>
              <button onClick={() => applyCommand('heading', 4)} className="toolbar-btn" title="Heading 4">
                <Heading3 size={16} />
              </button>
            </div>

            {/* Links & Media */}
            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
              <button
                onClick={() => {
                  const page = prompt('Internal page name:');
                  if (page) {
                    const displayText = prompt('Display text (optional):');
                    applyCommand('internalLink', page, displayText || undefined);
                  }
                }}
                className="toolbar-btn"
                title="Internal Link [[Page]]"
              >
                <Link size={16} />
              </button>
              <button
                onClick={() => {
                  const url = prompt('External URL:');
                  if (url) {
                    const text = prompt('Link text (optional):');
                    insertText(text ? `[${url} ${text}]` : `[${url}]`);
                  }
                }}
                className="toolbar-btn"
                title="External Link [URL]"
              >
                <span className="text-xs font-bold">🔗</span>
              </button>
              <button
                onClick={() => {
                  const filename = prompt('Image filename (e.g., Example.jpg):');
                  if (filename) {
                    const caption = prompt('Caption (optional):');
                    applyCommand('thumbnail', filename, caption || undefined, '300px');
                  }
                }}
                className="toolbar-btn"
                title="Image [[File:...]]"
              >
                <Image size={16} />
              </button>
              <button
                onClick={() => {
                  const filename = prompt('Video filename (e.g., Video.mp4):');
                  if (filename) {
                    applyCommand('video', filename);
                  }
                }}
                className="toolbar-btn"
                title="Video [[Media:...]]"
              >
                <Video size={16} />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
              <button
                onClick={() => insertText('* ')}
                className="toolbar-btn"
                title="Unordered List"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => insertText('# ')}
                className="toolbar-btn"
                title="Ordered List"
              >
                <ListOrdered size={16} />
              </button>
              <button
                onClick={() => {
                  insertText('; Term\n: Definition');
                }}
                className="toolbar-btn"
                title="Definition List"
              >
                <AlignLeft size={16} />
              </button>
            </div>

            {/* Code & Math */}
            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
              <button onClick={() => applyCommand('inlineCode')} className="toolbar-btn" title="Inline Code <code>">
                <Code size={16} />
              </button>
              <button
                onClick={() => {
                  const lang = prompt('Language (optional):') || '';
                  insertText(`<syntaxhighlight lang="${lang}">\n\n</syntaxhighlight>`);
                }}
                className="toolbar-btn"
                title="Code Block"
              >
                <span className="text-sm font-bold">{'{}'}</span>
              </button>
              <button
                onClick={() => applyCommand('math')}
                className="toolbar-btn"
                title="Math Formula <math>"
              >
                <span className="text-sm font-bold">Σ</span>
              </button>
            </div>

            {/* Special */}
            <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
              <button
                onClick={() => {
                  const headers = prompt('Headers (comma-separated):');
                  if (headers) {
                    const headersArr = headers.split(',').map(h => h.trim());
                    const rows = prompt('Number of rows:');
                    const numRows = parseInt(rows || '2');
                    const tableRows: string[][] = [];
                    for (let i = 0; i < numRows; i++) {
                      tableRows.push(headersArr.map(() => 'Cell'));
                    }
                    const tableText = applyCommand('table', headersArr, tableRows);
                  } else {
                    insertText('{| class="wikitable"\n|+ Caption\n! Header 1 !! Header 2\n|-\n| Cell 1 || Cell 2\n|-\n| Cell 3 || Cell 4\n|}');
                  }
                }}
                className="toolbar-btn"
                title="Table"
              >
                <Table size={16} />
              </button>
              <button onClick={() => applyCommand('superscript')} className="toolbar-btn" title="Superscript <sup>">
                <Superscript size={16} />
              </button>
              <button onClick={() => applyCommand('subscript')} className="toolbar-btn" title="Subscript <sub>">
                <Subscript size={16} />
              </button>
              <button onClick={() => applyCommand('horizontalRule')} className="toolbar-btn" title="Horizontal Rule ----">
                <Minus size={16} />
              </button>
            </div>

            {/* References & Templates */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  const refText = prompt('Reference text:');
                  if (refText) {
                    const refName = prompt('Reference name (optional):');
                    applyCommand('reference', refText, refName || undefined);
                  }
                }}
                className="toolbar-btn"
                title="Reference <ref>"
              >
                <FileText size={16} />
              </button>
              <button
                onClick={() => insertText('{{reflist}}')}
                className="toolbar-btn"
                title="References List"
              >
                <Hash size={16} />
              </button>
              <button
                onClick={() => {
                  const templateName = prompt('Template name:');
                  if (templateName) {
                    insertText(`{{${templateName}}}`);
                  }
                }}
                className="toolbar-btn"
                title="Template {{}}"
              >
                <Package size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={`grid ${mode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Wikitext Editor */}
          {(mode === 'edit' || mode === 'split') && (
            <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-sm">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                <h3 className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                  <FileCode size={16} className="text-blue-600" />
                  Wikitext Editor
                </h3>
              </div>
              <textarea
                ref={textareaRef}
                value={wikitext}
                onChange={(e) => setWikitext(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your article...

Try MediaWiki syntax:
'''Bold''' or ''Italic''
== Heading 2 ==
=== Heading 3 ===

* Unordered list
# Ordered list
; Term : Definition

[[Internal Link]] or [[Page|Display Text]]
[http://example.com External Link]

[[File:Image.jpg|thumb|Caption]]
[[Media:Video.mp4]]

<code>inline code</code>
<syntaxhighlight lang='python'>
code block
</syntaxhighlight>

<math>E = mc^2</math>

{| class='wikitable'
|+ Table Caption
! Header 1 !! Header 2
|-
| Cell 1 || Cell 2
|}

<ref>Reference text</ref>
{{reflist}}

{{Template|param=value}}

----
"
                className="w-full h-[600px] p-4 font-mono text-sm resize-none focus:outline-none"
                style={{ lineHeight: '1.6' }}
              />
            </div>
          )}

          {/* Preview */}
          {(mode === 'preview' || mode === 'split') && (
            <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-sm">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                <h3 className="font-medium text-gray-700 flex items-center gap-2 text-sm">
                  <Eye size={16} className="text-green-600" />
                  Live Preview
                </h3>
              </div>
              <div
                className="wiki-content p-6 h-[600px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}
        </div>

        {/* Metadata Panel */}
        {metadata && Object.keys(metadata).some((key: string) => metadata[key]?.length > 0) && (
          <div className="mt-6 bg-white rounded border border-gray-300 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 text-lg">Article Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              {metadata.footnotes?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <span className="font-medium text-red-900 text-sm">References</span>
                  <div className="text-2xl font-bold text-red-700 mt-1">{metadata.footnotes.length}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .toolbar-btn {
          @apply p-1.5 rounded hover:bg-gray-200 transition text-gray-700 hover:text-blue-600;
        }
        
        .wiki-content {
          @apply text-gray-800 font-serif;
          line-height: 1.6;
        }
        
        .wiki-content h1 { @apply text-3xl font-bold mt-6 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2; }
        .wiki-content h2 { @apply text-2xl font-bold mt-5 mb-3 text-gray-900 border-b border-gray-300 pb-1; }
        .wiki-content h3 { @apply text-xl font-bold mt-4 mb-2 text-gray-900; }
        .wiki-content h4 { @apply text-lg font-semibold mt-3 mb-2 text-gray-800; }
        .wiki-content h5 { @apply text-base font-semibold mt-2 mb-1 text-gray-800; }
        .wiki-content h6 { @apply text-sm font-semibold mt-2 mb-1 text-gray-800; }
        
        .wiki-content p { @apply my-3 leading-relaxed; }
        .wiki-content a.external { @apply text-blue-600 hover:underline; }
        .wiki-content a.internal { @apply text-blue-700 hover:underline; }
        .wiki-content strong { @apply font-bold; }
        .wiki-content em { @apply italic; }
        .wiki-content code.inline-code { @apply bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-700 border border-gray-300; }
        .wiki-content pre.code-block { @apply bg-gray-50 border border-gray-300 p-4 rounded my-4 overflow-x-auto text-sm; }
        .wiki-content pre.code-block code { @apply font-mono text-gray-800; }
        .wiki-content hr.divider { @apply my-6 border-gray-300; }
        
        .wiki-content li.list-item { @apply my-1 ml-8; }
        .wiki-content li.list-item:before { content: "•"; @apply mr-2; }
        .wiki-content li.list-item.ordered { counter-increment: list; }
        .wiki-content li.list-item.ordered:before { content: counter(list) "."; @apply mr-2; }
        
        .wiki-content dt.definition-term { @apply font-bold mt-2; }
        .wiki-content dd.definition-desc { @apply ml-8 mb-2; }
        
        .wiki-content table.wikitable { @apply border-collapse border border-gray-400 w-full my-4 bg-gray-50; }
        .wiki-content table.wikitable caption { @apply font-bold py-2 bg-gray-200; }
        .wiki-content table.wikitable th { @apply border border-gray-400 px-3 py-2 bg-gray-200 font-bold text-left; }
        .wiki-content table.wikitable td { @apply border border-gray-400 px-3 py-2; }
        
        .wiki-content figure.thumb { @apply float-right ml-4 mb-4 bg-gray-50 border border-gray-300 p-2 max-w-xs; }
        .wiki-content figure.thumb img { @apply w-full h-auto; }
        .wiki-content figure.thumb figcaption { @apply text-sm text-gray-600 mt-2 text-center; }
        
        .wiki-content img.media-image { @apply max-w-full h-auto my-2; }
        .wiki-content video.media-video { @apply max-w-full my-4 border border-gray-300; }
        
        .wiki-content .math-inline { @apply mx-1 font-serif italic; }
        
        .wiki-content sup.reference a { @apply text-blue-600 no-underline text-xs; }
        
        .wiki-content .reflist { @apply mt-8 pt-4 border-t-2 border-gray-300; }
        .wiki-content .reflist h2 { @apply text-xl font-bold mb-3; }
        .wiki-content .reflist ol { @apply list-decimal pl-6; }
        .wiki-content .reflist li { @apply my-2 text-sm; }
        
        .wiki-content .toc { @apply float-right ml-4 mb-4 bg-gray-50 border border-gray-300 p-4 max-w-xs; }
        .wiki-content .toc .toc-title { @apply font-bold text-center mb-2 text-lg; }
        .wiki-content .toc ul { @apply list-none pl-0; }
        .wiki-content .toc li { @apply my-1; }
        .wiki-content .toc li.toc-level-2 { @apply pl-0; }
        .wiki-content .toc li.toc-level-3 { @apply pl-4; }
        .wiki-content .toc li.toc-level-4 { @apply pl-8; }
        .wiki-content .toc li.toc-level-5 { @apply pl-12; }
        .wiki-content .toc li.toc-level-6 { @apply pl-16; }
        .wiki-content .toc a { @apply text-blue-700 hover:underline text-sm; }
        
        .wiki-content .template { @apply bg-yellow-50 border border-yellow-300 p-3 rounded my-3 text-sm; }
        
        .wiki-content del { @apply line-through text-gray-500; }
        .wiki-content ins { @apply underline; }
        .wiki-content sup { @apply text-xs align-super; }
        .wiki-content sub { @apply text-xs align-sub; }
        .wiki-content small { @apply text-sm; }
      `}</style>
    </div>
  );
}