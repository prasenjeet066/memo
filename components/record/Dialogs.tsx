import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type DialogState } from './types';

interface DialogManagerProps {
  dialog: DialogState;
  setDialog: (state: DialogState) => void;
  onInsert: (cmd: string, data?: any) => void;
}

export const DialogManager: React.FC<DialogManagerProps> = ({ dialog, setDialog, onInsert }) => {
  const [input, setInput] = useState('');
  
  // Reset input when dialog opens
  useEffect(() => {
    if (!dialog.open) {
      setInput('');
    }
  }, [dialog.open]);
  
  const handleInsert = () => {
    if (!dialog.type || !input.trim()) return;
    
    onInsert(dialog.type, input.trim());
    setDialog({ open: false, type: null });
  };
  
  const handleClose = () => {
    setDialog({ open: false, type: null });
  };
  
  const getDialogTitle = () => {
    switch (dialog.type) {
      case 'link': return 'Insert Link';
      case 'image': return 'Insert Image';
      case 'video': return 'Insert Video';
      case 'table': return 'Insert Table';
      default: return 'Insert';
    }
  };
  
  const getPlaceholder = () => {
    switch (dialog.type) {
      case 'link': return 'Enter URL...';
      case 'image': return 'Enter image URL...';
      case 'video': return 'Enter video URL...';
      case 'table': return 'Enter dimensions (e.g., 3x3)...';
      default: return 'Enter value...';
    }
  };
  
  return (
    <Dialog open={dialog.open} onOpenChange={open => setDialog({ open, type: dialog.type })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <Input
          placeholder={getPlaceholder()}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleInsert();
            } else if (e.key === 'Escape') {
              handleClose();
            }
          }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!input.trim()}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};