// Editor Commands Hook

import { useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $createLinkNode } from '@lexical/link';
import { $generateNodesFromDOM } from '@lexical/html';
import { $createCodeNode } from '@lexical/code';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_IMAGE_COMMAND } from '@/components/utils/editor/nodes/ImageNode';
import { INSERT_TABLE_COMMAND } from '@lexical/table';

export const useEditorCommands = (
  lexicalEditorRef: React.MutableRefObject < LexicalEditor | null > ,
  editorMode: 'visual' | 'code',
  citations: any[],
  generateReferencesSection: () => string,
  setLinkDialog: (state: any) => void,
  setCitationDialog: (state: any) => void,
  setImageDialog: (state: any) => void,
  setVideoDialog: (state: any) => void,
  setIsTableDialog: (state: boolean) => void,
) => {
  const executeCommand = useCallback((action: string, args ? : any[]) => {
    if (editorMode !== 'visual' || !lexicalEditorRef.current) return;
    
    const editor = lexicalEditorRef.current;
    
    try {
      switch (action) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strikethrough':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, action);
          break;
          
        case 'inlineCode':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          break;
          
        case 'heading': {
          const level = Math.min(Math.max(1, args?.[0] || 2), 6) as 1 | 2 | 3 | 4 | 5 | 6;
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const heading = $createHeadingNode(`h${level}`);
              const text = selection.getTextContent() || 'Heading';
              heading.append($createTextNode(text));
              selection.insertNodes([heading]);
            }
          });
          break;
        }
        
        case 'paragraph':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          });
          break;
          
        case 'unorderedList':
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          break;
          
        case 'orderedList':
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          break;
          
        case 'refList':
          const refsSection = generateReferencesSection();
          if (refsSection) {
            editor.update(() => {
              const parser = new DOMParser();
              const dom = parser.parseFromString(refsSection, 'text/html');
              const nodes = $generateNodesFromDOM(editor, dom);
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertNodes(nodes);
              }
            });
          } else {
            alert('No citations added yet. Add citations first using the citation tool.');
          }
          break;
          
        case 'table':
          setIsTableDialog(true);
          break;
          
        case 'link':
          setLinkDialog({ open: true, text: '' });
          break;
          
        case 'citation':
        case 'reference':
          if (action === 'reference') {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const refNumber = citations.length + 1;
                const supNode = $createTextNode(`[${refNumber}]`);
                selection.insertNodes([supNode]);
              }
            });
          }
          setCitationDialog({ open: true, author: '', title: '', url: '', date: '' });
          break;
          
        case 'image':
          setImageDialog({ open: true, url: '' });
          break;
          
        case 'video':
          setVideoDialog({ open: true, url: '' });
          break;
          
        case 'codeBlock':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const codeNode = $createCodeNode();
              codeNode.append($createTextNode('// Your code here'));
              selection.insertNodes([codeNode]);
            }
          });
          break;
          
        case 'blockquote':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const quote = $createQuoteNode();
              const text = selection.getTextContent() || 'Quote text';
              quote.append($createTextNode(text));
              selection.insertNodes([quote]);
            }
          });
          break;
          
        case 'horizontalRule':
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
          break;
          
        case 'subscript':
        case 'superscript':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const text = selection.getTextContent() || (action === 'subscript' ? 'sub' : 'sup');
              const html = action === 'subscript' ? `<sub>${text}</sub>` : `<sup>${text}</sup>`;
              const parser = new DOMParser();
              const dom = parser.parseFromString(html, 'text/html');
              const nodes = $generateNodesFromDOM(editor, dom);
              selection.insertNodes(nodes);
            }
          });
          break;
          
        default:
          console.log(`Unknown command: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute command: ${action}`, error);
    }
  }, [
    editorMode,
    citations.length,
    generateReferencesSection,
    setLinkDialog,
    setCitationDialog,
    setImageDialog,
    setVideoDialog,
    setIsTableDialog,
  ]);
  
  return { executeCommand };
};