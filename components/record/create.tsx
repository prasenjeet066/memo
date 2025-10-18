'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome';
import InfoBox from '@/lib/editor/templates/infobox';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode?: 'visual' | 'code';
  record_name?: string;
  onPublish?: () => void;
  sideBarTools?: () => void;
  ExpandedIs?: boolean;
  IsExpandedSet?: (value: boolean) => void;
}

interface TableEditorOption {
  value: string;
  text: string;
}

interface TableEditorField {
  type: string;
  label: string;
  name: string;
  options?: TableEditorOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface TableEditorConfig {
  icon: string;
  action: string;
  label: string;
  editor: TableEditorField[];
}

interface AiTaskState {
  content: string;
}

interface ToolbarBlock {
  icon: string;
  action: string;
  label: string;
  items?: ToolbarBlock[];
  editor?: TableEditorField[];
}

export default function CreateNew({
  editor_mode = 'visual',
  record_name = 'Sakib Al Hasan',
  onPublish,
  IsExpandedSet,
}: EditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(editor_mode);
  const [payload, setPayload] = useState({ title: '', content: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [promptAiTask, setPromptAiTask] = useState<AiTaskState>({ content: '' });
  
  const { data: session } = useSession();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const [, startTransition] = useTransition();

  // Monaco editor configuration
  const handleEditorDidMount = useCallback((editor: any) => {
    monacoEditorRef.current = editor;
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: 'on',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
    });
  }, []);

  // AI Article Generation - FIXED: API থেকে 'progress' type আসে, 'content' না
  const generateAIArticle = useCallback(async (topic: string) => {
    if (!topic?.trim()) {
      alert('Please provide a topic.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setPromptAiTask({ content: '' }); // Reset previous content

    try {
      const response = await fetch('/api/encyclopedia/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          style: 'academic',
          includeReferences: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to AI stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part.startsWith('data:')) {
            try {
              const data = JSON.parse(part.replace(/^data:\s*/, ''));
              
              // FIXED: API 'progress' type পাঠায়, 'content' না
              if (data.type === 'progress' && data.content) {
                startTransition(() => {
                  setPromptAiTask((prev) => ({
                    content: prev.content + data.content,
                  }));
                });
              } else if (data.type === 'error') {
                setGenerationError(data.error);
              } else if (data.type === 'done') {
                console.log('AI generation completed');
              }
            } catch (err) {
              console.error('Invalid JSON in stream:', part);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI generation failed:', error);
      setGenerationError(error.message || 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Template building
  const buildTemplate = useCallback((): string => {
    if (!Array.isArray(InfoBox) || InfoBox.length === 0) {
      return `<div class='tpl-infobox'></div>`;
    }
    return InfoBox.map(() => `<div class='tpl-infobox'></div>`).join('');
  }, []);

  // Insert template into editor
  const insertTemplate = useCallback((ref: React.RefObject<HTMLDivElement>): boolean => {
    if (!ref.current) return false;

    try {
      ref.current.focus();
      const template = `<br/>${buildTemplate()}<br/>`.trim();
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const templateNode = document.createRange().createContextualFragment(template);
        range.insertNode(templateNode);
        range.setStartAfter(templateNode.lastChild || templateNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return true;
    } catch (error) {
      console.error('Failed to insert template:', error);
      return false;
    }
  }, [buildTemplate]);

  // Table operations
  const addTableRow = useCallback((tableContainer: HTMLElement) => {
    const table = tableContainer.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    const cols = rows[0]?.querySelectorAll('td, th').length || 1;
    const newRow = document.createElement('tr');
    
    for (let i = 0; i < cols; i++) {
      const newCell = document.createElement('td');
      newCell.contentEditable = 'true';
      newCell.textContent = `Row ${rows.length + 1}, Col ${i + 1}`;
      newRow.appendChild(newCell);
    }
    
    table.querySelector('tbody')?.appendChild(newRow);
  }, []);

  const addTableColumn = useCallback((tableContainer: HTMLElement) => {
    const table = tableContainer.querySelector('table');
    if (!table) return;
    
    table.querySelectorAll('tr').forEach((row, index) => {
      const newCell = document.createElement('td');
      newCell.contentEditable = 'true';
      newCell.textContent = `Row ${index + 1}, Col ${row.children.length + 1}`;
      row.appendChild(newCell);
    });
  }, []);

  const attachTableEventListeners = useCallback((tableId: string) => {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableContainer) return;

    const addRowBtn = tableContainer.querySelector('.add-row-btn');
    const addColBtn = tableContainer.querySelector('.add-col-btn');

    addRowBtn?.addEventListener('click', () => addTableRow(tableContainer as HTMLElement));
    addColBtn?.addEventListener('click', () => addTableColumn(tableContainer as HTMLElement));
  }, [addTableRow, addTableColumn]);

  // AI Task execution
  const setupAiTaskListeners = useCallback((className: string) => {
    const aiprompt = document.querySelector(`.${className}`);
    if (!aiprompt) return;

    const input = aiprompt.querySelector('input') as HTMLInputElement;
    const btn = aiprompt.querySelector('button') as HTMLButtonElement;

    if (input && btn) {
      btn.onclick = async (e) => {
        e.preventDefault();
        const value = input.value.trim();
        
        if (!value) {
          alert('Enter a prompt');
          return;
        }
        
        await generateAIArticle(value);
        
        // FIXED: AI content insert করার আগে check করুন content আছে কিনা
        if (promptAiTask.content) {
          const container = document.createElement('div');
          container.id = 'ai_generated';
          container.innerHTML = promptAiTask.content;
          aiprompt.parentElement?.insertBefore(container, aiprompt.nextSibling);
        }
      };
    }
  }, [generateAIArticle, promptAiTask.content]);

  // Execute editor commands
  const executeCommand = useCallback((action: string) => {
    if (editorMode !== 'visual' || !editorRef.current) return;

    try {
      switch (action) {
        case 'aiTask': {
          const aiPrompt = document.createElement('div');
          aiPrompt.className = 'ai-task-div';
          aiPrompt.contentEditable = 'false';
          aiPrompt.innerHTML = `<input type="text" class="prompt-input" placeholder="Write anything..." /><button class="fas fa-arrow-right"></button>`;
          editorRef.current.appendChild(aiPrompt);
          
          setTimeout(() => setupAiTaskListeners('ai-task-div'), 300);
          break;
        }
        
        case 'bold':
          document.execCommand('bold');
          break;
          
        case 'heading':
          document.execCommand('insertHTML', false, '<br/><h1 class="heading-lind">Title...</h1><hr/><br/>');
          break;
          
        case 'italic':
          document.execCommand('italic');
          break;
          
        case 'table': {
          alert('tble')
          const tableId = `table-${Date.now()}`;
          const makeHeader = (j: number) => `<th contenteditable>Header ${j + 1}</th>`;
          const makeCell = (i: number, j: number) => `<td contenteditable>Row ${i + 1}, Col ${j + 1}</td>`;
          const makeRow = (i: number, isHeader = false) =>
            `<tr>${Array.from({ length: 4 }, (_, j) => isHeader ? makeHeader(j) : makeCell(i, j)).join('')}</tr>`;

          const tableHTML = `
            <div class="tbl-operator" data-table-id="${tableId}">
              <table border="1" style="border-collapse:collapse;width:100%">
                <thead>${makeRow(0, true)}</thead>
                <tbody>${Array.from({ length: 3 }, (_, i) => makeRow(i)).join('')}</tbody>
              </table>
              <div class="table-controls" contenteditable="false">
                <button class="add-row-btn fas fa-arrow-down-from-dotted-line" data-table="${tableId}"></button>
                <hr/>
                <button class="add-col-btn fas fa-arrow-left-from-line" data-table="${tableId}"></button>
              </div>
            </div><br>
          `;
          document.execCommand('insertHTML', false, tableHTML);
          setTimeout(() => attachTableEventListeners(tableId), 100);
          break;
        }
        
        case 'underline':
          document.execCommand('underline');
          break;
          
        case 'strikethrough':
          document.execCommand('strikeThrough');
          break;
          
        case 'template':
          insertTemplate(editorRef);
          break;
          
        default:
          console.log(`Executing command: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    } finally {
      setActiveAction(null);
    }
  }, [editorMode, attachTableEventListeners, insertTemplate, setupAiTaskListeners]);

  // Event handlers
  const handlePublish = useCallback(() => {
    if (onPublish) {
      onPublish();
    } else {
      console.log('Publishing...', payload);
    }
  }, [onPublish, payload]);

  // FIXED: Select item থেকে action trigger করার জন্য onValueChange ব্যবহার করুন
  const handleToolbarAction = useCallback((action: string) => {
    if (action) {
      setActiveAction(action);
    }
  }, []);
  
  const handleEditorContentChangeCode = useCallback((value?: string) => {
    setPayload((prev) => ({ ...prev, content: value || '' }));
  }, []);

  // FIXED: Mode switch করার সময় content properly sync করুন
  const handleSwMode = useCallback((mode: string) => {
    const newMode = mode as 'visual' | 'code';
    
    if (newMode === 'visual') {
      // Code mode থেকে Visual mode এ যাওয়ার সময়
      if (editorRef.current) {
        editorRef.current.innerHTML = payload.content || '';
      }
    } else if (newMode === 'code') {
      // Visual mode থেকে Code mode এ যাওয়ার সময়
      if (editorRef.current) {
        const currentContent = editorRef.current.innerHTML;
        setPayload((prev) => ({ ...prev, content: currentContent }));
      }
    }
    
    setEditorMode(newMode);
  }, [payload.content]);

  const handleEditorContentChange = useCallback(() => {
    if (editorRef.current) {
      setPayload((prev) => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  }, []);

  // Effects
  useEffect(() => {
    if (!record_name?.trim()) {
      console.warn('Record name is empty or undefined');
    }
  }, [record_name]);

  useEffect(() => {
    if (generationError) {
      setPayload((prev) => ({
        ...prev,
        content: `${prev.content}\n<!-- Error: ${generationError} -->`,
      }));
    }
  }, [generationError]);

  useEffect(() => {
    if (activeAction) {
      executeCommand(activeAction);
    }
  }, [activeAction, executeCommand]);

  const hasRegisteredRole = Array.isArray(session?.user?.role) && session.user.role.includes('REG');

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {record_name?.trim() || 'Untitled Document'}
        </h1>

        {hasRegisteredRole && (
          <Select value={editorMode} onValueChange={handleSwMode}>
            <SelectTrigger className="max-w-[140px] w-auto h-10 border-none bg-white rounded-full">
              <SelectValue placeholder={editorMode} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visual">Visual</SelectItem>
              <SelectItem value="code">Code</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2">
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {toolbarBlocks.map((block: ToolbarBlock, index: number) => {
              if (block.items && Array.isArray(block.items)) {
                return (
                  <Select 
                    key={`toolbar-select-${index}`}
                    onValueChange={handleToolbarAction}
                  >
                    <SelectTrigger className="max-w-[180px] w-auto h-10 border-none">
                      <SelectValue placeholder={<Fai icon={block.icon} />} />
                    </SelectTrigger>
                    <SelectContent>
                      {block.items.map((item: ToolbarBlock, itemIndex: number) => (
                        <SelectItem
                          key={`item-${index}-${itemIndex}`}
                          value={item.action || item.label}
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
              }
              return (
                <button
                  key={`toolbar-btn-${index}`}
                  className={`px-4 border-0 border-l hover:bg-gray-100 transition-colors ${
                    block.action === activeAction
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700'
                  }`}
                  onClick={() => handleToolbarAction(block.action)}
                  title={block.label}
                  aria-label={block.label}
                  type="button"
                >
                  <Fai icon={block.icon} style="fas" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2" />
        )}

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

      {/* Editor */}
      {editorMode === 'code' ? (
        <Editor
          height="400px"
          defaultLanguage="html"
          value={payload.content || '<!-- Write your code... -->'}
          onMount={handleEditorDidMount}
          className="flex-1 p-4 overflow-auto w-full bg-white min-h-[300px] border-none outline-none"
          onChange={handleEditorContentChangeCode}
          theme="vs-light"
          options={{
            selectOnLineNumbers: true,
            roundedSelection: false,
            cursorStyle: 'line',
            automaticLayout: true,
          }}
        />
      ) : (
        <div
          ref={editorRef}
          className="flex-1 p-4 overflow-auto w-full bg-white min-h-[300px] border-none outline-none"
          contentEditable
          suppressContentEditableWarning
          aria-label="Editor content area"
          onInput={handleEditorContentChange}
        >{payload.content}</div>
      )}

      {/* AI Generation Status */}
      {isGenerating && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-full">
          Generating AI content...
        </div>
      )}
    </div>
  );
}