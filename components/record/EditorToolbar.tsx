import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// Replace with your icon imports, e.g., from Lucide or Heroicons
import { BoldIcon, ItalicIcon, HeadingIcon, QuoteIcon, CodeIcon, ListOrderedIcon, ListIcon, LinkIcon, ImageIcon, TemplateIcon, FootnoteIcon, TableIcon, HrIcon } from "@/lib/icons";

const recordMXToolbarBlocks = [
  {
    icon: BoldIcon,
    label: "Bold",
    action: "bold"
  },
  {
    icon: ItalicIcon,
    label: "Italic",
    action: "italic"
  },
  {
    icon: HeadingIcon,
    label: "Heading",
    action: "heading"
  },
  {
    icon: QuoteIcon,
    label: "Blockquote",
    action: "blockquote"
  },
  {
    icon: CodeIcon,
    label: "Inline Code",
    action: "code"
  },
  {
    icon: CodeIcon,
    label: "Code Block",
    action: "codeBlock"
  },
  {
    icon: LinkIcon,
    label: "Link",
    action: "link"
  },
  {
    icon: ImageIcon,
    label: "Image",
    action: "image"
  },
  {
    icon: TemplateIcon,
    label: "Template",
    action: "template"
  },
  {
    icon: FootnoteIcon,
    label: "Footnote",
    action: "footnote"
  },
  {
    icon: ListOrderedIcon,
    label: "Ordered List",
    action: "orderedList"
  },
  {
    icon: ListIcon,
    label: "Unordered List",
    action: "unorderedList"
  },
  {
    icon: HrIcon,
    label: "Horizontal Rule",
    action: "horizontalRule"
  },
  {
    icon: TableIcon,
    label: "Table",
    action: "table"
  },
];

export function EditorToolbar({ mode, onCommand, onUndo, onRedo, canUndo, canRedo, onModeSwitch }) {
  return (
    <div className="bg-white sticky top-0 z-10 border-b">
      <TooltipProvider>
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {recordMXToolbarBlocks.map((block, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => block.action && onCommand(block.action)}
                  className="p-2 hover:bg-blue-50 rounded transition flex-shrink-0"
                >
                  {block.icon && <block.icon className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{block.label}</TooltipContent>
            </Tooltip>
          ))}
          
        </div>
      </TooltipProvider>
    </div>
  );
}