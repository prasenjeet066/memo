'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import Editor from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Fai } from '@/components/Fontawesome';
import { InfoBox, InfoBoxItem, InfoBoxField, ComplexValue } from '@/lib/editor/templates/infobox';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';
import DOMPurify from 'dompurify';

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

interface Citation {
  id: string;
  text: string;
  url?: string;
  author?: string;
  date?: string;
  title?: string;
}

interface EditSummary {
  timestamp: number;
  content: string;
  summary: string;
  charChange: number;
}

// Utility: Sanitize HTML
const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'iframe', 'sup', 'sub', 'hr', 'blockquote', 'cite', 'abbr', 'mark'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'style', 'class', 'contenteditable',
      'data-table-id', 'colspan', 'border', 'frameborder', 'allowfullscreen', 'id', 'title',
      'data-cite-id', 'data-footnote-id'
    ],
    ALLOW_DATA_ATTR: true,
  });
};

// Utility: Apply text formatting
const applyTextFormat = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'p') => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;
  
  const tagMap = {
    bold: 'strong',
    italic: 'em',
    underline: 'u',
    strikethrough: 's',
    p: 'p',
  };
  insertHTML(`<${tagMap[format]}>${selectedText}</${tagMap[format]}>`)
};

// Utility: Insert HTML safely
function insertHTML(html: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  range.deleteContents();
  
  const sanitized = sanitizeHTML(html);
  const div = document.createElement("div");
  div.innerHTML = sanitized;
  
  const fragment = document.createDocumentFragment();
  let lastNode: Node | null = null;
  while (div.firstChild) {
    lastNode = fragment.appendChild(div.firstChild);
  }
  
  range.insertNode(fragment);
  
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.setEndAfter(lastNode);
    selection.removeAllRanges();
    selection.addRange(range);
  }
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
  
  // New features
  const [citations, setCitations] = useState<Citation[]>([]);
  const [editHistory, setEditHistory] = useState<EditSummary[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 100; // Increased from 50
  
  const { data: session } = useSession();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);
  const [, startTransition] = useTransition();
  
  const tableListenersRef = useRef<Map<string, Array<{ element: Element; type: string; handler: EventListener }>>>(new Map());
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==================== STATISTICS CALCULATION ====================
  const calculateStats = useCallback((content: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const chars = text.length;
    const readTime = Math.ceil(words.length / 200); // Average reading speed: 200 words/min
    
    setWordCount(words.length);
    setCharacterCount(chars);
    setReadingTime(readTime);
  }, []);
  
  // ==================== HISTORY MANAGEMENT ====================
  const saveToHistory = useCallback((content: string) => {
    setHistory(prev => {
      const trimmedHistory = historyIndex < prev.length - 1 ?
        prev.slice(0, historyIndex + 1) :
        prev;
      
      const newHistory = [...trimmedHistory, { content, timestamp: Date.now() }];
      
      const finalHistory = newHistory.length > maxHistorySize ?
        newHistory.slice(newHistory.length - maxHistorySize) :
        newHistory;
      
      return finalHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      return newIndex >= maxHistorySize ? maxHistorySize - 1 : newIndex;
    });
    
    calculateStats(content);
  }, [historyIndex, maxHistorySize, calculateStats]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousState = history[newIndex];
      
      if (editorRef.current && editorMode === 'visual') {
        editorRef.current.innerHTML = sanitizeHTML(previousState.content);
      }
      setPayload(prev => ({ ...prev, content: previousState.content }));
      calculateStats(previousState.content);
    }
  }, [historyIndex, history, editorMode, calculateStats]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      
      if (editorRef.current && editorMode === 'visual') {
        editorRef.current.innerHTML = sanitizeHTML(nextState.content);
      }
      setPayload(prev => ({ ...prev, content: nextState.content }));
      calculateStats(nextState.content);
    }
  }, [historyIndex, history, editorMode, calculateStats]);
  
  // ==================== CITATION MANAGEMENT ====================
  const addCitation = useCallback((citation: Omit<Citation, 'id'>) => {
    const newCitation: Citation = {
      ...citation,
      id: `cite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setCitations(prev => [...prev, newCitation]);
    
    const citationNumber = citations.length + 1;
    insertHTML(`<sup class="reference" data-cite-id="${newCitation.id}" contenteditable="false">[${citationNumber}]</sup>`);
    
    return newCitation.id;
  }, [citations.length]);
  
  const generateReferencesSection = useCallback(() => {
    if (citations.length === 0) return '';
    
    const refsHTML = citations.map((cite, index) => {
      let refText = `<li id="cite-${cite.id}">`;
      
      if (cite.author) refText += `${sanitizeHTML(cite.author)}. `;
      if (cite.title) refText += `"${sanitizeHTML(cite.title)}". `;
      if (cite.url) refText += `<a href="${encodeURI(cite.url)}" target="_blank">${sanitizeHTML(cite.url)}</a>. `;
      if (cite.date) refText += `Retrieved ${sanitizeHTML(cite.date)}.`;
      
      refText += `</li>`;
      return refText;
    }).join('');
    
    return `
      <h2>References</h2>
      <ol class="references-list" style="font-size: 0.9em; line-height: 1.6;">
        ${refsHTML}
      </ol>
    `;
  }, [citations]);
  
  // ==================== FIELD VALUE RENDERER ====================
  const renderFieldValue = useCallback((field: InfoBoxField): string => {
    if (typeof field.value === 'string') {
      return sanitizeHTML(field.value);
    }
    if (Array.isArray(field.value)) {
      return field.value.map(v => `<span class="list-item">${sanitizeHTML(v)}</span>`).join(', ');
    }
    if (typeof field.value === 'object') {
      const val = field.value as ComplexValue;
      if (val.href) {
        const safeHref = encodeURI(val.href);
        const safeText = sanitizeHTML(val.text);
        const safeSubtext = val.subtext ? sanitizeHTML(val.subtext) : '';
        return `<a href="${safeHref}" class="infobox-link">${safeText}</a>${val.subtext ? `<br><small>${safeSubtext}</small>` : ''}`;
      }
      if (val.image) {
        const safeUrl = encodeURI(val.image.url);
        const safeAlt = sanitizeHTML(val.image.alt);
        return `<img src="${safeUrl}" alt="${safeAlt}" width="${val.image.width || 100}" class="infobox-field-image" />`;
      }
      return sanitizeHTML(val.text);
    }
    return '';
  }, []);
  
  // ==================== INFOBOX TEMPLATE BUILDER ====================
  const buildTemplate = useCallback((): string => {
    if (!Array.isArray(InfoBox) || InfoBox.length === 0) {
      return '<div class="tpl-infobox" contenteditable="true"><p>Empty infobox template</p></div>';
    }
    
    return InfoBox.map((box: InfoBoxItem) => {
      const sectionsHTML = box.sections.map(section => {
        const fieldsHTML = section.fields.map(field => `
          <tr>
            <th contenteditable="true">${sanitizeHTML(field.label)}</th>
            <td contenteditable="true">${renderFieldValue(field)}</td>
          </tr>
        `).join('');
        
        return `
          ${section.header ? `<tr><th colspan="2" class="section-header" contenteditable="true">${sanitizeHTML(section.header)}</th></tr>` : ''}
          ${fieldsHTML}
        `;
      }).join('');
      
      const imageHTML = box.image ? `
        <div class="infobox-image" style="text-align: center; margin-bottom: 10px;">
          <img src="${encodeURI(box.image.url)}" alt="${sanitizeHTML(box.image.alt)}" style="max-width: 100%; height: auto;" />
          ${box.image.caption ? `<p class="caption" style="font-size: 12px; margin-top: 5px;" contenteditable="true">${sanitizeHTML(box.image.caption)}</p>` : ''}
        </div>
      ` : '';
      
      return `
        <div class="tpl-infobox" style="width: 300px; float: right; margin: 10px; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
          ${imageHTML}
          <table class="infobox-table" style="width: 100%; border-collapse: collapse;">
            <caption style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">
              <strong contenteditable="true">${sanitizeHTML(box.title)}</strong>
              ${box.subtitle ? `<br><small contenteditable="true">${sanitizeHTML(box.subtitle)}</small>` : ''}
            </caption>
            <tbody>${sectionsHTML}</tbody>
          </table>
        </div>
      `;
    }).join('');
  }, [renderFieldValue]);
  
  // ==================== TABLE OPERATIONS ====================
  const createTable = useCallback((rows: number = 3, cols: number = 4): string => {
    const safeRows = Math.min(Math.max(1, rows), 100);
    const safeCols = Math.min(Math.max(1, cols), 50);
    
    const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const makeHeader = (j: number) => `<th contenteditable="true">Header ${j + 1}</th>`;
    const makeCell = (i: number, j: number) => `<td contenteditable="true">Row ${i + 1}, Col ${j + 1}</td>`;
    const makeRow = (i: number, isHeader = false) =>
      `<tr>${Array.from({ length: safeCols }, (_, j) => isHeader ? makeHeader(j) : makeCell(i, j)).join('')}</tr>`;
    
    return `
      <div class="tbl-operator" data-table-id="${tableId}" style="margin: 20px 0;">
        <table border="1" style="border-collapse:collapse; width:100%; border: 1px solid #ddd;">
          <thead>${makeRow(0, true)}</thead>
          <tbody>${Array.from({ length: safeRows }, (_, i) => makeRow(i)).join('')}</tbody>
        </table>
        <div class="table-controls" contenteditable="false" style="display: flex; gap: 10px; margin-top: 5px;">
          <button class="add-row-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;" aria-label="Add table row">
            <i class="fas fa-plus"></i> Add Row
          </button>
          <button class="add-col-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;" aria-label="Add table column">
            <i class="fas fa-plus"></i> Add Column
          </button>
          <button class="del-row-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;" aria-label="Delete last table row">
            <i class="fas fa-minus"></i> Delete Row
          </button>
          <button class="del-col-btn" data-table="${tableId}" style="padding: 5px 10px; cursor: pointer;" aria-label="Delete last table column">
            <i class="fas fa-minus"></i> Delete Column
          </button>
        </div>
      </div><br>
    `;
  }, []);
  
  const cleanupTableListeners = useCallback((tableId: string) => {
    const listeners = tableListenersRef.current.get(tableId);
    if (listeners) {
      listeners.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
      });
      tableListenersRef.current.delete(tableId);
    }
  }, []);
  
  const attachTableEventListeners = useCallback((tableId: string) => {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableContainer) return;
    
    const table = tableContainer.querySelector('table');
    if (!table) return;
    
    cleanupTableListeners(tableId);
    
    const addRowBtn = tableContainer.querySelector('.add-row-btn');
    const addColBtn = tableContainer.querySelector('.add-col-btn');
    const delRowBtn = tableContainer.querySelector('.del-row-btn');
    const delColBtn = tableContainer.querySelector('.del-col-btn');
    
    const listeners: Array<{ element: Element; type: string; handler: EventListener }> = [];
    
    const updateContent = () => {
      if (editorRef.current) {
        const newContent = editorRef.current.innerHTML;
        setPayload(prev => ({ ...prev, content: newContent }));
        saveToHistory(newContent);
      }
    };
    
    if (addRowBtn) {
      const handler = () => {
        const rows = table.querySelectorAll('tr');
        const cols = rows[0]?.querySelectorAll('td, th').length || 1;
        
        if (rows.length >= 100) {
          alert('Maximum 100 rows allowed');
          return;
        }
        
        const newRow = document.createElement('tr');
        for (let i = 0; i < cols; i++) {
          const newCell = document.createElement('td');
          newCell.contentEditable = 'true';
          newCell.textContent = `New Cell ${i + 1}`;
          newRow.appendChild(newCell);
        }
        table.querySelector('tbody')?.appendChild(newRow);
        updateContent();
      };
      addRowBtn.addEventListener('click', handler);
      listeners.push({ element: addRowBtn, type: 'click', handler });
    }
    
    if (addColBtn) {
      const handler = () => {
        const firstRow = table.querySelector('tr');
        const currentCols = firstRow?.querySelectorAll('td, th').length || 0;
        
        if (currentCols >= 50) {
          alert('Maximum 50 columns allowed');
          return;
        }
        
        table.querySelectorAll('tr').forEach((row, index) => {
          const isHeader = row.parentElement?.tagName === 'THEAD';
          const newCell = document.createElement(isHeader ? 'th' : 'td');
          newCell.contentEditable = 'true';
          newCell.textContent = isHeader ? 'New Header' : 'New Cell';
          row.appendChild(newCell);
        });
        updateContent();
      };
      addColBtn.addEventListener('click', handler);
      listeners.push({ element: addColBtn, type: 'click', handler });
    }
    
    if (delRowBtn) {
      const handler = () => {
        const tbody = table.querySelector('tbody');
        if (tbody && tbody.children.length > 1) {
          tbody.removeChild(tbody.lastElementChild!);
          updateContent();
        }
      };
      delRowBtn.addEventListener('click', handler);
      listeners.push({ element: delRowBtn, type: 'click', handler });
    }
    
    if (delColBtn) {
      const handler = () => {
        const canDelete = Array.from(table.querySelectorAll('tr')).every(row => row.children.length > 1);
        if (canDelete) {
          table.querySelectorAll('tr').forEach(row => {
            row.removeChild(row.lastElementChild!);
          });
          updateContent();
        }
      };
      delColBtn.addEventListener('click', handler);
      listeners.push({ element: delColBtn, type: 'click', handler });
    }
    
    tableListenersRef.current.set(tableId, listeners);
  }, [cleanupTableListeners, saveToHistory]);
  
  // ==================== AI GENERATION ====================
  const generateAIArticle = useCallback(async (topic: string): Promise<string> => {
    if (!topic?.trim()) {
      throw new Error('Please provide a topic.');
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
                throw new Error(data.error);
              } else if (data.type === 'done') {
                console.log('AI generation completed');
              }
            } catch (err) {
              console.error('Invalid JSON in stream:', part);
            }
          }
        }
      }
      
      return accumulatedContent;
    } catch (error: any) {
      console.error('AI generation failed:', error);
      setGenerationError(error.message || 'Unknown error');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  const disableList = useCallback((list: string[]) => {
    if (Array.isArray(list) && list.length) {
      list.forEach((selector) => {
        if (selector && selector.trim() !== '') {
          const item = document.querySelector(selector) as HTMLButtonElement;
          if (item && !item.disabled) {
            item.disabled = true;
          }
        }
      });
    }
  }, []);
  
  // ==================== FIND AND REPLACE ====================
  const findAndReplace = useCallback((searchTerm: string, replaceTerm: string, replaceAll: boolean = false) => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.innerHTML;
    const regex = new RegExp(searchTerm, replaceAll ? 'gi' : 'i');
    
    if (regex.test(content)) {
      const newContent = replaceAll 
        ? content.replace(regex, replaceTerm)
        : content.replace(regex, replaceTerm);
      
      editorRef.current.innerHTML = sanitizeHTML(newContent);
      saveToHistory(newContent);
      setPayload(prev => ({ ...prev, content: newContent }));
    }
  }, [saveToHistory]);
  
  // ==================== COMMAND EXECUTION ====================
  const executeCommand = useCallback((action: string, args?: any[]) => {
    if (editorMode !== 'visual' || !editorRef.current) return;
    
    editorRef.current.focus();
    
    try {
      switch (action) {
        
        case 'bold':
          document.execCommand('bold', false, null);
          break;
          
        case 'italic':
          document.execCommand('italic', false, null);
          break;
          
        case 'underline':
          document.execCommand('underline', false, null);
          break;
          
        case 'strikethrough':
          document.execCommand('strikeThrough', false, null);
          break;
          
        case 'inlineCode':
          insertHTML('<code contenteditable="true">code</code>');
          break;
          
        case 'heading': {
          const level = Math.min(Math.max(1, args?.[0] || 2), 6);
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString() || 'Heading';
            insertHTML(`<h${level} class = "h1 h${level}-t">${sanitizeHTML(selectedText)}</h${level}><hr/>`);
          }
          break;
        }
        
        case 'unorderedList':
          insertHTML('<ul><li contenteditable="true">List item</li></ul>');
          break;
          
        case 'orderedList':
          insertHTML('<ol><li contenteditable="true">List item</li></ol>');
          break;
          
        case 'refList':
          const refsSection = generateReferencesSection();
          if (refsSection) {
            insertHTML(refsSection);
          } else {
            alert('No citations added yet. Add citations first using the citation tool.');
          }
          break;
          
        case 'link': {
          const url = prompt('Enter URL:');
          if (url) {
            const selection = window.getSelection();
            const text = selection?.toString() || 'Link';
            const safeUrl = encodeURI(url);
            const safeText = sanitizeHTML(text);
            insertHTML(`<a href="${safeUrl}" contenteditable="false">${safeText}</a>`);
          }
          break;
        }
        
        case 'citation': {
          const author = prompt('Enter author name:');
          if (author) {
            const title = prompt('Enter title:');
            const url = prompt('Enter URL (optional):');
            const date = new Date().toLocaleDateString();
            
            addCitation({
              text: author,
              author,
              title: title || '',
              url: url || '',
              date,
            });
          }
          break;
        }
        
        case 'image': {
          const url = prompt('Enter image URL:');
          if (url) {
            const safeUrl = encodeURI(url);
            insertHTML(`<img src="${safeUrl}" alt="Image" style="max-width: 100%; height: auto;" /><br>`);
          }
          break;
        }
        
        case 'video': {
          const url = prompt('Enter video URL (YouTube/Vimeo):');
          if (url) {
            const safeUrl = encodeURI(url);
            insertHTML(`<iframe width="560" height="315" src="${safeUrl}" frameborder="0" allowfullscreen></iframe><br>`);
          }
          break;
        }
        
        case 'codeBlock':
          insertHTML('<pre contenteditable="true"><code>// Your code here</code></pre><br>');
          break;
          
        case 'math':
          insertHTML('<div class="math-formula" contenteditable="true">E = mc²</div><br>');
          break;
          
        case 'horizontalRule':
          insertHTML('<hr />');
          break;
          
        case 'reference':
          insertHTML('<sup class="reference" contenteditable="false">[1]</sup>');
          break;
          
        case 'blockquote':
          const selection = window.getSelection();
          const text = selection?.toString() || 'Quote text';
          insertHTML(`<blockquote contenteditable="true">${sanitizeHTML(text)}</blockquote>`);
          break;
          
        case 'paragraph':
          applyTextFormat('p');
          break;
          
        case 'table': {
          const tableHTML = createTable(3, 4);
          insertHTML(tableHTML);
          
          setTimeout(() => {
            const tables = document.querySelectorAll('[data-table-id]');
            const lastTable = tables[tables.length - 1];
            if (lastTable) {
              const tableId = lastTable.getAttribute('data-table-id');
              if (tableId) attachTableEventListeners(tableId);
            }
          }, 100);
          break;
        }
        
        case 'template': {
          const template = buildTemplate();
          insertHTML(template);
          disableList(['#horizontalRule', '#table', '#video', '#template']);
          break;
        }
        
        default:
          console.log(`Unknown command: ${action}`);
      }
      
      if (editorRef.current) {
        saveToHistory(editorRef.current.innerHTML);
      }
      
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    } finally {
      setActiveAction(null);
    }
  }, [editorMode, createTable, attachTableEventListeners, buildTemplate, generateAIArticle, saveToHistory, disableList, addCitation, generateReferencesSection]);
  
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
      setAutoSaveStatus('unsaved');
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      setAutoSaveStatus('saving');
      autoSaveTimerRef.current = setTimeout(() => {
        saveToHistory(newContent);
        setAutoSaveStatus('saved');
      }, 2000);
    }
  }, [saveToHistory]);
  
  const handleSwMode = useCallback((mode: string) => {
    const newMode = mode as 'visual' | 'code';
    
    if (editorMode === 'visual' && editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      setPayload(prev => ({ ...prev, content: currentContent }));
      saveToHistory(currentContent);
    } else if (editorMode === 'code') {
      saveToHistory(payload.content);
    }
    
    if (newMode === 'visual') {
      if (editorRef.current) {
        editorRef.current.innerHTML = sanitizeHTML(payload.content || '');
      }
    }
    
    setEditorMode(newMode);
  }, [editorMode, payload.content, saveToHistory]);
  
  const handleEditorContentChangeCode = useCallback((value?: string) => {
    setPayload(prev => ({ ...prev, content: value || '' }));
    setAutoSaveStatus('unsaved');
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      if (value) {
        saveToHistory(value);
        calculateStats(value);
      }
      setAutoSaveStatus('saved');
    }, 2000);
  }, [saveToHistory, calculateStats]);
  
  const handlePublish = useCallback(() => {
    const currentContent = editorMode === 'visual' && editorRef.current 
      ? editorRef.current.innerHTML 
      : payload.content;
    
    const summary = prompt('Enter a brief summary of your changes:');
    if (summary) {
      const prevContent = history[historyIndex - 1]?.content || '';
      const charChange = currentContent.length - prevContent.length;
      
      setEditHistory(prev => [...prev, {
        timestamp: Date.now(),
        content: currentContent,
        summary,
        charChange,
      }]);
    }
    
    if (onPublish) {
      onPublish();
    } else {
      console.log('Publishing...', { ...payload, content: currentContent });
    }
    
    setAutoSaveStatus('saved');
  }, [onPublish, payload, editorMode, history, historyIndex]);
  
  const handlePreview = useCallback(() => {
    setShowPreview(!showPreview);
  }, [showPreview]);
  
  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      
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
      
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlePublish();
      }
      
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchTerm = prompt('Find:');
        if (searchTerm && editorRef.current) {
          window.find(searchTerm);
        }
      }
      
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        const searchTerm = prompt('Find:');
        const replaceTerm = prompt('Replace with:');
        if (searchTerm && replaceTerm) {
          const replaceAll = confirm('Replace all occurrences?');
          findAndReplace(searchTerm, replaceTerm, replaceAll);
        }
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        handlePreview();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [executeCommand, handleUndo, handleRedo, handlePublish, findAndReplace, handlePreview]);
  
  // ==================== CLEANUP ON UNMOUNT ====================
  useEffect(() => {
    return () => {
      tableListenersRef.current.forEach((_, tableId) => {
        cleanupTableListeners(tableId);
      });
      
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [cleanupTableListeners]);
  
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
  
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ content: '', timestamp: Date.now() }]);
      setHistoryIndex(0);
    }
  }, [history.length]);
  
  useEffect(() => {
    if (editorRef.current) {
      calculateStats(editorRef.current.innerHTML);
    }
  }, [calculateStats]);
  
  const hasRegisteredRole = Array.isArray(session?.user?.role) && session.user.role.includes('REG');
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">
            {record_name?.trim() || 'Untitled Document'}
          </h1>
         
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Fai icon="undo" style="fal" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Fai icon="redo" style="fal" />
          </button>
          
          <button
            onClick={handlePreview}
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
                <DropdownMenuItem onClick={() => handleSwMode('visual')}>
                  Visual
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSwMode('code')}>
                  Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <button 
            className="border-none rounded-full p-2 text-black flex items-center hover:bg-gray-100"
            aria-label="Settings"
            onClick={() => {
              const enabled = confirm('Enable spell check? (Currently ' + (spellCheckEnabled ? 'enabled' : 'disabled') + ')');
              setSpellCheckEnabled(enabled);
              if (editorRef.current) {
                editorRef.current.spellcheck = enabled;
              }
            }}
          >
            <Fai icon="gear" style="fal" />
          </button>
        </div>
      </div>
       <div className="flex items-center w-full p-2 gap-2 text-xs text-gray-500">
            <span className = 'p-2 border-r'>{wordCount} words</span>
            
            <span className = 'p-2 border-r'>{characterCount} characters</span>
            
            <span className = 'p-2 border-r'>{readingTime} min read</span>
          
            <span className={`font-medium ${
              autoSaveStatus === 'saved' ? 'text-green-600' : 
              autoSaveStatus === 'saving' ? 'text-yellow-600' : 
              'text-gray-400'
            }`}>
              {autoSaveStatus === 'saved' ? 'Saved' : 
               autoSaveStatus === 'saving' ? 'Saving...' : 
               'Unsaved'}
            </span>
          </div>
      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1">
        {editorMode === 'visual' ? (
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            {toolbarBlocks.map((block: any, index: number) => {
              if (block.items && Array.isArray(block.items)) {
                if (block.name === 'Paragraph') {
                  return (
                    <DropdownMenu key={`toolbar-dropdown-${index}`}>
                      <DropdownMenuTrigger className="max-w-[180px] border-l border-r w-auto h-10 border-none px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                        {block.label}
                        <Fai icon="chevron-down" style="fas" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {block.items.map((item: any, itemIndex: number) => (
                          <DropdownMenuItem 
                            key={`item-${index}-${itemIndex}`}
                            onClick={() => handleToolbarAction(item.action || item.label)}
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
                    <DropdownMenuTrigger className="max-w-[180px] border-l border-r w-auto h-10 border-none px-3 py-2 hover:bg-gray-100">
                      <Fai icon={block.icon} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {block.items.map((item: any, itemIndex: number) => (
                        <DropdownMenuItem 
                          key={`item-${index}-${itemIndex}`}
                          onClick={() => handleToolbarAction(item.action || item.label)}
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
            
            <button
              className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700"
              onClick={() => handleToolbarAction('citation')}
              title="Add Citation"
              aria-label="Add Citation"
              type="button"
            >
              <Fai icon="quote-right" style="fas" />
            </button>
            
            <button
              className="px-3 py-2 border-0 hover:bg-gray-100 transition-colors rounded text-gray-700"
              onClick={() => handleToolbarAction('blockquote')}
              title="Blockquote"
              aria-label="Blockquote"
              type="button"
            >
              <Fai icon="quote-left" style="fas" />
            </button>
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
            title="Publish (Ctrl+S)"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative">
        {showPreview ? (
          <div className="p-8 w-full min-h-full prose max-w-none" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm font-medium text-yellow-800">Preview Mode - Read Only</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(payload.content) }} />
          </div>
        ) : editorMode === 'code' ? (
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
            role="textbox"
            aria-multiline="true"
            spellCheck={spellCheckEnabled}
            style={{
              minHeight: '500px',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          />
        )}
      </div>

      {isGenerating && (
        <div 
          className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Generating AI content...</span>
        </div>
      )}
      
      {citations.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <div className="font-semibold mb-2 text-sm">Citations ({citations.length})</div>
          <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
            {citations.map((cite, idx) => (
              <div key={cite.id} className="border-b pb-1">
                <span className="font-medium">[{idx + 1}]</span> {cite.author || cite.text}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs opacity-0 hover:opacity-100 transition-opacity">
        <div className="font-semibold mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+B</kbd> Bold</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+I</kbd> Italic</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+U</kbd> Underline</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+K</kbd> Insert Link</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+F</kbd> Find</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+H</kbd> Find & Replace</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Z</kbd> Undo</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Y</kbd> Redo</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+S</kbd> Publish</div>
          <div><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+Shift+P</kbd> Preview</div>
        </div>
      </div>
    </div>
  );
}