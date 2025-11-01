// Editor Header Component

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Fai } from '@/components/Fontawesome';

interface EditorHeaderProps {
  recordName ? : string;
  canUndo: boolean;
  canRedo: boolean;
  editorMode: 'visual' | 'code';
  hasRegisteredRole: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onModeChange: (mode: 'visual' | 'code') => void;
  handlePublish: ()=>void;
}

export function EditorHeader({
  recordName,
  canUndo,
  canRedo,
  editorMode,
  hasRegisteredRole,
  onUndo,
  onRedo,
  onPreview,
  onModeChange,
  handlePublish,
}: EditorHeaderProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">
          {recordName || 'Untitled Document'}
        </h1>
      </div>
    
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Fai icon="undo" style="fal" />
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Fai icon="redo" style="fal" />
        </button>
        
        <button
          onClick={onPreview}
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
              <DropdownMenuItem onClick={() => onModeChange('visual')}>
                Visual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onModeChange('code')}>
                Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <button 
          className="border-none rounded-full p-2 text-black flex items-center hover:bg-gray-100"
          aria-label="Settings"
        >
          <Fai icon="gear" style="fal" />
        </button>

                        <Button
                          onClick={handlePublish}
                          aria-label="Publish document"
                          type="button"
                          title="Publish (Ctrl+S)"
                        >
                          Publish
                        </Button>
                    
      </div>
    </div>
  );
}