'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import TableActionMenuPlugin from '@/components/utils/editor/plugins/TableActionMenuPlugin'
import { TRANSFORMERS } from '@lexical/markdown';
import { UNDO_COMMAND, REDO_COMMAND, LexicalEditor } from 'lexical';

import { initialConfig } from '@/config/lexical.config';
import { EditorProps, Citation, AutoSaveStatus, PublishStatus } from '@/types/editor.types';
import { calculateTextStats, generateReferencesSection, generateCitationId } from '@/utils/editor.utils';
import { useEditorCommands } from '@/hooks/useEditorCommands';
import { HtmlPlugin, EditorRefPlugin, CustomCommandsPlugin } from '@/components/editor/plugins/EditorPlugins';
import {
  LinkDialog,
  CitationDialog,
  ImageDialog,
  VideoDialog,
  TableDialog,
  FindReplaceDialog,
  PublishDialog,
} from '@/components/editor/dialogs/EditorDialogs';

import { ImagesPlugin } from '@/components/utils/editor/plugins/Image';
//import { TableToolbar } from '@/components/utils/editor/plugins/Table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { EditorHeader } from '@/components/editor/EditorHeader';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorStatusBar } from '@/components/editor/EditorStatusBar';

export default function EnhancedEditor({
  editor_mode = 'visual',
  record_name,
  onPublish,
  isSuccesfullCreated,
  __data,
}: EditorProps) {
  // States
  const [editorMode, setEditorMode] = useState < 'visual' | 'code' > (editor_mode);
  const [payload, setPayload] = useState({
    slug: __data?.slug || '',
    title: __data?.title || '',
    content: __data?.content || ''
  });
  
  const [citations, setCitations] = useState < Citation[] > ([]);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState < AutoSaveStatus > ('saved');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [publishStatus, setPublishStatus] = useState < PublishStatus | null > (null);
  
  // Dialog states
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
  const [isTableDialog, setIsTableDialog] = useState(false);
  
  // Refs
  const { data: session } = useSession();
  const lexicalEditorRef = useRef < LexicalEditor | null > (null);
  const monacoEditorRef = useRef < any > (null);
  const autoSaveTimerRef = useRef < NodeJS.Timeout | null > (null);
  
  // Initialize data
  useEffect(() => {
    if (__data) {
      setPayload(prev => ({ ...prev, slug: __data.slug, id: __data.id }));
    }
  }, [__data]);
  
  // Calculate statistics
  const calculateStats = useCallback((content: string) => {
    const stats = calculateTextStats(content);
    setWordCount(stats.wordCount);
    setCharacterCount(stats.characterCount);
    setReadingTime(stats.readingTime);
  }, []);
  const [toolbar , setToolbar] = useState(null)
  // Handle content change
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
  const addCitation = useCallback((citation: Omit < Citation, 'id' > ) => {
    const newCitation: Citation = {
      ...citation,
      id: generateCitationId(),
    };
    
    setCitations(prev => [...prev, newCitation]);
    
    const citationNumber = citations.length + 1;
    
    if (lexicalEditorRef.current) {
      lexicalEditorRef.current.update(() => {
        const selection = window.getSelection();
        if (selection) {
          const supNode = document.createTextNode(`[${citationNumber}]`);
          selection.getRangeAt(0).insertNode(supNode);
        }
      });
    }
    
    return newCitation.id;
  }, [citations.length]);
  
  
  const generateRefs = useCallback(() => {
    return generateReferencesSection(citations);
  }, [citations]);
  
  // Editor commands hook
  const { executeCommand } = useEditorCommands(
    lexicalEditorRef,
    editorMode,
    citations,
    generateRefs,
    setLinkDialog,
    setCitationDialog,
    setImageDialog,
    setVideoDialog,
    setIsTableDialog,
  );
  
  // Code editor change
  const handleEditorContentChangeCode = useCallback((value ? : string) => {
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
    lexicalEditorRef.current?.dispatchCommand(UNDO_COMMAND, undefined);
  }, []);
  
  const handleRedo = useCallback(() => {
    lexicalEditorRef.current?.dispatchCommand(REDO_COMMAND, undefined);
  }, []);
  
  const findAndReplace = useCallback((searchTerm: string, replaceTerm: string, replaceAll: boolean = false) => {
    if (!lexicalEditorRef.current) return;
    console.log('Replace functionality - simplified version');
  }, []);
  const [floatingAnchorElem, setFloatingAnchorElem] =
  useState < HTMLDivElement | null > (null);
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
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
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
      />
      
      <EditorStatusBar
        wordCount={wordCount}
        characterCount={characterCount}
        readingTime={readingTime}
        autoSaveStatus={autoSaveStatus}
      />
      {toolbar !== null ? (
      
      <EditorToolbar
        editorMode={editorMode}
        onAction={executeCommand}
        onPublish={handlePublish}
      />
      ):toolbar}

      <div className="flex-1 overflow-auto bg-white relative">
        {showPreview ? (
          <div className="p-8 w-full min-h-full prose max-w-none" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm font-medium text-yellow-800">Preview Mode - Read Only</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: payload.content }} />
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
          />
        ) : (
          <div className="p-8 w-full min-h-full" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <LexicalComposer initialConfig={initialConfig}>
              <div className="relative" ref= {onRef}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable 
                      className="outline-none prose max-w-none min-h-[500px]"
                      style={{ minHeight: '500px' }}
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
                <ImagesPlugin />
                <ListPlugin />
               
               <TablePlugin/>
              
                   <TableActionMenuPlugin anchorElem={setToolbar}
               cellMerge={true}/>
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

      {/* Dialogs */}
      <LinkDialog 
        state={linkDialog} 
        setState={setLinkDialog} 
        editorRef={lexicalEditorRef} 
      />
      <CitationDialog 
        state={citationDialog} 
        setState={setCitationDialog} 
        onAddCitation={addCitation} 
      />
      <ImageDialog 
        state={imageDialog} 
        setState={setImageDialog} 
        editorRef={lexicalEditorRef} 
      />
      <VideoDialog 
        state={videoDialog} 
        setState={setVideoDialog} 
        editorRef={lexicalEditorRef} 
      />
      <TableDialog 
        isOpen={isTableDialog} 
        setIsOpen={setIsTableDialog} 
        editorRef={lexicalEditorRef} 
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