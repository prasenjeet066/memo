'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode ? : 'visual' | 'mdx';
  record_name ? : string;
  onPublish ? : () => void;
}

// Rename export for clarity, but keep compatibility with previous usage
export default function CreateNew({
  editor_mode = 'visual',
  record_name = '',
  onPublish
}: EditorProps) {
  const [editorMode, setEditorMode] = useState < 'visual' | 'mdx' > (editor_mode);
  
  const [payload, setPayload] = useState({
    title: '',
    content: ''
  });
  
  const [activeAction, setActiveAction] = useState < string | null > (null);
  const editorRef = useRef < HTMLDivElement > (null);
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  
  useEffect(() => {
    if (!record_name?.trim()) {
      console.warn('Record name is empty or undefined');
    }
  }, [record_name]);
  
  useEffect(() => {
    if (editor_mode !== editorMode) {
      setEditorMode(editor_mode);
    }
  }, [editor_mode, editorMode]);
  // Function to attach event listeners to table buttons
  function attachTableEventListeners(tableId) {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableContainer) return;
    
    // Add row functionality
    const addRowBtn = tableContainer.querySelector('.add-row-btn');
    addRowBtn?.addEventListener('click', function() {
      addTableRow(tableContainer);
    });
    
    // Add column functionality
    const addColBtn = tableContainer.querySelector('.add-col-btn');
    addColBtn?.addEventListener('click', function() {
      addTableColumn(tableContainer);
    });
  }
  
  // Function to add a new row
  function addTableRow(tableContainer) {
    const table = tableContainer.querySelector('table');
    const rows = table.querySelectorAll('tr');
    const cols = rows[0].querySelectorAll('td').length;
    
    const newRow = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const newCell = document.createElement('td');
      newCell.contentEditable = true;
      newCell.textContent = `Row ${rows.length + 1}, Col ${i + 1}`;
      newRow.appendChild(newCell);
    }
    
    table.appendChild(newRow);
  }
  
  // Function to add a new column
  function addTableColumn(tableContainer) {
    const table = tableContainer.querySelector('table');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
      const newCell = document.createElement('td');
      newCell.contentEditable = true;
      newCell.textContent = `Row ${index + 1}, Col ${row.children.length + 1}`;
      row.appendChild(newCell);
    });
  }
  
  const executeCommand = useCallback((action: string) => {
    if (editorMode === 'visual' && editorRef.current) {
      try {
        switch (action) {
          case 'bold':
            document.execCommand('bold', false);
            break;
          case 'italic':
            document.execCommand('italic', false);
            break;
          case 'table':
            const editor = editorRef.current;
            editor.focus();
            const rows = 3;
            const cols = 4;
            
            // Generate unique ID for this table instance
            const tableId = 'table-' + Date.now();
            
            let tableHTML = `<div class="tbl-operator" data-table-id="${tableId}">`;
            tableHTML += '<table border="1" style="border-collapse: collapse; width: 100%;">';
            
            for (let i = 0; i < rows; i++) {
              tableHTML += '<tr>';
              for (let j = 0; j < cols; j++) {
                tableHTML += `<td contenteditable="true">Row ${i+1}, Col ${j+1}</td>`;
              }
              tableHTML += '</tr>';
            }
            
            tableHTML += '</table>';
            tableHTML += '<div class="table-controls">';
            tableHTML += `<button class="add-row-btn" data-table="${tableId}" contenteditable="false">+ Row</button>`;
            tableHTML += `<button class="add-col-btn" data-table="${tableId}" contenteditable="false">+ Column</button>`;
            tableHTML += '</div></div><br>';
            
            document.execCommand('insertHTML', false, tableHTML);
            
            // Add event listeners after a short delay
            setTimeout(() => {
              attachTableEventListeners(tableId);
            }, 100);
            break;
          case 'underline':
            document.execCommand('underline', false);
            break;
          case 'strikethrough':
            document.execCommand('strikeThrough', false);
            break;
            
          default:
            console.log(`Executing command: ${action}`);
        }
      } catch (error) {
        console.error(`Failed to execute command: ${action}`, error);
      } finally {
        setActiveAction(null);
      }
    }
  }, [editorMode]);
  
  useEffect(() => {
    executeCommand(activeAction)
  }, [activeAction])
  const handlePublish = useCallback(() => {
    if (onPublish) {
      onPublish();
    } else {
      console.log('Publishing...', payload);
    }
  }, [onPublish, payload]);
  
  const handleToolbarAction = useCallback((action: string) => {
    if (action && action !== activeAction) {
      setActiveAction(action);
    }
  }, [activeAction]);
  
  const handleSwMode = useCallback((mode: string) => {
    if (mode === 'visual' || mode === 'mdx') {
      setEditorMode(mode);
    }
  }, []);
  
  const renderToolbarButton = useCallback((block: any, index: number) => {
    return (
      <button
        key={`toolbar-btn-${index}`}
        className={`px-4 border-0 border-l hover:bg-gray-100 transition-colors ${
          block.action === activeAction ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
        }`}
        onClick={() => handleToolbarAction(block.action)}
        title={block.label}
        aria-label={block.label}
        type="button"
      >
        <Fai icon={block.icon} style="fas" />
      </button>
    );
  }, [activeAction, handleToolbarAction]);
  
  const renderToolbarSelect = useCallback((block: any, index: number) => {
    return (
      <Select key={`toolbar-select-${index}`}>
        <SelectTrigger className="max-w-[180px] w-auto h-10 border-none">
          <SelectValue placeholder={block.name || 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {block.items.map((item: any, itemIndex: number) => (
            <SelectItem
              key={`item-${index}-${itemIndex}`}
              value={item.action || item.label}
            >
              <div 
                className="flex items-center gap-2"
                onClick={() => handleToolbarAction(item.action)}
              >
                <Fai icon={item.icon} style="fas" />
                <span>{item.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }, [handleToolbarAction]);
  
  const handleTextareaChange = useCallback((e: React.ChangeEvent < HTMLTextAreaElement > ) => {
    setPayload(prev => ({
      ...prev,
      content: e.target.value
    }));
  }, []);
  
  const handleEditorContentChange = useCallback(() => {
    if (editorRef.current) {
      setPayload(prev => ({
        ...prev,
        content: editorRef.current?.innerHTML || ''
      }));
    }
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">
          {record_name?.trim() || 'Untitled Document'}
        </h1>
        <Select onValueChange={handleSwMode} value={editorMode}>
          <SelectTrigger className="max-w-[140px] w-auto h-10 border-none">
            <SelectValue placeholder={editorMode} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visual">Visual</SelectItem>
            <SelectItem value="mdx">MDX</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2">
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {toolbarBlocks.map((block, index) => {
              if (block.items && Array.isArray(block.items)) {
                return renderToolbarSelect(block, index);
              }
              return renderToolbarButton(block, index);
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2"></div>
        )}

        {/* Actions */}
        <div className="flex items-center border-l">
          <button
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors m-2 rounded-full"
            onClick={handlePublish}
            aria-label="Publish document"
            type="button"
          >
            Publish
          </button>
        </div>
      </div>

      {editorMode === 'mdx' ? (
        <textarea 
          ref={textareaRef}
          className="flex-1 p-4 overflow-auto w-full bg-white min-h-[300px] border-none outline-none"
          value={payload.content}
          onChange={handleTextareaChange}
          placeholder="Start writing your MDX content..."
        />
      ) : (
        <div
          ref={editorRef}
          className="flex-1 p-4 overflow-auto w-full bg-white min-h-[300px] border-none outline-none"
          contentEditable
          suppressContentEditableWarning
          aria-label="Editor content area"
          onInput={handleEditorContentChange}
        />
      )}
    </div>
  );
}