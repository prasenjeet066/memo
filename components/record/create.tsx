'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome';
import InfoBox from '@/lib/editor/templates/infobox'
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode ? : 'visual' | 'code';
  record_name ? : string;
  onPublish ? : () => void;
  sideBarTools ? : () => void;
  ExpandedIs ? : boolean;
  IsExpandedSet: any
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
// Rename export for clarity, but keep compatibility with previous usage
export default function CreateNew({
  editor_mode = 'visual',
  record_name = '',
  onPublish,
  sideBarTools,
  ExpandedIs,
  IsExpandedSet,
}: EditorProps) {
  const [editorMode, setEditorMode] = useState < 'visual' | 'code' > ('visual');
  const [ActiveEditionPoint, setActiveEditionPoint] = useState(null);
  const [payload, setPayload] = useState({
    title: '',
    content: ''
  });
  /**
    useEffect(() => {
      if (ActiveEditionPoint !== null) {
        
        let block = findBlockByAction(ActiveEditionPoint.action);
        
        if (block.editor || block.editor.length) {
          let innerEditor: TableEditorField[] = block.editor;
          let isExpanded = ExpandedIs;
          let setIsExpanded = IsExpandedSet;
          sideBarTools(<>
            <div className='w-auto h-full bg-white mr-2 flex flex-col justify-between rounded-2xl'>
        <div className='p-4 border-b border-gray-200'>
          <button
            
            className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
          >
            {ActiveEditionPoint.action}
          </button>
        </div>

        <nav className='flex-1 p-4 flex flex-col justify-between'>
          <div className='space-y-2 flex-1'>
            {innerEditor.map((nav) => (
              <div
                key={nav.label}
                
                className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group'
              >
                <small className = 'border-b w-full'>{nav.label}</small>
                <div>
                  
                </div>
                
              </div>
            ))}
          </div>
          </nav>
          </div>
          </>)
        }
        
      }
    }, [ActiveEditionPoint])**/
  const [activeAction, setActiveAction] = useState < string | null > (null);
  const editorRef = useRef < HTMLDivElement > (null);
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  
  // Create a flattened version once
  const flattenedBlocks = toolbarBlocks.flatMap(block => [block, ...(block.items || []), ...(block.editor || [])]
    .flatMap(item => [item, ...(item.items || []), ...(item.editor || [])])
  ).filter(Boolean);
  
  // Then use simple find
  function findBlockByAction(actionName) {
    return flattenedBlocks.find(block => block.action === actionName);
  }
  
  // Usage
  
  useEffect(() => {
    if (!record_name?.trim()) {
      console.warn('Record name is empty or undefined');
    }
  }, [record_name]);
  
  
  // Types for better type safety
  interface TemplateImage {
    url: string;
    height ? : number;
    width ? : number;
    alt ? : string;
    caption ? : string;
  }
  
  interface TemplateField {
    label: string;
    value: any;
    type ? : 'text' | 'link' | 'coordinates' | 'signature' | 'image';
    className ? : string;
  }
  
  interface TemplateSection {
    header: string;
    fields ? : TemplateField[];
  }
  
  interface TemplateInfoBox {
    image ? : TemplateImage;
    title ? : string;
    subtitle ? : string;
    sections ? : TemplateSection[];
  }
  
  interface TemplateConfig {
    name ? : string;
    parameters ? : Array < { id: string;value: string } > ;
  }
  
  // Field value processors for better separation of concerns
  const fieldProcessors = {
    text: (value: any): string => `<span>${escapeHtml(value)}</span>`,
    
    link: (value: any): string => {
      if (!Array.isArray(value)) return fieldProcessors.text(value);
      
      const items = value.map(item => `<li>${escapeHtml(item)}</li>`).join('');
      return `<ul>${items}</ul>`;
    },
    
    coordinates: (value: any): string =>
      `<span class="coordinates">${escapeHtml(value)}</span>`,
    
    signature: (value: any): string =>
      `<span class="signature">${escapeHtml(value)}</span>`,
    
    image: (value: any): string => {
      if (typeof value !== 'object' || !value?.image?.url) {
        return fieldProcessors.text(value);
      }
      
      const { image } = value;
      const alt = image.alt ? ` alt="${escapeHtml(image.alt)}"` : '';
      const width = image.width ? ` width="${image.width}"` : '';
      
      return `<img src="${image.url}"${alt}${width}>`;
    },
    
    default: (value: any): string => {
      if (typeof value === 'object' && value.href) {
        const link = `<a href="${escapeHtml(value.href)}">${escapeHtml(value.text || '')}</a>`;
        const subtext = value.subtext ? `<small>${escapeHtml(value.subtext)}</small>` : '';
        return link + subtext;
      }
      
      return `<span>${escapeHtml(value)}</span>`;
    }
  };
  
  // HTML escaping utility
  const escapeHtml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    
    const str = String(unsafe);
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  
  // Individual component builders
  const buildImage = (image: TemplateImage): string => {
    if (!image?.url) return '';
    
    const { url, height, width, alt = '', caption } = image;
    const heightAttr = height ? ` height="${height}"` : '';
    const widthAttr = width ? ` width="${width}"` : '';
    
    return `
    <img src="${url}"${heightAttr}${widthAttr} alt="${escapeHtml(alt)}"/>
    ${caption ? `<caption>${escapeHtml(caption)}</caption>` : ''}
  `.trim();
  };
  
  const buildTitle = (title: string, subtitle ? : string): string => {
    if (!title) return '';
    
    return `
    <h2 class='heading-tpl'>${escapeHtml(title)}</h2>
    ${subtitle ? `<h4>${escapeHtml(subtitle)}</h4>` : ''}
  `.trim();
  };
  
  const buildField = (field: TemplateField): string => {
    if (!field?.label || field.value === undefined) return '';
    
    const processor = fieldProcessors[field.type as keyof typeof fieldProcessors] || fieldProcessors.default;
    const classAttr = field.className ? ` class="${escapeHtml(field.className)}"` : '';
    
    return `
    <div class="field"${classAttr}>
      <strong>${escapeHtml(field.label)}:</strong>
      ${processor(field.value)}
    </div>
  `.trim();
  };
  
  const buildSection = (section: TemplateSection): string => {
    if (!section?.header) return '';
    
    const fields = (section.fields || [])
      .map(buildField)
      .filter(Boolean)
      .join('');
    
    return `
    <div class="section">
      <h3>${escapeHtml(section.header)}</h3>
      ${fields}
    </div>
  `.trim();
  };
  
  const buildInfoBox = (ibox: TemplateInfoBox, templateName: string): string => {
    const sections = (ibox.sections || [])
      .map(buildSection)
      .filter(Boolean)
      .join('');
    
    return `
    <div class='x-tpl-${templateName}'>
      ${buildImage(ibox.image || {})}
      ${buildTitle(ibox.title || '', ibox.subtitle)}
      ${sections}
    </div>
  `.trim();
  };
  
  // Main template builder
  const buildTemplate = (arg ? : TemplateConfig): string => {
    const templateName = arg?.name || 'default';
    
    // Validate and process InfoBox data
    if (!Array.isArray(InfoBox) || InfoBox.length === 0) {
      return `<div class='tpl-${templateName}'></div>`;
    }
    
    const infoBoxes = InfoBox
      .map(ibox => buildInfoBox(ibox, templateName))
      .filter(Boolean)
      .join('');
    
    return `
    <div class='tpl-${templateName}'>
      ${infoBoxes}
    </div>
  `.trim();
  };
  
  // Template insertion handler
  const insertTemplate = (editorRef: React.RefObject < HTMLElement > ): boolean => {
    
    if (!editorRef.current) {
      console.warn('Editor reference not available');
      return false;
    }
    
    try {
      editorRef.current.focus();
      
      const template = `
      <br/>
      ${buildTemplate({ name: 'infobox', parameters: [] })}
      <br/>
    `.trim();
      
      // Use modern clipboard API as fallback
      if (!document.execCommand('insertHTML', false, template)) {
        // Fallback for modern browsers
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          const templateNode = document.createRange().createContextualFragment(template);
          range.insertNode(templateNode);
          
          // Move cursor after inserted content
          range.setStartAfter(templateNode.lastChild || templateNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to insert template:', error);
      
      // Ultimate fallback
      try {
        document.execCommand('insertHTML', false, '<br/><div class="tpl-infobox">Infobox Template</div><br/>');
      } catch (fallbackError) {
        console.error('Fallback insertion also failed:', fallbackError);
      }
      
      return false;
    }
  };
  
  // Usage in your component
  
  
  // Function to attach event listeners to table buttons
  function attachTableEventListeners(tableId) {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableContainer) return;
    setActiveEditionPoint({ ref: tableContainer, action: 'table' })
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
          case 'heading':
            editorRef.current.focus()
            let heading = '<br/><h1 class="heading-lind">Title...</h1><hr/><br/>'
            document.execCommand('insertHTML', false, heading)
            break;
          case 'italic':
            document.execCommand('italic', false);
            break;
          case 'table':
            const editor = editorRef.current;
            editor.focus();
            const tableId = 'table-' + Date.now();
            
            // Helper functions
            const makeHeader = j => `<th contenteditable>Header ${j+1}</th>`;
            const makeCell = (i, j) => `<td contenteditable>Row ${i+1}, Col ${j+1}</td>`;
            const makeRow = (i, isHeader = false) =>
              `<tr>${Array(4).fill().map((_, j) => isHeader ? makeHeader(j) : makeCell(i, j)).join('')}</tr>`;
            
            const tableHTML = `
    <div class="tbl-operator" data-table-id="${tableId}">
      <table border="1" style="border-collapse:collapse;width:100%">
        <thead>${makeRow(0, true)}</thead>
        <tbody>${[0,1,2].map(i => makeRow(i)).join('')}</tbody>
      </table>
      <div class="table-controls" contenteditable="false">
        <button class="add-row-btn fas fa-arrow-down-from-dotted-line" data-table="${tableId}"></button>
        <hr/><button class="add-col-btn fas fa-arrow-left-from-line" data-table="${tableId}"></button>
      </div>
    </div><br>
  `;
            
            document.execCommand('insertHTML', false, tableHTML);
            setTimeout(() => attachTableEventListeners(tableId), 100);
            break;
          case 'underline':
            document.execCommand('underline', false);
            break;
          case 'strikethrough':
            document.execCommand('strikeThrough', false);
            break;
          case 'template':
            insertTemplate(editorRef)
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
          <SelectTrigger className="max-w-[140px] w-auto h-10 border-none bg-white rounded-full">
            <SelectValue placeholder={editorMode} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visual">Visual</SelectItem>
            <SelectItem value="code">code</SelectItem>
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

      {editorMode === 'code' ? (
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