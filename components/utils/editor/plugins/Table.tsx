import React, { useCallback, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTableNode, $isTableNode } from "./TableNode";
import { $getSelection, $getNodeByKey } from "lexical";
import { Button } from "@/components/ui/button"; // assuming shadcn/ui
import { Plus, Minus, Table } from "lucide-react";

export default function TablePlugin() {
  const [editor] = useLexicalComposerContext();
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  
  // Insert a new table (default 3x3)
  const insertTable = useCallback(() => {
    editor.update(() => {
      const tableNode = $createTableNode(3, 3);
      const selection = $getSelection();
      if (selection) {
        selection.insertNodes([tableNode]);
      } else {
        editor.getRootElement().appendChild(tableNode);
      }
    });
  }, [editor]);
  
  // Add a row
  const addRow = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node)) {
        node.__rows += 1;
      }
    });
  }, [editor, selectedTableKey]);
  
  // Add a column
  const addColumn = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node)) {
        node.__cols += 1;
      }
    });
  }, [editor, selectedTableKey]);
  
  // Remove a row
  const removeRow = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node) && node.__rows > 1) {
        node.__rows -= 1;
      }
    });
  }, [editor, selectedTableKey]);
  
  // Remove a column
  const removeColumn = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(selectedTableKey);
      if ($isTableNode(node) && node.__cols > 1) {
        node.__cols -= 1;
      }
    });
  }, [editor, selectedTableKey]);
  
  return (
    <div className="flex gap-2 items-center p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <Button variant="outline" size="sm" onClick={insertTable}>
        <Table className="w-4 h-4 mr-1" /> Insert Table
      </Button>

      {selectedTableKey && (
        <>
          <Button variant="outline" size="icon" onClick={addRow}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={addColumn}>
            <Plus className="w-4 h-4 rotate-90" />
          </Button>
          <Button variant="outline" size="icon" onClick={removeRow}>
            <Minus className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={removeColumn}>
            <Minus className="w-4 h-4 rotate-90" />
          </Button>
        </>
      )}
    </div>
  );
}