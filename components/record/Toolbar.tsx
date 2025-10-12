import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Strikethrough, Undo2, Redo2, Link, Image, Video, Table } from 'lucide-react';
import { type EditorMode, type DialogState } from './types';

interface ToolbarProps {
  mode: EditorMode;
  onCommand: (cmd: string, data ? : any) => void;
  onDialogOpen: (dialog: DialogState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo ? : boolean;
  canRedo ? : boolean;
}

export const Toolbar: React.FC < ToolbarProps > = ({
  mode,
  onCommand,
  onDialogOpen,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true
}) => {
  const actions = [
    { icon: Bold, cmd: 'bold', label: 'Bold' },
    { icon: Italic, cmd: 'italic', label: 'Italic' },
    { icon: Underline, cmd: 'underline', label: 'Underline' },
    { icon: Strikethrough, cmd: 'strike', label: 'Strike' },
  ];
  
  return (
    <div className="flex items-center gap-1">
      {actions.map(a => (
        <Button key={a.cmd} size="icon" variant="ghost" onClick={() => onCommand(a.cmd)} title={a.label}>
          <a.icon className="h-4 w-4" />
        </Button>
      ))}
      <Button size="icon" variant="ghost" onClick={onUndo} title="Undo" disabled={!canUndo}>
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onRedo} title="Redo" disabled={!canRedo}>
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button size="icon" variant="ghost" onClick={() => onDialogOpen({ open: true, type: 'link' })}>
        <Link className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onDialogOpen({ open: true, type: 'image' })}>
        <Image className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onDialogOpen({ open: true, type: 'video' })}>
        <Video className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onDialogOpen({ open: true, type: 'table' })}>
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
};