'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome';
import { InfoBox, InfoBoxItem, InfoBoxField, ComplexValue } from '@/lib/editor/templates/infobox';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode?: 'visual' | 'code';
  record_name?: string;
  onPublish?: () => void;
  sideBarTools?: () => void;
  ExpandedIs?: boolean;
  IsExpandedSet?: (value: boolean) => void;
}

interface HistoryState {
  content: string;
  timestamp: number;
}

export default function EnhancedEditor({
  editor_mode = 'visual',
  record_name = 'Untitled Document',
  onPublish,
  IsExpandedSet,
}: EditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(editor_mode);
  const [payload, setPayload] = useState({ title: '', content: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');
  
  // History for Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const { data: session } = useSession();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const [, startTransition] = useTransition();
  
  // ==================== HISTORY MANAGEMENT ====================
  const saveToHistory = useCallback((content: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ content, timestamp: Date.now() });
      // Keep only last 50 states
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousState = history[newIndex];
      if (editorRef.current && editorMode === 'visual') {
        editorRef.current.innerHTML = previousState.content;
      }
      setPayload(prev => ({ ...prev, content: previousState.content }));
    }
  }, [historyIndex, history, editorMode]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      if (editorRef.current && editorMode === 'visual') {
        editorRef.current.innerHTML = nextState.content;
      }
      setPayload(prev => ({ ...prev, content: nextState.content }));
    }
  }, [historyIndex, history, editorMode]);
  
  // ==================== FIELD VALUE RENDERER ====================
  const renderFieldValue = useCallback((field: InfoBoxField): string => {
    if (typeof field.value === 'string') {
      return field.value;
    }
    if (Array.isArray(field.value)) {
      return field.value.map(v => `<span class="list-item">${v}</span>`).join(', ');
    }
    if (typeof field.value === 'object') {
      const val = field.value as ComplexValue;
      if (val.href) {
        return `<a href="${val.href}" class="infobox-link">${val.text}</a>${val.subtext ? `<br><small>${val.subtext}</small>` : ''}`;
      }
      if (val.image) {
        return `<img src="${val.image.url}" alt="${val.image.alt}" width="${val.image.width || 100}" class="infobox-field-image" />`;
      }
      return val.text;
    }
    return '';
  }, []);
  
  // ==================== INFOBOX TEMPLATE BUILDER ====================
  const buildTemplate = useCallback((): string => {
    if (!Array.isArray(InfoBox) || InfoBox.length === 0) {
      return `<div class='tpl-infobox' contenteditable="true"><p>Empty infobox template</p></div>`;
    }
    
    return InfoBox.map((box: InfoBoxItem) => {
      const sectionsHTML = box.sections.map(section => {
        const fieldsHTML = section.fields.map(field => `
          <tr>
            <th contenteditable="true">${field.label}</th>
            <td contenteditable="true">${renderFieldValue(field)}</td>
          </tr>
        `).join('');
        
        return `
          ${section.header ? `<tr><th colspan="2" class="section-header" contenteditable="true">${section.header}</th></tr>` : ''}
          ${fieldsHTML}
        `;
      }).join('');
      
      return `
        <div class="tpl-infobox" style="width: 300px; float: right; margin: 10px; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
          ${box.image ? `
            <div class="infobox-image" style="text-align: center; margin-bottom: 10px;">
              <img src="${box.image.url}" alt="${box.image.alt}" style="max-width: 100%; height: auto;" />
              ${box.image.caption ? `<p class="caption" style="font-size: 12px; margin-top: 5px;" contenteditable="true">${box.image.caption}</p>` : ''}
            </div>
          ` : ''}
          <table class="infobox-table" style="width: 100%; border-collapse: collapse;">
            <caption style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">
              <strong contenteditable="true">${box.title}</strong>
              ${box.subtitle ? `<br><small contenteditable="true">${box.subtitle}</small>` : ''}
            </caption>
            <tbody>${sectionsHTML}</tbody>
          </table>
        </div>
      `;
    }).join('');
  }, [renderFieldValue]);
  
  // ==================== TABLE OPERATIONS ====================
  const createTable = useCallback((rows: number = 3, cols: number = 4): string => {
    const tableId = `table-${Date.now()}`;
    const makeHeader = (j: number) => `<th contenteditable="true">Header ${j + 1}</th>`;
    const makeCell = (i: number, j: number) => `<td contenteditable="true">Row ${i + 1}, Col ${j + 1}</td>`;
    const makeRow = (i: number, isHeader = false) =>
      `<tr>${Array.from({ length: cols }, (_, j) => isHeader ? makeHeader(j) : makeCell(i, j)).join('')}</tr>`;
    
    return `
      <div class="tbl-operator" data-table-id="${tableId}" style="margin: 20px 0;">
        <table border="1" style="border-collapse:collapse; width:100%; border: 1px solid #ddd;">
          <thead>${makeRow(0, true)}</thead>
          <tbody>${Array.from({ length: rows }, (_, i) => makeRow(i)).join('')}</tbody>
        </table>
        <div class="table-controls" contenteditable="false" style="display: flex; gap: 10px; margin-top: 5px;">
          <button class="add-row-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;">
            <i class="fas fa-plus"></i> Add Row
          </button>
          <button class="add-col-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;">
            <i class="fas fa-plus"></i> Add Column
          </button>
          <button class="del-row-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;">
            <i class="fas fa-minus"></i> Delete Row
          </button>
          <button class="del-col-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;">
            <i class="fas fa-minus"></i> Delete Column
          </button>
        </div>
      </div><br>
    `;
  }, []);
  
  const attachTableEventListeners = useCallback((tableId: string) => {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableContainer) return;
    
    const table = tableContainer.querySelector('table');
    if (!table) return;
    
    const addRowBtn = tableContainer.querySelector('.add-row-btn');
    const addColBtn = tableContainer.querySelector('.add-col-btn');
    const delRowBtn = tableContainer.querySelector('.del-row-btn');
    const delColBtn = tableContainer.querySelector('.del-col-btn');
    
    // Add Row
    addRowBtn?.addEventListener('click', () => {
      const rows = table.querySelectorAll('tr');
      const cols = rows[0]?.querySelectorAll('td, th').length || 1;
      const newRow = document.createElement('tr');
      
      for (let i = 0; i < cols; i++) {
        const newCell = document.createElement('td');
        newCell.contentEditable = 'true';
        newCell.textContent = `New Cell ${i + 1}`;
        newRow.appendChild(newCell);
      }
      
      table.querySelector('tbody')?.appendChild(newRow);
    });
    
    // Add Column
    addColBtn?.addEventListener('click', () => {
      table.querySelectorAll('tr').forEach((row, index) => {
        const isHeader = row.parentElement?.tagName === 'THEAD';
        const newCell = document.createElement(isHeader ? 'th' : 'td');
        newCell.contentEditable = 'true';
        newCell.textContent = isHeader ? 'New Header' : 'New Cell';
        row.appendChild(newCell);
      });
    });
    
    // Delete Row
    delRowBtn?.addEventListener('click', () => {
      const tbody = table.querySelector('tbody');
      if (tbody && tbody.children.length > 1) {
        tbody.removeChild(tbody.lastElementChild!);
      }
    });
    
    // Delete Column
    delColBtn?.addEventListener('click', () => {
      table.querySelectorAll('tr').forEach(row => {
        if (row.children.length > 1) {
          row.removeChild(row.lastElementChild!);
        }
      });
    });
  }, []);
  
  // ==================== AI GENERATION ====================
  const generateAIArticle = useCallback(async (topic: string) => {
    if (!topic?.trim()) {
      alert('Please provide a topic.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setAiGeneratedContent('');
    
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
      let accumulatedContent = '';
      
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
              
              if (data.type === 'progress' && data.content) {
                accumulatedContent += data.content;
                startTransition(() => {
                  setAiGeneratedContent(accumulatedContent);
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
  
  // ==================== COMMAND EXECUTION ====================
  const executeCommand = useCallback((action: string, args?: any[]) => {
    if (editorMode !== 'visual' || !editorRef.current) return;
    
    editorRef.current.focus();
    
    try {
      switch (action) {
        // Text Formatting
        case 'bold':
          document.execCommand('bold');
          break;
          
        case 'italic':
          document.execCommand('italic');
          break;
          
        case 'underline':
          document.execCommand('underline');
          break;
          
        case 'strikethrough':
          document.execCommand('strikeThrough');
          break;
          
        case 'inlineCode':
          document.execCommand('insertHTML', false, '<code contenteditable="true">code</code>');
          break;
        
        // Headings
        case 'heading': {
          const level = args?.[0] || 2;
          document.execCommand('formatBlock', false, `h${level}`);
          break;
        }
        
        // Lists
        case 'unorderedList':
          document.execCommand('insertUnorderedList');
          break;
          
        case 'orderedList':
          document.execCommand('insertOrderedList');
          break;
          
        case 'refList':
          document.execCommand('insertHTML', false, '<ol class="references-list"><li contenteditable="true">Reference 1</li></ol><br>');
          break;
        
        // Links & Media
        case 'link': {
          const url = prompt('Enter URL:');
          if (url) {
            const selection = window.getSelection();
            const text = selection?.toString() || 'Link';
            document.execCommand('insertHTML', false, `<a href="${url}" contenteditable="false">${text}</a>`);
          }
          break;
        }
        
        case 'image': {
          const url = prompt('Enter image URL:');
          if (url) {
            document.execCommand('insertHTML', false, `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" /><br>`);
          }
          break;
        }
        
        case 'video': {
          const url = prompt('Enter video URL (YouTube/Vimeo):');
          if (url) {
            document.execCommand('insertHTML', false, `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe><br>`);
          }
          break;
        }
        
        // Blocks
        case 'codeBlock':
          document.execCommand('insertHTML', false, '<pre contenteditable="true"><code>// Your code here</code></pre><br>');
          break;
          
        case 'math':
          document.execCommand('insertHTML', false, '<div class="math-formula" contenteditable="true">E = mc²</div><br>');
          break;
          
        case 'horizontalRule':
          document.execCommand('insertHorizontalRule');
          break;
          
        case 'reference':
          document.execCommand('insertHTML', false, '<sup class="reference" contenteditable="true">[1]</sup>');
          break;
        
        // AI Task
        case 'aiTask': {
          const aiPrompt = document.createElement('div');
          aiPrompt.className = 'ai-task-div';
          aiPrompt.contentEditable = 'false';
          aiPrompt.style.cssText = 'margin: 20px 0; padding: 15px; border: 2px dashed #4CAF50; background: #f0f8f0; border-radius: 8px;';
          aiPrompt.innerHTML = `
            <input type="text" class="prompt-input" placeholder="Enter AI prompt..." style="width: 80%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;" />
            <button class="ai-generate-btn" style="padding: 10px 20px; margin-left: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              <i class="fas fa-arrow-right"></i> Generate
            </button>
          `;
          editorRef.current.appendChild(aiPrompt);
          
          setTimeout(() => {
            const input = aiPrompt.querySelector('.prompt-input') as HTMLInputElement;
            const btn = aiPrompt.querySelector('.ai-generate-btn') as HTMLButtonElement;
            
            if (input && btn) {
              btn.onclick = async (e) => {
                e.preventDefault();
                const value = input.value.trim();
                
                if (!value) {
                  alert('Enter a prompt');
                  return;
                }
                
                await generateAIArticle(value);
                
                // Wait for content generation
                setTimeout(() => {
                  if (aiGeneratedContent) {
                    const container = document.createElement('div');
                    container.id = 'ai_generated';
                    container.style.cssText = 'margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 4px;';
                    container.innerHTML = aiGeneratedContent;
                    aiPrompt.parentElement?.insertBefore(container, aiPrompt.nextSibling);
                  }
                }, 1000);
              };
            }
          }, 100);
          break;
        }
        
        // Table
        case 'table':
          const tableHTML = createTable(3, 4);
          document.execCommand('insertHTML', false, tableHTML);
          
          setTimeout(() => {
            const tables = document.querySelectorAll('[data-table-id]');
            const lastTable = tables[tables.length - 1];
            if (lastTable) {
              const tableId = lastTable.getAttribute('data-table-id');
              if (tableId) attachTableEventListeners(tableId);
            }
          }, 100);
          break;
        
        // Template
        case 'template':
          const template = buildTemplate();
          document.execCommand('insertHTML', false, template);
          break;
          
        default:
          console.log(`Unknown command: ${action}`);
      }
      
      // Save to history
      if (editorRef.current) {
        saveToHistory(editorRef.current.innerHTML);
      }
      
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    } finally {
      setActiveAction(null);
    }
  }, [editorMode, createTable, attachTableEventListeners, buildTemplate, generateAIArticle, aiGeneratedContent, saveToHistory]);
  
  // ==================== EVENT HANDLERS ====================
  const handleToolbarAction = useCallback((action: string) => {
    if (action) {
      setActiveAction(action);
    }
  }, []);
  
  const handleEditorContentChange = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setPayload(prev => ({ ...prev, content: newContent }));
    }
  }, []);
  
  const handleSwMode = useCallback((mode: string) => {
    const newMode = mode as 'visual' | 'code';
    
    if (newMode === 'visual') {
      if (editorRef.current) {
        editorRef.current.innerHTML = payload.content || '';
      }
    } else if (newMode === 'code') {
      if (editorRef.current) {
        const currentContent = editorRef.current.innerHTML;
        setPayload(prev => ({ ...prev, content: currentContent }));
      }
    }
    
    setEditorMode(newMode);
  }, [payload.content]);
  
  const handleEditorContentChangeCode = useCallback((value?: string) => {
    setPayload(prev => ({ ...prev, content: value || '' }));
  }, []);
  
  const handlePublish = useCallback(() => {
    if (onPublish) {
      onPublish();
    } else {
      console.log('Publishing...', payload);
    }
  }, [onPublish, payload]);
  
  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      
      // Formatting
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      }
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        executeCommand('link');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [executeCommand, handleUndo, handleRedo]);
  
  // ==================== EFFECTS ====================
  useEffect(() => {
    if (activeAction) {
      executeCommand(activeAction);
    }
  }, [activeAction, executeCommand]);
  
  useEffect(() => {
    if (generationError) {
      alert(`AI Error: ${generationError}`);
    }
  }, [generationError]);
  
  const hasRegisteredRole = Array.isArray(session?.user?.role) && session.user.role.includes('REG');
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold text-gray-900">
          {record_name?.trim() || 'Untitled Document'}
        </h1>
        <div className="flex items-center justify-end gap-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Fai icon="undo" style="fal" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Fai icon="redo" style="fal" />
          </button>
          
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
          
          <button className="border-none rounded-full p-2 text-black flex items-center hover:bg-gray-100">
            <Fai icon="gear" style="fal" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1">
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            {toolbarBlocks.map((block: any, index: number) => {
              if (block.items && Array.isArray(block.items)) {
                return (
                  <Select key={`toolbar-select-${index}`} onValueChange={handleToolbarAction}>
                    <SelectTrigger className="max-w-[180px] w-auto h-10 border-none">
                      <SelectValue placeholder={<Fai icon={block.icon} />} />
                    </SelectTrigger>
                    <SelectContent>
                      {block.items.map((item: any, itemIndex: number) => (
                        <SelectItem key={`item-${index}-${itemIndex}`} value={item.action || item.label}>
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
                  className={`px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded ${
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
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2" />
        )}

        <div className="flex items-center border-l pl-2">
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
      <div className="flex-1 overflow-auto bg-white">
        {editorMode === 'code' ? (
          <Editor
            height="100%"
            defaultLanguage="html"
            value={payload.content || '<!-- Write your code... -->'}
            onMount={(editor) => {
              monacoEditorRef.current = editor;
              editor.updateOptions({
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              });
            }}
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
            className="p-8 w-full min-h-full outline-none prose max-w-none"
            contentEditable
            suppressContentEditableWarning
            aria-label="Editor content area"
            onInput={handleEditorContentChange}
            style={{
              minHeight: '500px',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          />
        )}
      </div>

      {/* AI Generation Status */}
      {isGenerating && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Generating AI content...</span>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs hidden group-hover:block">
        <div className="font-semibold mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div><kbd>Ctrl+B</kbd> Bold</div>
          <div><kbd>Ctrl+I</kbd> Italic</div>
          <div><kbd>Ctrl+U</kbd> Underline</div>
          <div><kbd>Ctrl+K</kbd> Insert Link</div>
          <div><kbd>Ctrl+Z</kbd> Undo</div>
          <div><kbd>Ctrl+Y</kbd> Redo</div>
        </div>
      </div>
    </div>
  );
}