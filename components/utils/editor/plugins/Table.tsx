import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { EditorThemeClasses, Klass, LexicalEditor, LexicalNode } from 'lexical';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type InsertTableCommandPayload = Readonly < {
  columns: string;
  rows: string;
  includeHeaders ? : boolean;
} > ;

export type CellContextShape = {
  cellEditorConfig: null | CellEditorConfig;
  cellEditorPlugins: null | JSX.Element | Array < JSX.Element > ;
  set: (
    cellEditorConfig: null | CellEditorConfig,
    cellEditorPlugins: null | JSX.Element | Array < JSX.Element >
  ) => void;
};

export type CellEditorConfig = Readonly < {
  namespace: string;
  nodes ? : ReadonlyArray < Klass < LexicalNode >> ;
  onError: (error: Error, editor: LexicalEditor) => void;
  readOnly ? : boolean;
  theme ? : EditorThemeClasses;
} > ;

export const CellContext = createContext < CellContextShape > ({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {},
});

export function TableContext({ children }: { children: JSX.Element }) {
  const [contextValue, setContextValue] = useState < {
    cellEditorConfig: null | CellEditorConfig;
    cellEditorPlugins: null | JSX.Element | Array < JSX.Element > ;
  } > ({ cellEditorConfig: null, cellEditorPlugins: null });
  
  return (
    <CellContext.Provider
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins });
          },
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      )}
    >
      {children}
    </CellContext.Provider>
  );
}

export function InsertTableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [rows, setRows] = useState('5');
  const [columns, setColumns] = useState('5');
  const [isDisabled, setIsDisabled] = useState(true);
  
  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);
    setIsDisabled(!(row > 0 && row <= 500 && column > 0 && column <= 50));
  }, [rows, columns]);
  
  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows });
    onClose();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="number"
            placeholder="# of rows (1-500)"
            value={rows}
            onChange={(e) => setRows(e.currentTarget.value)}
            aria-label="Rows"
          />
          <Input
            type="number"
            placeholder="# of columns (1-50)"
            value={columns}
            onChange={(e) => setColumns(e.currentTarget.value)}
            aria-label="Columns"
          />
        </div>
        <DialogFooter>
          <Button disabled={isDisabled} onClick={onClick}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TablePlugin({
  cellEditorConfig,
  children,
}: {
  cellEditorConfig: CellEditorConfig;
  children: JSX.Element | Array < JSX.Element > ;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const cellContext = useContext(CellContext);
  
  useEffect(() => {
    if (!editor.hasNodes([TableNode, TableRowNode, TableCellNode])) {
      throw new Error(
        'TablePlugin: TableNode, TableRowNode, or TableCellNode is not registered on editor'
      );
    }
  }, [editor]);
  
  useEffect(() => {
    cellContext.set(cellEditorConfig, children);
  }, [cellContext, cellEditorConfig, children]);
  
  return null;
}