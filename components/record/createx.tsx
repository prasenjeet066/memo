// components/record/createx.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import '@mdxeditor/editor/style.css';

import { EditorProps, Citation, AutoSaveStatus, PublishStatus } from '@/types/editor.types';
import { calculateTextStats, generateReferencesSection, generateCitationId } from '@/utils/editor.utils';
import {
  CitationDialog,
  FindReplaceDialog,
  PublishDialog,
} from '@/components/editor/dialogs/EditorDialogs';

import { EditorHeader } from '@/components/editor/EditorHeader';
import { EditorStatusBar } from '@/components/editor/EditorStatusBar';
import { Button } from '@/components/ui/button';

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditor = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.MDXEditor),
  { ssr: false }
);

const {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  ListsToggle,
  Separator,
  InsertCodeBlock,
  InsertThematicBreak,
} = await import('@mdxeditor/editor');

export default function EnhancedEditor({
  editor_mode = 'visual',
  record_name,
  onPublish,
  isSuccesfullCreated,
  __data,
}: EditorProps) {
  // States
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(editor_mode);
  const [payload, setPayload] = useState({
    slug: __data?.slug || '',
    title: __data?.title || '',
    content: __data?.content || ''
  });
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('saved');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  
  // Dialog states
  const [citationDialog, setCitationDialog] = useState({
    open: false,
    author: '',
    title: '',
    url: '',
    date: ''
  });
  const [findReplaceDialog, setFindReplaceDialog] = useState({
    open: false,
    find: '',
    replace: ''
  });
  const [publishDialog, setPublishDialog] = useState({ open: false, summary: '' });
  
  // Refs
  const { data: session } = useSession();
  const mdxEditorRef = useRef<any>(null);
  const monacoEditorRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate statistics
  const calculateStats = useCallback((content: string) => {
    const stats = calculateTextStats(content);
    setWordCount(stats.wordCount);
    setCharacterCount(stats.characterCount);
    setReadingTime(stats.readingTime);
  }, []);
  
  // Handle content change
  const handleMDXChange = useCallback((markdown: string) => {
    setPayload(prev => ({ ...prev, content: markdown }));
    setAutoSaveStatus('unsaved');
    calculateStats(markdown);
    
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
      id: generateCitationId(),
    };
    
    setCitations(prev => [...prev, newCitation]);
    
    const citationNumber = citations.length + 1;
    const citationText = `[^${citationNumber}]`;
    
    if (mdxEditorRef.current) {
      const currentContent = mdxEditorRef.current.getMarkdown();
      const newContent = currentContent + citationText;
      mdxEditorRef.current.setMarkdown(newContent);
    }
    
    return newCitation.id;
  }, [citations.length]);
  
  const generateRefs = useCallback(() => {
    return generateReferencesSection(citations);
  }, [citations]);
  
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
  
  // Handlers
  const handlePublish = useCallback(() => {
    setPublishDialog({ open: true, summary: '' });
  }, []);
  
  const handlePreview = useCallback(() => {
    setShowPreview(!showPreview);
  }, [showPreview]);
  
  const handleUndo = useCallback(() => {
    if (mdxEditorRef.current) {
      mdxEditorRef.current.undo();
    }
  }, []);
  
  const handleRedo = useCallback(() => {
    if (mdxEditorRef.current) {
      mdxEditorRef.current.redo();
    }
  }, []);
  
  const findAndReplace = useCallback((searchTerm: string, replaceTerm: string, replaceAll: boolean = false) => {
    if (!mdxEditorRef.current) return;
    const content = mdxEditorRef.current.getMarkdown();
    const newContent = replaceAll 
      ? content.replaceAll(searchTerm, replaceTerm)
      : content.replace(searchTerm, replaceTerm);
    mdxEditorRef.current.setMarkdown(newContent);
  }, []);
  
  const handlePublishSubmit = async (summary: string) => {
    setPublishStatus({ type: 'loading', message: 'Publishing...' });
    
    try {
      await onPublish?.({
        ...payload,
        summary,
      });
    } catch (error) {
      setPublishStatus({
        type: 'error',
        message: 'Failed to publish. Please try again.'
      });
    }
  };
  
  // Monitor publish result
  useEffect(() => {
    if (isSuccesfullCreated !== null) {
      if (isSuccesfullCreated.success === true) {
        setPublishStatus({
          type: 'success',
          message: 'Article published successfully! Redirecting...'
        });
        setTimeout(() => {
          setPublishDialog({ open: false, summary: '' });
          setPublishStatus(null);
        }, 2000);
      } else if (isSuccesfullCreated.success === false) {
        setPublishStatus({
          type: 'error',
          message: isSuccesfullCreated.message || 'Failed to publish'
        });
      }
    }
  }, [isSuccesfullCreated]);
  
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
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlePublish();
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
  }, [handleUndo, handleRedo, handlePublish, handlePreview]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);
  
  const hasRegisteredRole = Array.isArray(session?.user?.role) && session.user.role.includes('ADMIN');
  
  return (
    <div className="w-full h-full flex flex-col">
      <EditorHeader
        recordName={record_name}
        canUndo={canUndo}
        canRedo={canRedo}
        editorMode={editorMode}
        hasRegisteredRole={hasRegisteredRole}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreview={handlePreview}
        onModeChange={setEditorMode}
        handlePublish = {handlePublishSubmit}
      />
      
      <EditorStatusBar
        wordCount={wordCount}
        characterCount={characterCount}
        readingTime={readingTime}
        autoSaveStatus={autoSaveStatus}
      />

      <div className="flex-1 overflow-auto bg-white relative">
        {showPreview ? (
          <div className="p-8 w-full min-h-full prose max-w-full" style={{ maxWidth: '100%', margin: '0 auto' }}>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm font-medium text-yellow-800">Preview Mode - Read Only</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: payload.content }} />
          </div>
        ) : editorMode === 'code' ? (
          <>
            {/* Code mode toolbar with publish button */}
            <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1 mb-2">
              <div className="flex-1" />
              <div className="flex items-center border-l pl-2">
                <Button
                  className="px-4 py-2 bg-gray-600 text-white transition-colors m-2 rounded-full"
                  onClick={handlePublish}
                  aria-label="Publish document"
                  type="button"
                  title="Publish (Ctrl+S)"
                >
                  Publish
                </Button>
              </div>
            </div>
            <Editor
              height="calc(100% - 60px)"
              defaultLanguage="markdown"
              value={payload.content || '<!-- Write your markdown... -->'}
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
            />
          </>
        ) : (
          <div className="w-full min-h-full">
            <style jsx global>{`
              .mdxeditor-root-contenteditable {
                max-width: 100%;
                margin: 0 auto;
                padding: 4px
              }
              
              .mdxeditor-toolbar {
                background-color: #f9fafb;
                padding: 0.25rem 0.5rem;
                
                max-width: fit-content;
                border: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 4px;
              }
              
              .mdxeditor-toolbar button {
                border-radius: 0.375rem;
                padding: 0.5rem 0.75rem;
                border: none;
                background: transparent;
                transition: background-color 0.2s;
              }
              
              .mdxeditor-toolbar button:hover {
                background-color: #e5e7eb;
              }
              
              .mdxeditor-toolbar select {
                border: none;
                background: transparent;
                padding: 0.5rem 1rem;
                border-left: 1px solid #e5e7eb;
                border-right: 1px solid #e5e7eb;
                font-weight: 600;
                max-width: 180px;
              }
              
              .mdxeditor-toolbar select:hover {
                background-color: #e5e7eb;
              }
              
              .mdxeditor-toolbar [role="separator"] {
                width: 1px;
                height: 24px;
                background-color: #e5e7eb;
                margin: 0 0.25rem;
              }
              
              /* Custom publish button in toolbar */
              .custom-publish-button {
                margin-left: auto;
                padding-left: 0.5rem;
                border-left: 1px solid #e5e7eb;
              }
              
              .custom-publish-button button {
                background-color: #4b5563;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 9999px;
                margin: 0.5rem;
              }
              
              .custom-publish-button button:hover {
                background-color: #374151;
              }
            `}</style>
            
            <MDXEditor
              ref={mdxEditorRef}
              markdown={payload.content}
              onChange={handleMDXChange}
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin(),
                tablePlugin(),
                codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
                codeMirrorPlugin({ 
                  codeBlockLanguages: { 
                    js: 'JavaScript', 
                    css: 'CSS', 
                    html: 'HTML', 
                    python: 'Python',
                    typescript: 'TypeScript',
                    json: 'JSON'
                  } 
                }),
                markdownShortcutPlugin(),
                toolbarPlugin({
                  toolbarContents: () => (
                    <>
                      <UndoRedo />
                      <Separator />
                      <BoldItalicUnderlineToggles />
                      <Separator />
                      <BlockTypeSelect />
                      <Separator />
                      <CreateLink />
                      <InsertImage />
                      <Separator />
                      <ListsToggle />
                      <Separator />
                      <InsertTable />
                      <InsertCodeBlock />
                      <InsertThematicBreak />
                    </>
                  )
                }),
                diffSourcePlugin({ viewMode: 'rich-text' }),
              ]}
              contentEditableClassName="prose max-w-none min-h-[500px] outline-none"
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CitationDialog 
        state={citationDialog} 
        setState={setCitationDialog} 
        onAddCitation={addCitation} 
      />
      <FindReplaceDialog 
        state={findReplaceDialog} 
        setState={setFindReplaceDialog} 
        onFindReplace={findAndReplace} 
      />
      <PublishDialog 
        state={publishDialog} 
        setState={setPublishDialog} 
        publishStatus={publishStatus}
        onPublish={handlePublishSubmit} 
      />
      
      {/* Citations sidebar */}
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
    </div>
  );
}