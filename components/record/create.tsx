'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toolbar } from './Toolbar';
import { DialogManager } from './Dialogs';
import { useEditorHistory } from './hooks/useEditorHistory';
import { useCursorPosition } from './hooks/useCursorPosition';
import { useDebouncedEffect } from './hooks/useDebouncedEffect';
import { parseMarkup, htmlToWikitext, applyEditorCommand } from '@/lib/utils/dist/markup';
import { DEFAULT_STYLES } from '@/lib/utils/dist/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type EditorMode, type DialogState } from './types';
import { Loader2, Eye } from 'lucide-react';

export function MediaWikiEditor() {
  const [mode, setMode] = useState<EditorMode>('visual');
  const [content, setContent] = useState('<p>Start editing…</p>');
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ open: false, type: null });
  const editorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isUpdatingRef = useRef(false);

  // History (undo/redo)
  const { history, addToHistory, undo, redo } = useEditorHistory(content, setContent);

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
    [content]
  );

  const handleModeChange = (newMode: EditorMode) => {
    if (newMode === mode) return;
    isUpdatingRef.current = true;
    saveCursor();

    setMode(newMode);
    setTimeout(() => {
      if (newMode === 'visual') {
        const html = parseMarkup(content);
        setContent(html);
      } else {
        const wikitext = htmlToWikitext(content);
        setContent(wikitext);
      }
      requestAnimationFrame(() => {
        restoreCursor();
        isUpdatingRef.current = false;
      });
    }, 10);
  };

  const handleInput = (html: string) => {
    if (isUpdatingRef.current) return;
    setContent(html);
    addToHistory(html);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise(res => setTimeout(res, 800));
    console.log('Saved:', content);
    alert('Document saved!');
    setIsSaving(false);
  }, [content]);

  const handleKeyboard = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); applyEditorCommand('bold', editorRef); break;
        case 'i': e.preventDefault(); applyEditorCommand('italic', editorRef); break;
        case 'u': e.preventDefault(); applyEditorCommand('underline', editorRef); break;
        case 's': e.preventDefault(); handleSave(); break;
        case 'z': e.preventDefault(); undo(); break;
        case 'y': e.preventDefault(); redo(); break;
      }
    }
  };

  return (
    <Card className="border shadow-md w-full overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Toolbar
            mode={mode}
            onCommand={(cmd, data) => applyEditorCommand(cmd, editorRef, data)}
            onDialogOpen={setDialog}
            onUndo={undo}
            onRedo={redo}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode === 'visual' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('visual')}>
            Visual
          </Button>
          <Button variant={mode === 'source' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('source')}>
            Source
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <CardContent style={DEFAULT_STYLES} onKeyDown={handleKeyboard}>
        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[300px] p-3 border rounded-lg bg-background focus:outline-none prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={e => handleInput((e.target as HTMLElement).innerHTML)}
          />
        ) : (
          <textarea
            ref={textareaRef}
            className="w-full h-[300px] p-3 border rounded-lg font-mono text-sm resize-none"
            value={content}
            onChange={e => handleInput(e.target.value)}
          />
        )}
      </CardContent>

      <DialogManager dialog={dialog} setDialog={setDialog} onInsert={cmd => applyEditorCommand(cmd, editorRef)} />
    </Card>
  );
}