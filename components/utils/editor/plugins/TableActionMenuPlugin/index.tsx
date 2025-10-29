"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
  TableCellNode,
} from "@lexical/table";
import {
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { createPortal } from "react-dom";
import ColorPicker from "@/components/ui/ColorPicker";

// Compute number of selected rows/columns
function computeSelectionCount(selection: any) {
  const shape = selection.getShape();
  return {
    columns: shape.toX - shape.fromX + 1,
    rows: shape.toY - shape.fromY + 1,
  };
}

// Check if cell can unmerge
function $canUnmerge() {
  const selection = $getSelection();
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}

function TableActionMenu({
  cellMerge,
}: {
  cellMerge: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
  const [selectionCounts, setSelectionCounts] = React.useState({
    columns: 1,
    rows: 1,
  });
  const [backgroundColor, setBackgroundColor] = React.useState("");
  const [canMerge, setCanMerge] = React.useState(false);
  const [canUnmerge, setCanUnmerge] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isTableSelection(selection)) {
          const counts = computeSelectionCount(selection);
          setSelectionCounts(counts);
          setCanMerge(counts.columns > 1 || counts.rows > 1);
          setShowMenu(true);
        } else {
          setShowMenu(false);
        }
        setCanUnmerge($canUnmerge());
      });
    });
  }, [editor]);
  
  const handleColorChange = (value: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isTableCellNode(node)) node.setBackgroundColor(value);
        });
      }
    });
    setBackgroundColor(value);
  };
  
  const handleMerge = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes().filter($isTableCellNode);
        $mergeCells(nodes);
      }
    });
  };
  
  const handleUnmerge = () => {
    editor.update(() => $unmergeCell());
  };
  
  const handleInsertRow = (after: boolean) => {
    editor.update(() => {
      for (let i = 0; i < selectionCounts.rows; i++) {
        $insertTableRowAtSelection(after);
      }
    });
  };
  
  const handleInsertColumn = (after: boolean) => {
    editor.update(() => {
      for (let i = 0; i < selectionCounts.columns; i++) {
        $insertTableColumnAtSelection(after);
      }
    });
  };
  
  const handleDeleteRow = () => editor.update(() => $deleteTableRowAtSelection());
  const handleDeleteColumn = () => editor.update(() => $deleteTableColumnAtSelection());
  
  if (!showMenu) return null;
  
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="flex items-center gap-1">
            <span className="mr-1">▼</span> Table Actions
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl shadow-md">
          {cellMerge && canMerge && (
            <DropdownMenuItem onClick={handleMerge}>Merge Cells</DropdownMenuItem>
          )}
          {cellMerge && canUnmerge && (
            <DropdownMenuItem onClick={handleUnmerge}>Unmerge Cells</DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setColorPickerOpen(true)}>
            Cell Background Color
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Insert Row</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleInsertRow(false)}>
                Above
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleInsertRow(true)}>
                Below
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Insert Column</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleInsertColumn(false)}>
                Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleInsertColumn(true)}>
                Right
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleDeleteRow}>Delete Row</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteColumn}>Delete Column</DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setOpen(false)}>Close Menu</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pick Cell Background</DialogTitle>
          </DialogHeader>
          <ColorPicker color={backgroundColor} onChange={handleColorChange} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = true,
}: {
  anchorElem ? : HTMLElement;
  cellMerge ? : boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = React.useState(false);
  
  React.useEffect(() => {
    setIsEditable(editor.isEditable());
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable);
    });
  }, [editor]);
  
  return createPortal(
    isEditable ? (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 right-4 z-50"
        style={{ position: 'fixed' }}
      >
        <TableActionMenu cellMerge={cellMerge} />
      </motion.div>
    ) : null,
    anchorElem
  );
}