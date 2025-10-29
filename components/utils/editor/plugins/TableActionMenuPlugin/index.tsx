'use client'
import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button } from "@/components/ui/button";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $mergeCells,
  $unmergeCell,
  $isTableSelection,
} from "@lexical/table";
import { $getSelection, $isRangeSelection } from "lexical";

// ✅ Import icons from lucide-react
import {
  RowsIcon,
  ColumnsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Trash2Icon,
  MergeIcon,
  SplitIcon,
} from "lucide-react";

// --- Utility functions ---
function computeSelectionCount(selection: any) {
  const shape = selection.getShape();
  return {
    columns: shape.toX - shape.fromX + 1,
    rows: shape.toY - shape.fromY + 1,
  };
}

function $canUnmerge() {
  const selection = $getSelection();
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false;
  }
  const [cell] = selection.getNodes();
  return cell?.__colSpan > 1 || cell?.__rowSpan > 1;
}

// --- Table Action Menu ---
function TableActionMenu({ cellMerge }: { cellMerge: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [selectionCounts, setSelectionCounts] = React.useState({ columns: 1, rows: 1 });
  const [showMenu, setShowMenu] = React.useState(false);
  
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isTableSelection(selection)) {
          const counts = computeSelectionCount(selection);
          setSelectionCounts(counts);
          setShowMenu(true);
        } else {
          setShowMenu(false);
        }
      });
    });
  }, [editor]);
  
  if (!showMenu) return null;
  
  // --- Handlers ---
  const handleInsertRow = (after: boolean) =>
    editor.update(() => {
      for (let i = 0; i < selectionCounts.rows; i++) {
        $insertTableRowAtSelection(after);
      }
    });
  
  const handleInsertColumn = (after: boolean) =>
    editor.update(() => {
      for (let i = 0; i < selectionCounts.columns; i++) {
        $insertTableColumnAtSelection(after);
      }
    });
  
  const handleDeleteRow = () => editor.update(() => $deleteTableRowAtSelection());
  const handleDeleteColumn = () => editor.update(() => $deleteTableColumnAtSelection());
  const handleMerge = () => editor.update(() => $mergeCells());
  const handleUnmerge = () => editor.update(() => $unmergeCell());
  
  // --- Toolbar configuration ---
  const ToolbarsList = [
    { name: "Row Above", icon: ArrowUpIcon, action: () => handleInsertRow(false) },
    { name: "Row Below", icon: ArrowDownIcon, action: () => handleInsertRow(true) },
    { name: "Col Left", icon: ArrowLeftIcon, action: () => handleInsertColumn(false) },
    { name: "Col Right", icon: ArrowRightIcon, action: () => handleInsertColumn(true) },
    { name: "Delete Row", icon: RowsIcon, action: handleDeleteRow },
    { name: "Delete Col", icon: ColumnsIcon, action: handleDeleteColumn },
    { name: "Merge Cells", icon: MergeIcon, action: handleMerge },
    { name: "Unmerge Cells", icon: SplitIcon, action: handleUnmerge },
  ];
  
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-2xl shadow-sm border border-border">
      {ToolbarsList.map((item) => (
        <Button
          key={item.name}
          onClick={item.action}
          variant="ghost"
          className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-xl"
          title={item.name}
        >
          <item.icon size={16} />
          <span className="hidden sm:inline">{item.name}</span>
        </Button>
      ))}
    </div>
  );
}

// --- Plugin Wrapper ---
export default function TableActionMenuPlugin({
  anchorElem,
  cellMerge = true,
}: {
  anchorElem ? : (menu: React.ReactNode) => void;
  cellMerge ? : boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = React.useState(false);
  
  React.useEffect(() => {
    setIsEditable(editor.isEditable());
    return editor.registerEditableListener(setIsEditable);
  }, [editor]);
  
  const menu = React.useMemo(() => <TableActionMenu cellMerge={cellMerge} />, [cellMerge]);
  
  React.useEffect(() => {
    if (isEditable && anchorElem) {
      anchorElem(menu);
    }
  }, [menu, isEditable, anchorElem]);
  
  if (!isEditable) return null;
  
  return null;
}