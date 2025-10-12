'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Toolbar } from './Toolbar';
import { DialogManager } from './Dialogs';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useCursorPosition } from '../hooks/useCursorPosition';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import {
  parseMarkup,
  htmlToWikitext,
  DEFAULT_STYLES,
  applyEditorCommand
} from '@/lib/utils/dist/markup';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type EditorMode, type DialogState } from './types';
import { Loader2, Save } from 'lucide-react';

export function MediaWikiEditor() {
  const [mode, setMode] = useState < EditorMode > ('visual');
  const [content, setContent] = useState('<p>Start editing…</p>');
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState < DialogState > ({ open: false, type: null });
  const editorRef = useRef < HTMLDivElement | null > (null);
  const textareaRef = useRef < HTMLTextAreaElement | null > (null);
  const isUpdatingRef = useRef(false);
  
  // History (undo/redo)
  const { addToHistory, undo, redo, canUndo, canRedo } = useEditorHistory(content, setContent);
  
  // Cursor management
  const { saveCursor, restoreCursor } = useCursorPosition(editorRef);
  
  // Debounced sync between visual/html <-> wikitext
  useDebouncedEffect(
    () => {
      if (mode === 'visual' && !isUpdatingRef.current) {
        const newMarkup = htmlToWikitext(content);
        addToHistory(newMarkup);
      }
    },
    500,
    [content, mode]
  );
  
  const handleModeChange = useCallback((newMode: EditorMode) => {
    if (newMode === mode) return;
    
    isUpdatingRef.current = true;
    const savedRange = saveCursor();
    
    setMode(newMode);
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      if (newMode === 'visual') {
        const html = parseMarkup(content);
        setContent(html);
      } else {
        const wikitext = htmlToWikitext(content);
        setContent(wikitext);
      }
      
      // Restore cursor after content update
      requestAnimationFrame(() => {
        restoreCursor(savedRange);
        isUpdatingRef.current = false;
      });
    });
  }, [mode, content, saveCursor, restoreCursor]);
  
  const handleInput = useCallback((html: string) => {
    if (isUpdatingRef.current) return;
    setContent(html);
    addToHistory(html);
  }, [addToHistory]);
  
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      console.log('Saved:', content);
      alert('Document saved!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [content]);
  
  const handleKeyboard = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          if (mode === 'visual') {
            e.preventDefault();
            applyEditorCommand('bold', editorRef);
          }
          break;
        case 'i':
          if (mode === 'visual') {
            e.preventDefault();
            applyEditorCommand('italic', editorRef);
          }
          break;
        case 'u':
          if (mode === 'visual') {
            e.preventDefault();
            applyEditorCommand('underline', editorRef);
          }
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
      }
    }
  }, [mode, handleSave, undo, redo]);
  
  const handleDialogInsert = useCallback((cmd: string, data ? : any) => {
    if (mode === 'visual') {
      applyEditorCommand(cmd, editorRef, data);
    }
  }, [mode]);
  
  return (
    <Card className="border shadow-md w-full max-w-4xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Toolbar
            mode={mode}
            onCommand={(cmd, data) => applyEditorCommand(cmd, editorRef, data)}
            onDialogOpen={setDialog}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={mode === 'visual' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleModeChange('visual')}
          >
            Visual
          </Button>
          <Button 
            variant={mode === 'source' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleModeChange('source')}
          >
            Source
          </Button>
          <Button 
            onClick={handleSave} 
            size="sm" 
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <CardContent 
        style={DEFAULT_STYLES} 
        onKeyDown={handleKeyboard}
        className="p-0"
      >
        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={e => handleInput((e.target as HTMLElement).innerHTML)}
            onBlur={() => {
              // Save cursor position on blur
              saveCursor();
            }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full min-h-[300px] p-4 font-mono text-sm resize-none focus:outline-none border-0"
            value={content}
            onChange={e => handleInput(e.target.value)}
            spellCheck={false}
          />
        )}
      </CardContent>

      <DialogManager 
        dialog={dialog} 
        setDialog={setDialog} 
        onInsert={handleDialogInsert} 
      />
    </Card>
  );
}