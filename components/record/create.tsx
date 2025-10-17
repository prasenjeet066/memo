'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome';
import InfoBox from '@/lib/editor/templates/infobox';
import { toolbarBlocks } from '@/lib/editor/toolbarConfig';

interface EditorProps {
  editor_mode?: 'visual' | 'code';
  record_name?: string;
  onPublish?: () => void;
  sideBarTools?: (tools: React.ReactNode) => void;
  ExpandedIs?: boolean;
  IsExpandedSet: (expanded: boolean) => void;
}

export default function CreateNew({
  editor_mode = 'visual',
  record_name = '',
  onPublish,
  sideBarTools,
  ExpandedIs,
  IsExpandedSet,
}: EditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(editor_mode);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [payload, setPayload] = useState({
    title: '',
    content: '',
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const flattenedBlocks = toolbarBlocks
    .flatMap((block) => [block, ...(block.items || []), ...(block.editor || [])])
    .flatMap((item) => [item, ...(item.items || []), ...(item.editor || [])])
    .filter(Boolean);

  function findBlockByAction(actionName: string) {
    return flattenedBlocks.find((block) => block.action === actionName);
  }

  useEffect(() => {
    if (!record_name?.trim()) {
      console.warn('Record name is empty or undefined');
    }
  }, [record_name]);

  /** ----------- Utilities ----------- **/
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

  const buildTemplate = (arg?: { name?: string }): string => {
    const templateName = arg?.name || 'default';
    if (!Array.isArray(InfoBox) || InfoBox.length === 0) {
      return `<div class='tpl-${templateName}'></div>`;
    }

    const buildImage = (image: any): string => {
      if (!image?.url) return '';
      const { url, height, width, alt = '', caption } = image;
      const heightAttr = height ? ` height="${height}"` : '';
      const widthAttr = width ? ` width="${width}"` : '';
      return `
        <img src="${url}"${heightAttr}${widthAttr} alt="${escapeHtml(alt)}"/>
        ${caption ? `<caption>${escapeHtml(caption)}</caption>` : ''}
      `.trim();
    };

    const buildTitle = (title: string, subtitle?: string): string => {
      if (!title) return '';
      return `
        <h2 class='heading-tpl'>${escapeHtml(title)}</h2>
        ${subtitle ? `<h4>${escapeHtml(subtitle)}</h4>` : ''}
      `.trim();
    };

    const buildInfoBox = (ibox: any): string => {
      const sections = (ibox.sections || [])
        .map((section: any) => {
          const fields = (section.fields || [])
            .map(
              (f: any) =>
                `<div class="field"><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(
                  f.value,
                )}</div>`,
            )
            .join('');
          return `<div class="section"><h3>${escapeHtml(section.header)}</h3>${fields}</div>`;
        })
        .join('');
      return `
        <div class='x-tpl-${templateName}'>
          ${buildImage(ibox.image || {})}
          ${buildTitle(ibox.title || '', ibox.subtitle)}
          ${sections}
        </div>
      `.trim();
    };

    const infoBoxes = InfoBox.map((ibox) => buildInfoBox(ibox))
      .filter(Boolean)
      .join('');
    return `<div class='tpl-${templateName}'>${infoBoxes}</div>`.trim();
  };

  const insertTemplate = (editorRef: React.RefObject<HTMLElement>): boolean => {
    if (!editorRef.current) return false;
    try {
      editorRef.current.focus();
      const template = `<br/>${buildTemplate({ name: 'infobox' })}<br/>`.trim();

      const success = document.execCommand('insertHTML', false, template);
      if (!success) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const frag = range.createContextualFragment(template);
          range.insertNode(frag);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to insert template:', error);
      return false;
    }
  };

  /** ----------- Table helpers ----------- **/
  function attachTableEventListeners(tableId: string) {
    const tableContainer = document.querySelector(`[data-table-id="${tableId}"]`) as HTMLElement;
    if (!tableContainer) return;

    const addRowBtn = tableContainer.querySelector('.add-row-btn');
    addRowBtn?.addEventListener('click', () => addTableRow(tableContainer));

    const addColBtn = tableContainer.querySelector('.add-col-btn');
    addColBtn?.addEventListener('click', () => addTableColumn(tableContainer));
  }

  function addTableRow(tableContainer: HTMLElement) {
    const table = tableContainer.querySelector('table');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    const cols = rows[0].querySelectorAll('td,th').length;
    const newRow = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const newCell = document.createElement('td');
      newCell.contentEditable = 'true';
      newCell.textContent = `Row ${rows.length + 1}, Col ${i + 1}`;
      newRow.appendChild(newCell);
    }
    table.appendChild(newRow);
  }

  function addTableColumn(tableContainer: HTMLElement) {
    const table = tableContainer.querySelector('table');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, i) => {
      const newCell = document.createElement('td');
      newCell.contentEditable = 'true';
      newCell.textContent = `Row ${i + 1}, Col ${row.children.length + 1}`;
      row.appendChild(newCell);
    });
  }

  /** ----------- Toolbar Actions ----------- **/
  const executeCommand = useCallback(
    (action: string | null) => {
      if (!action || editorMode !== 'visual' || !editorRef.current) return;
      const editor = editorRef.current;
      editor.focus();

      try {
        switch (action) {
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
          case 'heading':
            document.execCommand('insertHTML', false, '<br/><h1>Title...</h1><hr/><br/>');
            break;
          case 'table': {
            const tableId = 'table-' + Date.now();
            const tableHTML = `
              <div class="tbl-operator" data-table-id="${tableId}">
                <table border="1" style="border-collapse:collapse;width:100%">
                  <thead><tr>${Array(4)
                    .fill(0)
                    .map((_, j) => `<th contenteditable>Header ${j + 1}</th>`)
                    .join('')}</tr></thead>
                  <tbody>${Array(3)
                    .fill(0)
                    .map(
                      (_, i) =>
                        `<tr>${Array(4)
                          .fill(0)
                          .map(
                            (__, j) =>
                              `<td contenteditable>Row ${i + 1}, Col ${j + 1}</td>`,
                          )
                          .join('')}</tr>`,
                    )
                    .join('')}</tbody>
                </table>
                <div class="table-controls" contenteditable="false">
                  <button class="add-row-btn fas fa-arrow-down-from-dotted-line" data-table="${tableId}"></button>
                  <hr/>
                  <button class="add-col-btn fas fa-arrow-left-from-line" data-table="${tableId}"></button>
                </div>
              </div><br/>
            `;
            document.execCommand('insertHTML', false, tableHTML);
            setTimeout(() => attachTableEventListeners(tableId), 100);
            break;
          }
          case 'template':
            insertTemplate(editorRef);
            break;
          default:
            console.log(`Unknown command: ${action}`);
        }
      } catch (error) {
        console.error(`Command failed: ${action}`, error);
      } finally {
        setActiveAction(null);
      }
    },
    [editorMode],
  );

  useEffect(() => {
    if (activeAction) executeCommand(activeAction);
  }, [activeAction, executeCommand]);

  const handlePublish = useCallback(() => {
    onPublish ? onPublish() : console.log('Publishing...', payload);
  }, [onPublish, payload]);

  const handleToolbarAction = useCallback(
    (action: string) => {
      if (action && action !== activeAction) setActiveAction(action);
    },
    [activeAction],
  );

  const handleSwMode = useCallback(
    (mode: 'visual' | 'code') => {
      if (mode === 'visual') {
        if (editorRef.current && payload.content !== null) {
          editorRef.current.innerHTML = payload.content;
          setEditorMode('visual');
        }
      } else {
        if (editorRef.current) {
          setPayload((prev) => ({
            ...prev,
            content: editorRef.current?.innerHTML || '',
          }));
          setEditorMode('code');
        }
      }
    },
    [payload.content],
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPayload((prev) => ({ ...prev, content: e.target.value }));
  }, []);

  const handleEditorContentChange = useCallback(() => {
    if (editorRef.current) {
      setPayload((prev) => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  }, []);

  /** ----------- Render ----------- **/
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">
          {record_name?.trim() || 'Untitled Document'}
        </h1>

        <Select defaultValue={editorMode} onValueChange={(value) => handleSwMode(value as any)}>
          <SelectTrigger className="max-w-[140px] w-auto h-10 border-none bg-white rounded-full">
            <SelectValue placeholder={editorMode} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visual">Visual</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2">
        {editorMode === 'visual' && (
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {toolbarBlocks.map((block: any, i: number) =>
              block.items ? (
                <Select key={i}>
                  <SelectTrigger className="max-w-[180px] w-auto h-10 border-none">
                    <SelectValue placeholder={block.name || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {block.items.map((item: any, j: number) => (
                      <SelectItem key={j} value={item.action}>
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
              ) : (
                <button
                  key={i}
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
              ),
            )}
          </div>
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