import { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  Video,
  FileCode,
  Sigma,
  List,
  ListOrdered,
  Table,
  Package,
  Minus,
  Superscript,
  Subscript,
  Type,
  FileText,
  ListChecks,
  Quote,
  AlignLeft,
  BookOpen,
  Minimize2,
  Puzzle,
  ListTree,
} from "lucide-react";
import { parseMarkup, applyEditorCommand } from '@/lib/utils/dist/markup';

export default function MediaWikiEditor() {
  const [wikitext, setWikitext] = useState('');
  const [preview, setPreview] = useState('');
  const [metadata, setMetadata] = useState < any > ({});
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState < 'edit' | 'preview' | 'split' > ('split');
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  
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
            insertText(text ? `[${url} ${text}]` : `[${url}]`);
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
  
  const Blocks = [
    { icon: Bold, action: 'bold' },
    { icon: Italic, action: 'italic' },
    { icon: Type, action: 'boldItalic' },
    { icon: Strikethrough, action: 'strikethrough' },
    { icon: Underline, action: 'underline' },
    { icon: Code, action: 'inlineCode' },
    { icon: Heading1, action: 'heading1' },
    { icon: Heading2, action: 'heading2' },
    { icon: Heading3, action: 'heading3' },
    { icon: Link, action: 'link' },
    { icon: ImageIcon, action: 'image' },
    { icon: Video, action: 'video' },
    { icon: FileCode, action: 'codeBlock' },
    { icon: Sigma, action: 'math' },
    { icon: List, action: 'unorderedList' },
    { icon: ListOrdered, action: 'orderedList' },
    { icon: Table, action: 'table' },
    { icon: Puzzle, action: 'template' },
    { icon: Minus, action: 'horizontalRule' },
    { icon: Superscript, action: 'superscript' },
    { icon: Subscript, action: 'subscript' },
    { icon: Minimize2, action: 'small' },
    { icon: FileText, action: 'reference' },
    { icon: ListChecks, action: 'refList' },
  ];
  
  return (
    <div className='w-full h-full'>
      <div className='flex items-center justify-between border-b p-2'>
        <div className='flex items-center space-x-2'>
          <List className='h-5 w-5' />
          <h1 className='text-lg font-semibold'>Sakib Al Hasan</h1>
        </div>
      </div>

      <div className='flex items-center justify-between p-2 w-full'>
        <div className='flex items-center flex-wrap gap-1 p-2 w-full bg-indigo-50 rounded flex-1'>
          {Blocks.map((block, i) => (
            <button
              key={i}
              onClick={() => applyCommand(block.action)}
              className='p-1 hover:bg-indigo-200 rounded transition'
            >
              <block.icon className='h-4 w-4' />
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          className='text-sm rounded bg-black text-white px-3 py-1 ml-2 hover:bg-gray-800 transition'
        >
          Publish
        </button>
      </div>

      <div className='w-full min-h-screen bg-gray-50 p-4'>
        <textarea
          ref={textareaRef}
          value={wikitext}
          onChange={(e) => setWikitext(e.target.value)}
          onKeyDown={handleKeyDown}
          className='w-full h-96 border rounded p-2 font-mono text-sm'
          placeholder='Start writing your article...'
        />
        <div
          className='mt-4 p-3 bg-white border rounded shadow-sm prose max-w-none'
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
}