import React, { useCallback, useState, useEffect } from "react";
import { $createTableNode, $isTableNode, TableNode } from "@/components/utils/editor/nodes/TableNode";
import { $getSelection, $getNodeByKey, SELECTION_CHANGE_COMMAND } from "lexical";
import { LexicalEditor } from "lexical";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Table } from "lucide-react";

interface TableToolbarProps {
  editor: LexicalEditor;
}

export function TableToolbar({ editor }: TableToolbarProps) {
  const [selectedTableKey, setSelectedTableKey] = useState < string | null > (null);
  
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!selection) {
            setSelectedTableKey(null);
            return false;
          }
          
          const nodes = selection.getNodes();
          let tableNode: TableNode | null = null;
          
          for (const node of nodes) {
            let current = node;
            while (current) {
              if ($isTableNode(current)) {
                tableNode = current;
                break;
              }
              current = current.getParent();
            }
            if (tableNode) break;
          }
          
          setSelectedTableKey(tableNode ? tableNode.getKey() : null);
        });
        return false;
      },
      1 // COMMAND_PRIORITY_LOW
    );
  }, [editor]);
  
  const insertTable = useCallback(() => {
    editor.update(() => {
      const tableNode = $createTableNode(3, 3);
      const selection = $getSelection();
      if (selection) {
        selection.insertNodes([tableNode]);
      }
    });
  }, [editor]);
  
  const addRow = useCallback(() => {
    if (!selectedTableKey) return;
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node)) {
        node.setRows(node.getRows() + 1);
      }
    });
  }, [editor, selectedTableKey]);
  
  const addColumn = useCallback(() => {
    if (!selectedTableKey) return;
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node)) {
        node.setCols(node.getCols() + 1);
      }
    });
  }, [editor, selectedTableKey]);
  
  const removeRow = useCallback(() => {
    if (!selectedTableKey) return;
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node)) {
        const currentRows = node.getRows();
        if (currentRows > 1) {
          node.setRows(currentRows - 1);
        }
      }
    });
  }, [editor, selectedTableKey]);
  
  const removeColumn = useCallback(() => {
    if (!selectedTableKey) return;
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node)) {
        const currentCols = node.getCols();
        if (currentCols > 1) {
          node.setCols(currentCols - 1);
        }
      }
    });
  }, [editor, selectedTableKey]);
  
  return (
    <div className="flex gap-2 items-center p-2 border-b border-gray-200 bg-gray-50">
      <Button variant="outline" size="sm" onClick={insertTable}>
        <Table className="w-4 h-4 mr-1" /> Insert Table
      </Button>

      {selectedTableKey && (
        <>
          <span className="text-xs text-gray-500 mx-2">Table controls:</span>
          <Button variant="outline" size="sm" onClick={addRow} title="Add row">
            <Plus className="w-4 h-4 mr-1" /> Row
          </Button>
          <Button variant="outline" size="sm" onClick={addColumn} title="Add column">
            <Plus className="w-4 h-4 mr-1" /> Col
          </Button>
          <Button variant="outline" size="sm" onClick={removeRow} title="Remove row">
            <Minus className="w-4 h-4 mr-1" /> Row
          </Button>
          <Button variant="outline" size="sm" onClick={removeColumn} title="Remove column">
            <Minus className="w-4 h-4 mr-1" /> Col
          </Button>
        </>
      )}
    </div>
  );
}