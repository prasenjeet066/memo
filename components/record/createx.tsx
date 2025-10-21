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
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
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
} from '@lexical/list';
import { $createLinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

interface EditorProps {
  editor_mode?: 'visual' | 'code';
  record_name?: string;
  onPublish?: () => void;
  sideBarTools?: () => void;
  ExpandedIs?: boolean;
  IsExpandedSet?: (value: boolean) => void;
}

interface Citation {
  id: string;
  text: string;
  url?: string;
  author?: string;
  date?: string;
  title?: string;
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

// Lexical Toolbar Plugin
function ToolbarPlugin({ 
  onCommand, 
  activeAction 
}: { 
  onCommand: (command: string) => void;
  activeAction: string | null;
}) {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      UNDO_COMMAND,
      () => {
        setCanUndo(editor.getEditorState().read(() => true));
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      REDO_COMMAND,
      () => {
        setCanRedo(editor.getEditorState().read(() => true));
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));
          setIsStrikethrough(selection.hasFormat('strikethrough'));
        }
      });
    });
  }, [editor]);

  return null;
}

// Custom Commands Plugin
function CustomCommandsPlugin({ 
  executeCommand 
}: { 
  executeCommand: (action: string, args?: any[]) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register custom keyboard shortcuts
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (payload) => {
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, executeCommand]);

  return null;
}

// HTML Import/Export Plugin
function HtmlPlugin({ 
  initialHtml,
  onHtmlChange 
}: { 
  initialHtml?: string;
  onHtmlChange: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialHtml) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        nodes.forEach(node => root.append(node));
      });
    }
  }, []);

  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          const html = $generateHtmlFromNodes(editor);
          onHtmlChange(html);
        });
      }}
    />
  );
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
  
  // Lexical configuration
  const initialConfig = {
    namespace: 'EnhancedEditor',
    theme: {
      paragraph: 'mb-2',
      heading: {
        h1: 'text-4xl font-bold mb-4 mt-6',
        h2: 'text-3xl font-bold mb-3 mt-5',
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
      link: 'text-blue-600 hover:underline',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-gray-100 px-1 py-0.5 rounded font-mono text-sm',
      },
      code: 'bg-gray-800 text-white p-4 rounded-lg font-mono text-sm block my-4',
      quote: 'border-l-4 border-gray-300 pl-4 italic my-4',
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
          const textNode = $createTextNode(`[${citationNumber}]`);
          selection.insertNodes([textNode]);
        }
      });
    }
    
    return newCitation.id;
  }, [citations.length]);
  
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
          const level = Math.min(Math.max(1, args?.[0] || 2), 6);
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const heading = $createHeadingNode(`h${level}` as any);
              selection.insertNodes([heading]);
            }
          });
          break;
        }
        
        case 'unorderedList':
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          break;
          
        case 'orderedList':
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
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
          
        case 'blockquote':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const quote = $createQuoteNode();
              selection.insertNodes([quote]);
            }
          });
          break;
          
        case 'horizontalRule':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const paragraph = $createParagraphNode();
              const text = $createTextNode('---');
              paragraph.append(text);
              selection.insertNodes([paragraph]);
            }
          });
          break;
          
        default:
          console.log(`Unknown command: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    } finally {
      setActiveAction(null);
    }
  }, [editorMode, citations.length]);
  
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog({ open: false, text: '' })}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (lexicalEditorRef.current && url) {
                lexicalEditorRef.current.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const linkNode = $createLinkNode(url);
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
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const paragraph = $createParagraphNode();
                    const text = $createTextNode(`![Image](${url})`);
                    paragraph.append(text);
                    selection.insertNodes([paragraph]);
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
              if (url) {
                // Handle video insertion
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
              if (onPublish) {
                onPublish();
              } else {
                console.log('Publishing...', { ...payload });
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
    <></>
  );
}