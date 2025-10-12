import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bold, Italic, Underline, Strikethrough, Undo2, Redo2, Link, Image, Video, Table } from 'lucide-react';
import { type EditorMode, type DialogState } from './types';

interface ToolbarProps {
  mode: EditorMode;
  onCommand: (cmd: string, data?: any) => void;
  onDialogOpen: (dialog: DialogState) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  mode, 
  onCommand, 
  onDialogOpen, 
  onUndo, 
  onRedo,
  canUndo = true,
  canRedo = true
}) => {
  const formatActions = [
    { icon: Bold, cmd: 'bold', label: 'Bold (Ctrl+B)' },
    { icon: Italic, cmd: 'italic', label: 'Italic (Ctrl+I)' },
    { icon: Underline, cmd: 'underline', label: 'Underline (Ctrl+U)' },
    { icon: Strikethrough, cmd: 'strike', label: 'Strikethrough' },
  ];
  
  const insertActions = [
    { icon: Link, type: 'link' as const, label: 'Insert Link' },
    { icon: Image, type: 'image' as const, label: 'Insert Image' },
    { icon: Video, type: 'video' as const, label: 'Insert Video' },
    { icon: Table, type: 'table' as const, label: 'Insert Table' },
  ];
  
  // Only show formatting tools in visual mode
  const showFormatting = mode === 'visual';
  
  return (
    <div className="flex items-center gap-1">
      {showFormatting && (
        <>
          {formatActions.map(a => (
            <Button 
              key={a.cmd} 
              size="icon" 
              variant="ghost" 
              onClick={() => onCommand(a.cmd)} 
              title={a.label}
              className="h-8 w-8"
            >
              <a.icon className="h-4 w-4" />
            </Button>
          ))}
          <Separator orientation="vertical" className="h-6 mx-1" />
        </>
      )}
      
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={onUndo} 
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        className="h-8 w-8"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={onRedo} 
        title="Redo (Ctrl+Y)"
        disabled={!canRedo}
        className="h-8 w-8"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      {showFormatting && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          {insertActions.map(a => (
            <Button 
              key={a.type} 
              size="icon" 
              variant="ghost" 
              onClick={() => onDialogOpen({ open: true, type: a.type })}
              title={a.label}
              className="h-8 w-8"
            >
              <a.icon className="h-4 w-4" />
            </Button>
          ))}
        </>
      )}
    </div>
  );
};