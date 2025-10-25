'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Fai } from '@/components/Fontawesome';
import { InfoBox, InfoBoxItem, InfoBoxField, ComplexValue } from '@/lib/editor/templates/infobox';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';
import DOMPurify from 'dompurify';

// Lexical imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';

import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { TableCellActionMenuPlugin } from '@lexical/react/TableCellActionMenuPlugin';
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableRowNode,
  TableNode,
} from "@lexical/table";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  
  COMMAND_PRIORITY_EDITOR,
  EditorState,
  LexicalEditor,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $createLinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $createCodeNode } from '@lexical/code';

interface EditorProps {
  editor_mode ? : 'visual' | 'code';
  record_name ? : string;
  onPublish ? : () => void;
  sideBarTools ? : () => void;
  ExpandedIs ? : boolean;
  IsExpandedSet ? : (value: boolean) => void;
}

interface Citation {
  id: string;
  text: string;
  url ? : string;
  author ? : string;
  date ? : string;
  title ? : string;
}

interface EditSummary {
  timestamp: number;
  content: string;
  summary: string;
  charChange: number;
}

// Utility: Sanitize HTML
const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'iframe', 'sup', 'sub', 'hr', 'blockquote', 'cite', 'abbr', 'mark'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'style', 'class', 'contenteditable',
      'data-table-id', 'colspan', 'border', 'frameborder', 'allowfullscreen', 'id', 'title',
      'data-cite-id', 'data-footnote-id'
    ],
    ALLOW_DATA_ATTR: true,
  });
};

// Custom Commands Plugin
function CustomCommandsPlugin({
  onCommand
}: {
  onCommand: (command: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (payload) => {
        onCommand('format');
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, onCommand]);
  
  return null;
}

// HTML Import/Export Plugin
function HtmlPlugin({
  initialHtml,
  onHtmlChange
}: {
  initialHtml ? : string;
  onHtmlChange: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const isInitialized = useRef(false);
  
  useEffect(() => {
    if (initialHtml && !isInitialized.current) {
      isInitialized.current = true;
      editor.update(() => {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          nodes.forEach(node => root.append(node));
        } catch (error) {
          console.error('Error loading initial HTML:', error);
        }
      });
    }
  }, [editor, initialHtml]);
  
  return (
      <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          try {
            const html = $generateHtmlFromNodes(editor);
            onHtmlChange(html);
          } catch (error) {
            console.error('Error generating HTML:', error);
          }
        });
      }}
    />
  );
}

// Editor ref plugin to expose editor instance
function EditorRefPlugin({ 
  editorRef 
}: { 
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);
  
  return null;
}

