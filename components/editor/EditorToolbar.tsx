// Editor Toolbar Component

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Fai } from '@/components/Fontawesome';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorToolbarProps {
  editorMode: 'visual' | 'code';
  onAction: (action: string, args ? : any[]) => void;
  onPublish: () => void;
}

export function EditorToolbar({ editorMode, onAction, onPublish }: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1">
      {editorMode === 'visual' ? (
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {toolbarBlocks.map((block: any, index: number) => {
            if (block.items && Array.isArray(block.items)) {
              if (block.name === 'Paragraph') {
                return (
                  <DropdownMenu key={`toolbar-dropdown-${index}`}>
                    <DropdownMenuTrigger className="max-w-[180px] border-l text-semibold border-r w-auto h-10 border-none px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                      {block.name}
                      <Fai icon="chevron-down" style="fas" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {block.items.map((item: any, itemIndex: number) => (
                        <DropdownMenuItem 
                          key={`item-${index}-${itemIndex}`}
                          onClick={() => onAction(item.action || item.label)}
                        >
                          <div className="flex items-center gap-2">
                            <Fai icon={item.icon} style="fas" />
                            <span>{item.label}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <DropdownMenu key={`toolbar-dropdown-${index}`}>
                  <DropdownMenuTrigger className="max-w-[180px] border-l text-semibold border-r w-auto h-10 border-none px-4 py-2 hover:bg-gray-100 outline-none ">
                    <Fai icon={block.icon} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {block.items.map((item: any, itemIndex: number) => (
                      <DropdownMenuItem 
                        key={`item-${index}-${itemIndex}`}
                        onClick={() => onAction(item.action || item.label)}
                      >
                        <div className="flex items-center gap-2">
                          <Fai icon={item.icon} style="fas" />
                          <span>{item.label}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <button
                key={`toolbar-btn-${index}`}
                id={block.action}
                className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700 outline-none "
                onClick={() => onAction(block.action)}
                title={block.label}
                aria-label={block.label}
                type="button"
              >
                <Fai icon={block.icon} style="fas" />
              </button>
            );
          })}
          
          <button
            className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700"
            onClick={() => onAction('citation')}
            title="Add Citation"
            aria-label="Add Citation"
            type="button"
          >
            <Fai icon="quote-right" style="fas" />
          </button>
          
          <button
            className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700"
            onClick={() => onAction('blockquote')}
            title="Blockquote"
            aria-label="Blockquote"
            type="button"
          >
            <Fai icon="quote-left" style="fas" />
          </button>
        </div>
      ) : (
        <div className="flex-1" />
      )}
      
      <div className="flex items-center border-l pl-2">
        <Button
          className="px-4 py-2 bg-gray-600 text-white  transition-colors m-2 rounded-full"
          onClick={onPublish}
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