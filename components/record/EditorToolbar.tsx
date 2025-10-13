import { useState, useEffect } from "react";
import { Fai } from '@/components/Fontawesome';
import { toolbarBlocks } from "@/lib/editor/toolbarConfig";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function EditorToolbar({ onCommand, onModeSwitch, handleSave, editorMode }) {
  const [selected, setSelected] = useState({});
  
  useEffect(() => {
    if (editorMode) {
      onModeSwitch?.(editorMode);
    }
  }, [editorMode, onModeSwitch]);
  
  return (
    <div className="bg-white sticky top-0 z-10 border-b flex items-center justify-between px-2 py-1">
      <TooltipProvider>
        <div className="flex items-center gap-1 overflow-x-auto flex-wrap">
          {toolbarBlocks.flat().map((block, i) =>
            block.name ? (
              <Select
                key={i}
                value={selected[i] || ""}
                onValueChange={(value) => {
                  setSelected((prev) => ({ ...prev, [i]: value }));
                  if (value && block.items) {
                    const item = block.items.find((itm) => itm.action === value);
                    if (item) {
                      onCommand(value, ...(item?.args || []));
                    }
                  }
                  // Reset after selection
                  setTimeout(() => {
                    setSelected((prev) => ({ ...prev, [i]: "" }));
                  }, 100);
                }}
              >
                <SelectTrigger className="min-w-[100px] max-w-[180px] w-auto h-9 bg-gray-50 text-sm flex-shrink-0 border-none">
                  <SelectValue placeholder={block.name} />
                </SelectTrigger>
                <SelectContent className="max-h-[400px] overflow-y-auto">
                  {block.items?.map((item, idx) => (
                    <SelectItem key={idx} value={item.action}>
                      <div className="flex items-center w-full gap-2 justify-start p-1">
                        <Fai style="far" icon={item.icon} className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => block.action && onCommand(block.action)}
                    className="p-2 hover:bg-blue-50 rounded transition flex-shrink-0 h-9 w-9 flex items-center justify-center"
                    aria-label={block.label}
                  >
                    {block.icon && <Fai style="far" icon={block.icon} className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{block.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </TooltipProvider>

      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <Select
          value={editorMode || "visual"}
          onValueChange={(value) => onModeSwitch?.(value)}
        >
          <SelectTrigger className="min-w-[120px] w-auto h-9 bg-gray-50 text-sm border-none">
            <SelectValue placeholder="Editor Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visual">
              <div className="flex items-center w-full gap-2 justify-start p-1">
                <Fai style="far" icon="pen" className="h-4 w-4" />
                <span>Visual</span>
              </div>
            </SelectItem>
            <SelectItem value="recordmx">
              <div className="flex items-center w-full gap-2 justify-start p-1">
                <Fai style="far" icon="code" className="h-4 w-4" />
                <span>RecordMX</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition font-medium"
          onClick={handleSave}
        >
          Publish
        </button>
      </div>
    </div>
  );
}