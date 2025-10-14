'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome';
import toolbarBlocks from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode ? : 'visual' | 'markdown';
  record_name ? : string;
  onPublish ? : () => void;
}

export default function Editor({
  editor_mode = 'visual',
  record_name = '',
  onPublish
}: EditorProps) {
  const [editorMode, setEditorMode] = useState < 'visual' | 'markdown' > (editor_mode);
  const [activeAction, setActiveAction] = useState < string | null > (null);
  const editorRef = useRef < HTMLDivElement > (null);
  
  // Validate record_name on mount
  useEffect(() => {
    if (!record_name?.trim()) {
      console.warn('Record name is empty or undefined');
    }
  }, [record_name]);
  
  // Update editor mode when prop changes
  useEffect(() => {
    if (editor_mode !== editorMode) {
      setEditorMode(editor_mode);
    }
  }, [editor_mode, editorMode]);
  
  // Execute command when activeAction changes
  useEffect(() => {
    if (activeAction) {
      executeCommand(activeAction);
    }
  }, [activeAction]);
  
  const executeCommand = useCallback((action: string) => {
    if (!editorRef.current) return;
    
    try {
      switch (action) {
        case 'bold':
          document.execCommand('bold', false);
          break;
        case 'italic':
          document.execCommand('italic', false);
          break;
        case 'underline':
          document.execCommand('underline', false);
          break;
        case 'strikethrough':
          document.execCommand('strikeThrough', false);
          break;
          // Add more commands as needed
        default:
          console.log(`Executing command: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    } finally {
      setActiveAction(null);
    }
  }, []);
  
  const handlePublish = useCallback(() => {
    if (onPublish) {
      onPublish();
    } else {
      console.log('Publishing...');
    }
  }, [onPublish]);
  
  const handleToolbarAction = useCallback((action: string) => {
    if (action && action !== activeAction) {
      setActiveAction(action);
    }
  }, [activeAction]);
  
  const renderToolbarButton = useCallback((block: any, index: number) => {
    return (
      <button
        key={`toolbar-btn-${index}`}
        className={`px-3 py-2 border-0 border-l hover:bg-gray-100 transition-colors ${
          block.action === activeAction ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
        }`}
        onClick={() => handleToolbarAction(block.action)}
        title={block.label}
        aria-label={block.label}
      >
        <Fai icon={block.icon} style="fas" />
      </button>
    );
  }, [activeAction, handleToolbarAction]);
  
  const renderToolbarSelect = useCallback((block: any, index: number) => {
    return (
      <Select key={`toolbar-select-${index}`}>
        <SelectTrigger className="w-[180px] h-10">
          <SelectValue placeholder={block.name || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {block.items.map((item: any, itemIndex: number) => (
            <SelectItem
              key={`item-${index}-${itemIndex}`}
              value={item.action || item.label}
              onSelect={() => handleToolbarAction(item.action)}
            >
              <div className="flex items-center gap-2">
                <Fai icon={item.icon} style="fas" />
                <span>{item.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }, [handleToolbarAction]);
  
  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h1 className="text-xl font-bold text-gray-900">
          {record_name?.trim() || 'Untitled Document'}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-gray-50">
        <div className="flex items-center">
          {toolbarBlocks[0].map((block, index) => {
            if (block.items && Array.isArray(block.items)) {
              return renderToolbarSelect(block, index);
            }
            return renderToolbarButton(block, index);
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center border-l">
          
          <button
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors m-2 rounded"
            onClick={handlePublish}
            aria-label="Publish document"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        className="flex-1 p-4 overflow-auto w-full bg-white h-full"
        contentEditable
        suppressContentEditableWarning
        aria-label="Editor content area"
      >
        {/* Editor content goes here */}
      </div>
    </div>
  );
}