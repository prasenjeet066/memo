// Lexical Editor Configuration

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableNode } from '@/components/utils/editor/nodes/TableNode'
import { TableRowNode, TableCellNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { ImageNode } from '@/components/utils/editor/nodes/ImageNode';

export const initialConfig = {
  namespace: 'EnhancedEditor',
  theme: {
    paragraph: 'mb-2',
    heading: {
      h1: 'text-4xl font-bold mb-4 mt-6 border-b w-full pb-2',
      h2: 'text-3xl font-bold mb-3 mt-5 border-b w-full pb-2',
      h3: 'text-2xl font-bold mb-2 mt-4',
      h4: 'text-xl font-bold mb-2 mt-3',
      h5: 'text-lg font-bold mb-2 mt-2',
      h6: 'text-base font-bold mb-2 mt-2',
    },
    list: {
      ul: 'list-disc ml-6 mb-2',
      ol: 'list-decimal ml-6 mb-2',
      listitem: 'mb-1',
    },
    table: 'border-collapse border border-gray-300 w-full my-4',
    tableCell: 'border border-gray-300 px-3 py-2 min-w-[100px]',
    tableCellHeader: 'border border-gray-300 px-3 py-2 bg-gray-100 font-bold',
    link: 'text-blue-600 hover:underline cursor-pointer',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-gray-100 px-1 py-0.5 rounded font-mono text-sm',
    },
    code: 'bg-gray-800 text-white p-4 rounded-lg font-mono text-sm block my-4 overflow-x-auto',
    quote: 'border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700',
  },
  onError: (error: Error) => {
    console.error('Lexical error:', error);
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    ImageNode,
  ],
};