export default function EnhancedEditor({
  editor_mode = 'visual',
  record_name = 'Untitled Document',
  onPublish,
  IsExpandedSet,
}: EditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(editor_mode);
  const [payload, setPayload] = useState({ title: '', content: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');
  
  // New features
  const [citations, setCitations] = useState<Citation[]>([]);
  const [editHistory, setEditHistory] = useState<EditSummary[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  const { data: session } = useSession();
  const lexicalEditorRef = useRef<LexicalEditor | null>(null);
  const monacoEditorRef = useRef<any>(null);
  const [, startTransition] = useTransition();
  const [linkDialog, setLinkDialog] = useState({ open: false, text: '' });
  const [citationDialog, setCitationDialog] = useState({
    open: false,
    author: '',
    title: '',
    url: '',
    date: ''
  });
  const [imageDialog, setImageDialog] = useState({ open: false, url: '' });
  const [videoDialog, setVideoDialog] = useState({ open: false, url: '' });
  const [findReplaceDialog, setFindReplaceDialog] = useState({
    open: false,
    find: '',
    replace: ''
  });
  const [publishDialog, setPublishDialog] = useState({ open: false, summary: '' });
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Lexical configuration
  const initialConfig = {
    namespace: 'EnhancedEditor',
    theme: {
      paragraph: 'mb-2',
      heading: {
        h1: 'text-4xl font-bold mb-4 mt-6 border-b w-full pb-2',
        h2: 'text-3xl font-bold mb-3 mt-5 border-b w-full pb-2',
        h3: 'text-2xl font-bold mb-2 mt-4',
        h4: 'text-xl font-bold mb-2 mt-3',
        h5: 'text-lg font-bold mb-2 mt-2',
        h6: 'text-base font-bold mb-2 mt-2',
      },
      list: {
        ul: 'list-disc ml-6 mb-2',
        ol: 'list-decimal ml-6 mb-2',
        listitem: 'mb-1',
      },
      link: 'text-blue-600 hover:underline cursor-pointer',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-gray-100 px-1 py-0.5 rounded font-mono text-sm',
      },
      code: 'bg-gray-800 text-white p-4 rounded-lg font-mono text-sm block my-4 overflow-x-auto',
      quote: 'border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700',
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode,
],
  };
  
  // Statistics calculation
  const calculateStats = useCallback((content: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const chars = text.length;
    const readTime = Math.ceil(words.length / 200);
    
    setWordCount(words.length);
    setCharacterCount(chars);
    setReadingTime(readTime);
  }, []);
  
  // Handle content change from Lexical
  const handleLexicalChange = useCallback((html: string) => {
    setPayload(prev => ({ ...prev, content: html }));
    setAutoSaveStatus('unsaved');
    calculateStats(html);
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 2000);
  }, [calculateStats]);
  
  // Citation management
  const addCitation = useCallback((citation: Omit<Citation, 'id'>) => {
    const newCitation: Citation = {
      ...citation,
      id: `cite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setCitations(prev => [...prev, newCitation]);
    
    const citationNumber = citations.length + 1;
    
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const supNode = $createTextNode(`[${citationNumber}]`);
          selection.insertNodes([supNode]);
        }
      });
    }
    
    return newCitation.id;
  }, [citations.length]);
  
  // Generate references section
  const generateReferencesSection = useCallback(() => {
    if (citations.length === 0) return '';
    
    const refsHTML = citations.map((cite, index) => {
      let refText = `<li id="cite-${cite.id}">`;
      
      if (cite.author) refText += `${sanitizeHTML(cite.author)}. `;
      if (cite.title) refText += `"${sanitizeHTML(cite.title)}". `;
      if (cite.url) refText += `<a href="${encodeURI(cite.url)}" target="_blank">${sanitizeHTML(cite.url)}</a>. `;
      if (cite.date) refText += `Retrieved ${sanitizeHTML(cite.date)}.`;
      
      refText += `</li>`;
      return refText;
    }).join('');
    
    return `
      <h2>References</h2>
      <ol class="references-list" style="font-size: 0.9em; line-height: 1.6;">
        ${refsHTML}
      </ol>
    `;
  }, [citations]);
  
  // Execute commands
  const executeCommand = useCallback((action: string, args?: any[]) => {
    if (editorMode !== 'visual' || !lexicalEditorRef.current) return;
    
    const editor = lexicalEditorRef.current;
    
    try {
      switch (action) {
        case 'bold':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          break;
          
        case 'italic':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          break;
          
        case 'underline':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          break;
          
        case 'strikethrough':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          break;
          
        case 'inlineCode':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          break;
          
        case 'heading': {
          const level = Math.min(Math.max(1, args?.[0] || 2), 6) as 1 | 2 | 3 | 4 | 5 | 6;
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const heading = $createHeadingNode(`h${level}`);
              const text = selection.getTextContent() || 'Heading';
              heading.append($createTextNode(text));
              selection.insertNodes([heading]);
            }
          });
          break;
        }
        
        case 'paragraph':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          });
          break;
        
        case 'unorderedList':
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          break;
          
        case 'orderedList':
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          break;
          
        case 'refList':
          const refsSection = generateReferencesSection();
          if (refsSection) {
            editor.update(() => {
              const parser = new DOMParser();
              const dom = parser.parseFromString(refsSection, 'text/html');
              const nodes = $generateNodesFromDOM(editor, dom);
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes(nodes);
              }
            });
          } else {
            alert('No citations added yet. Add citations first using the citation tool.');
          }
          break;
          
        case 'link':
          setLinkDialog({ open: true, text: '' });
          break;
          
        case 'citation':
          setCitationDialog({ open: true, author: '', title: '', url: '', date: '' });
          break;
          
        case 'image':
          setImageDialog({ open: true, url: '' });
          break;
          
        case 'video':
          setVideoDialog({ open: true, url: '' });
          break;
          
        case 'codeBlock':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const codeNode = $createCodeNode();
              codeNode.append($createTextNode('// Your code here'));
              selection.insertNodes([codeNode]);
            }
          });
          break;
          
        case 'math':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode('E = mc²'));
              selection.insertNodes([paragraph]);
            }
          });
          break;
          
        case 'blockquote':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const quote = $createQuoteNode();
              const text = selection.getTextContent() || 'Quote text';
              quote.append($createTextNode(text));
              selection.insertNodes([quote]);
            }
          });
          break;
          
        case 'horizontalRule':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const paragraph = $createParagraphNode();
              const hr = $createTextNode('---');
              paragraph.append(hr);
              selection.insertNodes([paragraph]);
            }
          });
          break;
          
        case 'reference':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const refNode = $createTextNode('[1]');
              selection.insertNodes([refNode]);
            }
          });
          break;
          
        case 'table':
        
          editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: 3, rows: 3,     includeHeaders: true, })
          break;
        case 'template':

          break;
          
        default:
          console.log(`Unknown command: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    } finally {
      setActiveAction(null);
    }
  }, [editorMode, citations.length, generateReferencesSection]);
  
  // Toolbar action handler
  const handleToolbarAction = useCallback((action: string) => {
    if (action) {
      setActiveAction(action);
    }
  }, []);
  
  // Mode switching
  const handleSwMode = useCallback((mode: string) => {
    const newMode = mode as 'visual' | 'code';
    setEditorMode(newMode);
  }, []);
  
  // Code editor change
  const handleEditorContentChangeCode = useCallback((value?: string) => {
    setPayload(prev => ({ ...prev, content: value || '' }));
    setAutoSaveStatus('unsaved');
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      if (value) {
        calculateStats(value);
      }
      setAutoSaveStatus('saved');
    }, 2000);
  }, [calculateStats]);
  
  // Publish handler
  const handlePublish = useCallback(() => {
    setPublishDialog({ open: true, summary: '' });
  }, []);
  
  // Preview handler
  const handlePreview = useCallback(() => {
    setShowPreview(!showPreview);
  }, [showPreview]);
  
  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.dispatchCommand(UNDO_COMMAND, undefined);
    }
  }, []);
  
  const handleRedo = useCallback(() => {
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.dispatchCommand(REDO_COMMAND, undefined);
    }
  }, []);
  
  // Find and Replace
  const findAndReplace = useCallback((searchTerm: string, replaceTerm: string, replaceAll: boolean = false) => {
    if (!lexicalEditorRef.current) return;
    
    lexicalEditorRef.current.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      
      if (textContent.includes(searchTerm)) {
        const regex = new RegExp(searchTerm, replaceAll ? 'gi' : 'i');
        const newContent = replaceAll ? 
          textContent.replace(regex, replaceTerm) : 
          textContent.replace(regex, replaceTerm);
        
        // This is a simplified implementation
        // In production, you'd want to traverse the nodes properly
        console.log('Replace functionality - simplified version');
      }
    });
  }, []);
  
  // Monitor undo/redo state
  useEffect(() => {
    if (!lexicalEditorRef.current) return;
    
    return lexicalEditorRef.current.registerUpdateListener(() => {
      lexicalEditorRef.current?.getEditorState().read(() => {
        // Update undo/redo button states
        setCanUndo(true);
        setCanRedo(true);
      });
    });
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      }
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        executeCommand('link');
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlePublish();
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchTerm = prompt('Find:');
        if (searchTerm) {
          window.find(searchTerm);
        }
      }
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setFindReplaceDialog({ open: true, find: '', replace: '' });
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        handlePreview();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [executeCommand, handleUndo, handleRedo, handlePublish, handlePreview]);
  
  // Execute active action
  useEffect(() => {
    if (activeAction) {
      executeCommand(activeAction);
    }
  }, [activeAction, executeCommand]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);
  
  const hasRegisteredRole = Array.isArray(session?.user?.role) && session.user.role.includes('REG');
  
  // Dialog Components
  const LinkDialog = () => {
    const [url, setUrl] = useState('');
    
    return (
      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog({ open, text: '' })}>
        <DialogContent className='rounded bg-white'>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>Enter the URL for the link</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url && lexicalEditorRef.current) {
                    lexicalEditorRef.current.update(() => {
                      const selection = $getSelection();
                      if ($isRangeSelection(selection)) {
                        const linkNode = $createLinkNode(url);
                        const textNode = $createTextNode(selection.getTextContent() || 'Link');
                        linkNode.append(textNode);
                        selection.insertNodes([linkNode]);
                      }
                    });
                    setLinkDialog({ open: false, text: '' });
                    setUrl('');
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog({ open: false, text: '' })}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (url && lexicalEditorRef.current) {
                lexicalEditorRef.current.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const linkNode = $createLinkNode(url);
                    const textNode = $createTextNode(selection.getTextContent() || 'Link');
                    linkNode.append(textNode);
                    selection.insertNodes([linkNode]);
                  }
                });
              }
              setLinkDialog({ open: false, text: '' });
              setUrl('');
            }}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  const CitationDialog = () => (
    <Dialog open={citationDialog.open} onOpenChange={(open) => 
      setCitationDialog({ open, author: '', title: '', url: '', date: '' })
    }>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Add Citation</DialogTitle>
          <DialogDescription>Enter citation details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cite-author">Author *</Label>
            <Input
              id="cite-author"
              placeholder="Author name"
              value={citationDialog.author}
              onChange={(e) => setCitationDialog(prev => ({ ...prev, author: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cite-title">Title</Label>
            <Input
              id="cite-title"
              placeholder="Title of work"
              value={citationDialog.title}
              onChange={(e) => setCitationDialog(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cite-url">URL</Label>
            <Input
              id="cite-url"
              placeholder="https://example.com"
              value={citationDialog.url}
              onChange={(e) => setCitationDialog(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => 
            setCitationDialog({ open: false, author: '', title: '', url: '', date: '' })
          }>
            Cancel
          </Button>
          <Button onClick={() => {
            if (citationDialog.author) {
              const date = new Date().toLocaleDateString();
              addCitation({
                text: citationDialog.author,
                author: citationDialog.author,
                title: citationDialog.title || '',
                url: citationDialog.url || '',
                date,
              });
              setCitationDialog({ open: false, author: '', title: '', url: '', date: '' });
            }
          }}>
            Add Citation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  const ImageDialog = () => {
    const [url, setUrl] = useState('');
    
    return (
      <Dialog open={imageDialog.open} onOpenChange={(open) => setImageDialog({ open, url: '' })}>
        <DialogContent className='rounded bg-white'>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>Enter the image URL</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog({ open: false, url: '' })}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (url && lexicalEditorRef.current) {
                lexicalEditorRef.current.update(() => {
                  const parser = new DOMParser();
                  const imgHtml = `<img src="${encodeURI(url)}" alt="Image" style="max-width: 100%; height: auto;" />`;
                  const dom = parser.parseFromString(imgHtml, 'text/html');
                  const nodes = $generateNodesFromDOM(lexicalEditorRef.current!, dom);
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    selection.insertNodes(nodes);
                  }
                });
              }
              setImageDialog({ open: false, url: '' });
              setUrl('');
            }}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  const VideoDialog = () => {
    const [url, setUrl] = useState('');
    
    return (
      <Dialog open={videoDialog.open} onOpenChange={(open) => setVideoDialog({ open, url: '' })}>
        <DialogContent className='rounded bg-white'>
          <DialogHeader>
            <DialogTitle>Insert Video</DialogTitle>
            <DialogDescription>Enter the video URL (YouTube/Vimeo embed URL)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/embed/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialog({ open: false, url: '' })}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (url && lexicalEditorRef.current) {
                lexicalEditorRef.current.update(() => {
                  const parser = new DOMParser();
                  const iframeHtml = `<iframe width="560" height="315" src="${encodeURI(url)}" frameborder="0" allowfullscreen></iframe>`;
                  const dom = parser.parseFromString(iframeHtml, 'text/html');
                  const nodes = $generateNodesFromDOM(lexicalEditorRef.current!, dom);
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    selection.insertNodes(nodes);
                  }
                });
              }
              setVideoDialog({ open: false, url: '' });
              setUrl('');
            }}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  const FindReplaceDialog = () => (
    <Dialog open={findReplaceDialog.open} onOpenChange={(open) => 
      setFindReplaceDialog({ open, find: '', replace: '' })
    }>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Find and Replace</DialogTitle>
          <DialogDescription>Search and replace text in the document</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="find-text">Find</Label>
            <Input
              id="find-text"
              placeholder="Text to find"
              value={findReplaceDialog.find}
              onChange={(e) => setFindReplaceDialog(prev => ({ ...prev, find: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="replace-text">Replace with</Label>
            <Input
              id="replace-text"
              placeholder="Replacement text"
              value={findReplaceDialog.replace}
              onChange={(e) => setFindReplaceDialog(prev => ({ ...prev, replace: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => 
            setFindReplaceDialog({ open: false, find: '', replace: '' })
          }>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => {
            if (findReplaceDialog.find) {
              findAndReplace(findReplaceDialog.find, findReplaceDialog.replace, false);
              setFindReplaceDialog({ open: false, find: '', replace: '' });
            }
          }}>
            Replace
          </Button>
          <Button onClick={() => {
            if (findReplaceDialog.find) {
              findAndReplace(findReplaceDialog.find, findReplaceDialog.replace, true);
              setFindReplaceDialog({ open: false, find: '', replace: '' });
            }
          }}>
            Replace All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  const PublishDialog = () => (
    <Dialog open={publishDialog.open} onOpenChange={(open) => 
      setPublishDialog({ open, summary: '' })
    }>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Publish Document</DialogTitle>
          <DialogDescription>Enter a brief summary of your changes</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-summary">Edit Summary</Label>
            <Textarea
              id="edit-summary"
              placeholder="Describe your changes..."
              value={publishDialog.summary}
              onChange={(e) => setPublishDialog(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPublishDialog({ open: false, summary: '' })}>
            Cancel
          </Button>
          <Button onClick={() => {
            if (publishDialog.summary) {
              const currentContent = payload.content;
              const prevContent = editHistory[editHistory.length - 1]?.content || '';
              const charChange = currentContent.length - prevContent.length;
              
              setEditHistory(prev => [...prev, {
                timestamp: Date.now(),
                content: currentContent,
                summary: publishDialog.summary,
                charChange,
              }]);
              
              if (onPublish) {
                onPublish();
              } else {
                console.log('Publishing...', { ...payload, content: currentContent });
              }
              
              setAutoSaveStatus('saved');
              setPublishDialog({ open: false, summary: '' });
            }
          }}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            {record_name?.trim() || 'Untitled Document'}
          </h1>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Fai icon="undo" style="fal" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Fai icon="redo" style="fal" />
          </button>
          
          <button
            onClick={handlePreview}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Preview (Ctrl+Shift+P)"
            aria-label="Preview"
          >
            <Fai icon="eye" style="fal" />
          </button>
          
          {hasRegisteredRole && (
            <DropdownMenu>
              <DropdownMenuTrigger className="max-w-[140px] w-auto h-10 border-none bg-white rounded-full px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                {editorMode === 'visual' ? 'Visual' : 'Code'}
                <Fai icon="chevron-down" style="fas" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSwMode('visual')}>
                  Visual
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSwMode('code')}>
                  Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <button 
            className="border-none rounded-full p-2 text-black flex items-center hover:bg-gray-100"
            aria-label="Settings"
            onClick={() => {
              const enabled = confirm('Enable spell check? (Currently ' + (spellCheckEnabled ? 'enabled' : 'disabled') + ')');
              setSpellCheckEnabled(enabled);
            }}
          >
            <Fai icon="gear" style="fal" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center w-full p-2 gap-2 text-xs text-gray-500">
        <span className='p-2 border-r'>{wordCount} words</span>
        <span className='p-2 border-r'>{characterCount} characters</span>
        <span className='p-2 border-r'>{readingTime} min read</span>
        <span className={`font-medium ${
          autoSaveStatus === 'saved' ? 'text-green-600' : 
          autoSaveStatus === 'saving' ? 'text-yellow-600' : 
          'text-gray-400'
        }`}>
          {autoSaveStatus === 'saved' ? 'Saved' : 
           autoSaveStatus === 'saving' ? 'Saving...' : 
           'Unsaved'}
        </span>
      </div>
      
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1">
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            {toolbarBlocks.map((block: any, index: number) => {
              if (block.items && Array.isArray(block.items)) {
                if (block.name === 'Paragraph') {
                  return (
                    <DropdownMenu key={`toolbar-dropdown-${index}`}>
                      <DropdownMenuTrigger className="max-w-[180px] border-l border-r w-auto h-10 border-none px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                        {block.name}
                        <Fai icon="chevron-down" style="fas" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {block.items.map((item: any, itemIndex: number) => (
                          <DropdownMenuItem 
                            key={`item-${index}-${itemIndex}`}
                            onClick={() => handleToolbarAction(item.action || item.label)}
                          >
                            <div className="flex items-center gap-2">
                              <Fai icon={item.icon} style="fas" />
                              <span>{item.label}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return (
                  <DropdownMenu key={`toolbar-dropdown-${index}`}>
                    <DropdownMenuTrigger className="max-w-[180px] border-l border-r w-auto h-10 border-none px-3 py-2 hover:bg-gray-100">
                      <Fai icon={block.icon} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {block.items.map((item: any, itemIndex: number) => (
                        <DropdownMenuItem 
                          key={`item-${index}-${itemIndex}`}
                          onClick={() => handleToolbarAction(item.action || item.label)}
                        >
                          <div className="flex items-center gap-2">
                            <Fai icon={item.icon} style="fas" />
                            <span>{item.label}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
                <button
                  key={`toolbar-btn-${index}`}
                  id={block.action}
                  className={`px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded ${
                    block.action === activeAction ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                  onClick={() => handleToolbarAction(block.action)}
                  title={block.label}
                  aria-label={block.label}
                  type="button"
                >
                  <Fai icon={block.icon} style="fas" />
                </button>
              );
            })}
            
            <button
              className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700"
              onClick={() => handleToolbarAction('citation')}
              title="Add Citation"
              aria-label="Add Citation"
              type="button"
            >
              <Fai icon="quote-right" style="fas" />
            </button>
            
            <button
              className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700"
              onClick={() => handleToolbarAction('blockquote')}
              title="Blockquote"
              aria-label="Blockquote"
              type="button"
            >
              <Fai icon="quote-left" style="fas" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2" />
        )}

        <div className="flex items-center border-l pl-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors m-2 rounded-full"
            onClick={handlePublish}
            aria-label="Publish document"
            type="button"
            title="Publish (Ctrl+S)"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative">
        {showPreview ? (
          <div className="p-8 w-full min-h-full prose max-w-none" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm font-medium text-yellow-800">Preview Mode - Read Only</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(payload.content) }} />
          </div>
        ) : editorMode === 'code' ? (
          <Editor
            height="100%"
            defaultLanguage="html"
            value={payload.content || '<!-- Write your code... -->'}
            onMount={(editor) => {
              monacoEditorRef.current = editor;
              editor.updateOptions({
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              });
            }}
            onChange={handleEditorContentChangeCode}
            theme="vs-light"
            options={{
              selectOnLineNumbers: true,
              roundedSelection: false,
              cursorStyle: 'line',
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="p-8 w-full min-h-full" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <LexicalComposer initialConfig={initialConfig}>
              <div className="relative">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable 
                      className="outline-none prose max-w-none min-h-[500px]"
                      style={{ minHeight: '500px' }}
                      spellCheck={spellCheckEnabled}
                    />
                  }
                  placeholder={
                    <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
                      Start writing...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <LinkPlugin />
                <ListPlugin />
               
               <TablePlugin/>
               
              
               <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <HtmlPlugin 
                  initialHtml={payload.content}
                  onHtmlChange={handleLexicalChange}
                />
                     <CustomCommandsPlugin onCommand={(cmd) => console.log('Command:', cmd)} />
                <EditorRefPlugin editorRef={lexicalEditorRef} />
              </div>
            </LexicalComposer>
          </div>
        )}
      </div>

      {isGenerating && (
        <div 
          className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Generating AI content...</span>
        </div>
      )}
      
      {citations.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="font-semibold mb-2 text-sm">Citations ({citations.length})</div>
          <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
            {citations.map((cite, idx) => (
              <div key={cite.id} className="border-b pb-1">
                <span className="font-medium">[{idx + 1}]</span> {cite.author || cite.text}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs opacity-0 hover:opacity-100 transition-opacity">
        <div className="font-semibold mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+B</kbd> Bold</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+I</kbd> Italic</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+U</kbd> Underline</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+K</kbd> Insert Link</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+F</kbd> Find</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+H</kbd> Find & Replace</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Z</kbd> Undo</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Y</kbd> Redo</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+S</kbd> Publish</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Shift+P</kbd> Preview</div>
        </div>
      </div>
      
      <LinkDialog />
      <CitationDialog />
      <ImageDialog />
      <VideoDialog />
      <FindReplaceDialog />
      <PublishDialog />

    </div>
  );
}