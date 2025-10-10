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
  BookOpen
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
  

let Blocks = [
  { icon: Bold, action: 'bold' },
  { icon: Italic, action: 'italic' },
  { icon: Type, action: 'boldItalic' },
  { icon: Strikethrough, action: 'strikethrough' },
  { icon: Underline, action: 'underline' },
  { icon: Code, action: 'inlineCode' },
  { icon: Heading, action: 'heading' },
  { icon: Link, action: 'internalLink' },
  { icon: Link, action: 'externalLink' },
  { icon: ImageIcon, action: 'image' },
  { icon: ImageIcon, action: 'thumbnail' },
  { icon: Video, action: 'video' },
  { icon: CodeSquare, action: 'codeBlock' },
  { icon: Sigma, action: 'math' },
  { icon: List, action: 'unorderedList' },
  { icon: ListOrdered, action: 'orderedList' },
  { icon: ListTree, action: 'definitionList' },
  { icon: Table, action: 'table' },
  { icon: Puzzle, action: 'template' },
  { icon: Minus, action: 'horizontalRule' },
  { icon: Superscript, action: 'superscript' },
  { icon: Subscript, action: 'subscript' },
  { icon: Minimize2, action: 'small' },
  { icon: FileText, action: 'reference' },
  { icon: ListChecks, action: 'refList' }
];
  return (
    <>
      <div className='w-full h-full'>
        <div className='flex items-center justify-between border-b'>
           <div className='flex items-center justify-start'>
          <List className='h-5 w-5'/>
          <h1>{'Sakib Al Hasan'}</h1>
          </div>
        </div>
        <div className='flex items-center justify-between p-2 w-full'>
          <div className='flex items-center justify-between p-2 w-full bg-indigo-50 rounded flex-1 '>
          {
            Blocks.map((block)=>(
              <block.icon className ='h-3 w-3 p-2'/>
            ))
          }
        </div>
        <button className='text-sm rounded bg-black text-white px-2'>
          Publish
        </button>
        </div>
        <div className = 'w-full min-h-screen bg-gray-50'>
          
        </div>
      </div>
      
    </>
  );
}