import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type DialogState } from './types';

interface DialogManagerProps {
  dialog: DialogState;
  setDialog: (state: DialogState) => void;
  onInsert: (cmd: string, data ? : any) => void;
}

export const DialogManager: React.FC < DialogManagerProps > = ({ dialog, setDialog, onInsert }) => {
  const [input, setInput] = React.useState('');
  
  const handleInsert = () => {
    if (!dialog.type) return;
    onInsert(dialog.type, input);
    setDialog({ open: false, type: null });
    setInput('');
  };
  
  return (
    <Dialog open={dialog.open} onOpenChange={o => setDialog({ open: o, type: dialog.type })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dialog.type === 'link' && 'Insert Link'}
            {dialog.type === 'image' && 'Insert Image'}
            {dialog.type === 'video' && 'Insert Video'}
            {dialog.type === 'table' && 'Insert Table'}
          </DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Enter value..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInsert()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog({ open: false, type: null })}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};