'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { Select } from '@chakra-ui/react';
import IconSelectBox from '@/components/ui/chakra-select-icon'
import { Fai } from '@/components/Fontawesome';
import InfoBox from '@/lib/editor/templates/infobox';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode ? : 'visual' | 'code';
  record_name ? : string;
  onPublish ? : () => void;
  sideBarTools ? : () => void;
  ExpandedIs ? : boolean;
  IsExpandedSet: any;
}

interface TableEditorOption {
  value: string;
  text: string;
}

interface TableEditorField {
  type: string;
  label: string;
  name: string;
  options ? : TableEditorOption[];
  min ? : number;
  max ? : number;
  step ? : number;
}

interface TableEditorConfig {
  icon: string;
  action: string;
  label: string;
  editor: TableEditorField[];
}

export default function CreateNew({
  editor_mode = 'visual',
  record_name = 'Sakib Al Hasan',
  onPublish,
  sideBarTools,
  ExpandedIs,
  IsExpandedSet,
}: EditorProps) {
  const [editorMode, setEditorMode] = useState < 'visual' | 'code' > (editor_mode);
  const [ActiveEditionPoint, setActiveEditionPoint] = useState < any > (null);
  const [payload, setPayload] = useState({ title: '', content: '' });
  const { data: session } = useSession();
  
  const editorRef = useRef < HTMLDivElement | null > (null);
  const monacoEditorRef = useRef < any > (null);
  
  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: 'on',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
    });
  };
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState < string | null > (null);
  const [, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState < string | null > (null);
  const [PromptAiTask, setPromptAiTask] = useState < { content: string | null } > ({ content: null });
  
  const generateAIArticle = useCallback(
    async (topic: string) => {
        if (!topic?.trim()) return alert('Please provide a topic.');
        setIsGenerating(true);
        setGenerationError(null);
        
        try {
          const response = await fetch('/api/encyclopedia/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic,
              depth: 'standard',
              style: 'academic',
              includeReferences: true,
            }),
          });
          
          if (!response.ok || !response.body) {
            setGenerationError('Failed to connect to AI stream.');
            setIsGenerating(false);
            return;
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
                  if (data.type === 'content') {
                    startTransition(() => {
                      setPromptAiTask(prev => ({
                        content: (prev.content || '') + data.content,
                      }));
                    });
                  } else if (data.type === 'error') {
                    setGenerationError(data.error);
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
      },
      [editorMode]
  );
  
  const flattenedBlocks = toolbarBlocks
    .flatMap((block: any) => [block, ...(block.items || []), ...(block.editor || [])]
      .flatMap(item => [item, ...(item.items || []), ...(item.editor || [])]))
    .filter(Boolean);
  
  const findBlockByAction = (actionName: string) =>
    flattenedBlocks.find((block: any) => block.action === actionName);
  
  useEffect(() => {
    if (!record_name?.trim()) console.warn('Record name is empty or undefined');
  }, [record_name]);
  
  useEffect(() => {
    if (generationError) {
      setPayload(prev => ({
        ...prev,
        content: `${prev.content}\n // Error: ${generationError}`,
      }));
    }
  }, [generationError]);
  
  const escapeHtml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    const str = String(unsafe);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  const buildTemplate = (): string => {
    if (!Array.isArray(InfoBox) || InfoBox.length === 0) {
      return `<div class='tpl-infobox'></div>`;
    }
    return InfoBox.map(() => `<div class='tpl-infobox'></div>`).join('');
  };
  
  const insertTemplate = (ref: React.RefObject < HTMLElement > ): boolean => {
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
  };
  
  const attachTableEventListeners = (tableId: string) => {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableContainer) return;
    setActiveEditionPoint({ ref: tableContainer, action: 'table' });
    
    const addRowBtn = tableContainer.querySelector('.add-row-btn');
    const addColBtn = tableContainer.querySelector('.add-col-btn');
    
    addRowBtn?.addEventListener('click', () => addTableRow(tableContainer as HTMLElement));
    addColBtn?.addEventListener('click', () => addTableColumn(tableContainer as HTMLElement));
  };
  
  const addTableRow = (tableContainer: HTMLElement) => {
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
  };
  
  const addTableColumn = (tableContainer: HTMLElement) => {
    const table = tableContainer.querySelector('table');
    if (!table) return;
    table.querySelectorAll('tr').forEach((row, index) => {
      const newCell = document.createElement('td');
      newCell.contentEditable = 'true';
      newCell.textContent = `Row ${index + 1}, Col ${row.children.length + 1}`;
      row.appendChild(newCell);
    });
  };
  
  const executionCall = (attr: string) => {
    const aiprompt = document.querySelector(`.${attr}`);
    if (!aiprompt) return;
    
    const input = aiprompt.querySelector('input') as HTMLInputElement;
    const btn = aiprompt.querySelector('button') as HTMLButtonElement;
    
    if (input && btn) {
      btn.onclick = async (e) => {
        e.preventDefault();
        if (!input.value.trim()) return alert('Enter a prompt');
        await generateAIArticle(input.value);
        if (PromptAiTask.content) {
          const container = document.createElement('div');
          container.id = 'ai_generated';
          container.innerHTML = PromptAiTask.content;
          aiprompt.parentElement?.insertBefore(container, aiprompt.nextSibling);
        }
      };
    }
  };
  
  const executeCommand = useCallback(
    (action: string) => {
      if (editorMode === 'visual' && editorRef.current) {
        try {
          switch (action) {
            case 'aiTask': {
              const aiPrompt = document.createElement('div');
              aiPrompt.className = 'ai-task-div';
              aiPrompt.contentEditable = 'false';
              aiPrompt.innerHTML = `<input type="text" class="prompt-input" placeholder="Write anything..." /><button class="fas fa-arrow-right"></button>`;
              editorRef.current.appendChild(aiPrompt);
              setTimeout(() => executionCall('ai-task-div'), 300);
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
              const tableId = 'table-' + Date.now();
              const makeHeader = (j: number) => `<th contenteditable>Header ${j + 1}</th>`;
              const makeCell = (i: number, j: number) => `<td contenteditable>Row ${i + 1}, Col ${j + 1}</td>`;
              const makeRow = (i: number, isHeader = false) =>
                `<tr>${Array(4).fill(0).map((_, j) => isHeader ? makeHeader(j) : makeCell(i, j)).join('')}</tr>`;
              
              const tableHTML = `
                <div class="tbl-operator" data-table-id="${tableId}">
                  <table border="1" style="border-collapse:collapse;width:100%">
                    <thead>${makeRow(0, true)}</thead>
                    <tbody>${[0,1,2].map(i => makeRow(i)).join('')}</tbody>
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
      }
    },
    [editorMode]
  );
  
  useEffect(() => {
    if (activeAction) executeCommand(activeAction);
  }, [activeAction, executeCommand]);
  
  const handlePublish = useCallback(() => {
    if (onPublish) onPublish();
    else console.log('Publishing...', payload);
  }, [onPublish, payload]);
  
  const handleToolbarAction = useCallback(
    (action: string) => {
      if (action && action !== activeAction) setActiveAction(action);
    },
    [activeAction]
  );
  
  const handleEditorContentChangeCode = useCallback(
    (value ? : string) => {
      setPayload(prev => ({ ...prev, content: value || '' }));
    },
    []
  );
  
  const handleSwMode = useCallback(
    (mode: string) => {
      if (mode === 'visual' && editorRef.current) {
        editorRef.current.innerHTML = payload.content || '';
      }
      setEditorMode(mode as 'visual' | 'code');
    },
    [payload.content]
  );
  
  const handleEditorContentChange = useCallback(() => {
    if (editorRef.current) {
      setPayload(prev => ({ ...prev, content: editorRef.current.innerHTML || '' }));
    }
  }, []);
  
  return (
    
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">
          {record_name?.trim() || 'Untitled Document'}
        </h1>

        {Array.isArray(session?.user?.role) && session?.user?.role.includes('REG') && (
          <Select
            value={editorMode}
            onChange={(e) => handleSwMode(e.target.value)}
            width="140px"
            height="40px"
            borderRadius="full"
            bg="white"
            border="none"
          >
            <option value="visual">Visual</option>
            <option value="code">Code</option>
          </Select>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2">
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {toolbarBlocks.map((block: any, index: number) => {
  if (block.items && Array.isArray(block.items)) {
    return (
      <IconSelectBox
        key={`toolbar-select-${index}`}
        block={block}
        activeAction={activeAction}
        handleToolbarAction={handleToolbarAction}
      />
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
          <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2"></div>
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

      {editorMode === 'code' ? (
        <Editor
          height="400px"
          defaultLanguage="html"
          value={payload.content || '// Write your code...'}
          onMount={handleEditorDidMount}
          className="flex-1 p-4 overflow-auto w-full bg-white min-h-[300px] border-none outline-none"
          onChange={handleEditorContentChangeCode}
          theme="github-light"
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
        />
      )}
    </div>
    
  );
}