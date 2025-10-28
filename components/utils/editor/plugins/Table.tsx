import React, { useCallback, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $insertNodeToNearestRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import {
  $createTableNodeWithDimensions,
  TableNode,
  TableRowNode,
  TableCellNode,
  INSERT_TABLE_COMMAND,
  $getElementForTableNode,
  mergeTableCellsCommand,
  splitTableCellCommand,
  toggleTableRowHeaderCommand,
  toggleTableColumnHeaderCommand,
} from "@lexical/table";
import { Button } from "@/components/ui/button"; // or replace with <button> if not using shadcn
import { createCommand } from "lexical";

// Custom table management commands
export const ADD_ROW_COMMAND = createCommand("ADD_ROW_COMMAND");
export const ADD_COLUMN_COMMAND = createCommand("ADD_COLUMN_COMMAND");
export const DELETE_TABLE_COMMAND = createCommand("DELETE_TABLE_COMMAND");
export const DELETE_ROW_COMMAND = createCommand("DELETE_ROW_COMMAND");
export const DELETE_COLUMN_COMMAND = createCommand("DELETE_COLUMN_COMMAND");

export const AdvancedTablePlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  
  /** Insert 3×3 table */
  const insertTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const tableNode = $createTableNodeWithDimensions(3, 3);
        $insertNodeToNearestRoot(tableNode);
      }
    });
  }, [editor]);
  
  /** Add row */
  const addRow = useCallback(() => {
    editor.update(() => {
      const rootMap = editor.getEditorState()._nodeMap;
      for (const [, node] of rootMap) {
        if (node instanceof TableNode) {
          const lastRow = node.getLastChild() as TableRowNode;
          const columnCount = lastRow.getChildren().length;
          const newRow = new TableRowNode();
          for (let i = 0; i < columnCount; i++) {
            newRow.append(new TableCellNode());
          }
          node.append(newRow);
          break;
        }
      }
    });
  }, [editor]);
  
  /** Add column */
  const addColumn = useCallback(() => {
    editor.update(() => {
      const rootMap = editor.getEditorState()._nodeMap;
      for (const [, node] of rootMap) {
        if (node instanceof TableNode) {
          const rows = node.getChildren < TableRowNode > ();
          for (const row of rows) {
            row.append(new TableCellNode());
          }
          break;
        }
      }
    });
  }, [editor]);
  
  /** Delete last row */
  const deleteRow = useCallback(() => {
    editor.update(() => {
      const rootMap = editor.getEditorState()._nodeMap;
      for (const [, node] of rootMap) {
        if (node instanceof TableNode) {
          const rows = node.getChildren < TableRowNode > ();
          const lastRow = rows[rows.length - 1];
          if (lastRow) lastRow.remove();
        }
      }
    });
  }, [editor]);
  
  /** Delete last column */
  const deleteColumn = useCallback(() => {
    editor.update(() => {
      const rootMap = editor.getEditorState()._nodeMap;
      for (const [, node] of rootMap) {
        if (node instanceof TableNode) {
          const rows = node.getChildren < TableRowNode > ();
          for (const row of rows) {
            const cells = row.getChildren < TableCellNode > ();
            const lastCell = cells[cells.length - 1];
            if (lastCell) lastCell.remove();
          }
        }
      }
    });
  }, [editor]);
  
  /** Delete entire table */
  const deleteTable = useCallback(() => {
    editor.update(() => {
      const rootMap = editor.getEditorState()._nodeMap;
      for (const [, node] of rootMap) {
        if (node instanceof TableNode) node.remove();
      }
    });
  }, [editor]);
  
  /** Merge selected cells */
  const mergeCells = useCallback(() => {
    editor.dispatchCommand(mergeTableCellsCommand, undefined);
  }, [editor]);
  
  /** Split merged cell */
  const splitCell = useCallback(() => {
    editor.dispatchCommand(splitTableCellCommand, undefined);
  }, [editor]);
  
  /** Toggle header row/column */
  const toggleHeaders = useCallback(() => {
    editor.dispatchCommand(toggleTableRowHeaderCommand, undefined);
    editor.dispatchCommand(toggleTableColumnHeaderCommand, undefined);
  }, [editor]);
  
  /** Register insert table command */
  useEffect(() => {
    return editor.registerCommand(
      INSERT_TABLE_COMMAND,
      (payload) => {
        const { rows = 3, columns = 3 } = payload ?? {};
        editor.update(() => {
          const tableNode = $createTableNodeWithDimensions(rows, columns);
          $insertNodeToNearestRoot(tableNode);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  
  return (
    <div className="flex flex-wrap gap-2 mt-3 p-2 border-t border-gray-300">
      <Button size="sm" onClick={insertTable}>➕ Insert 3×3 Table</Button>
      <Button size="sm" variant="secondary" onClick={addRow}>➕ Add Row</Button>
      <Button size="sm" variant="secondary" onClick={addColumn}>➕ Add Column</Button>
      <Button size="sm" variant="secondary" onClick={deleteRow}>➖ Delete Row</Button>
      <Button size="sm" variant="secondary" onClick={deleteColumn}>➖ Delete Column</Button>
      <Button size="sm" variant="outline" onClick={mergeCells}>🔗 Merge</Button>
      <Button size="sm" variant="outline" onClick={splitCell}>✂️ Split</Button>
      <Button size="sm" variant="outline" onClick={toggleHeaders}>🔠 Toggle Headers</Button>
      <Button size="sm" variant="destructive" onClick={deleteTable}>🗑 Delete Table</Button>
    </div>
  );
};