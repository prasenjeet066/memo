import { useState, useEffect } from "react";
import { Fai } from '@/components/Fontawesome'
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
import { Pen, Code } from "lucide-react";

/**
 * Responsive EditorToolbar.
 * - Scrollable horizontally on mobile.
 * - Smaller icons/text on mobile.
 */
export function EditorToolbar({ onCommand, onModeSwitch, handleSave, editorMode, isMobile }) {
  const [selected, setSelected] = useState({});
  const [mode, setMode] = useState(editorMode ?? "visual");
  
  useEffect(() => {
    if (mode) {
      onModeSwitch(mode);
    }
  }, [mode, onModeSwitch]);
  
  return (
    <div
      className={
        isMobile
          ? "bg-white sticky top-0 z-10 border-b flex flex-wrap items-center justify-between px-1 py-1"
          : "bg-white sticky top-0 z-10 border-b flex items-center justify-between"
      }
      style={{ overflowX: isMobile ? "auto" : undefined, minHeight: isMobile ? "44px" : undefined }}
    >
      <TooltipProvider>
        <div
          className={
            isMobile
              ? "flex items-center gap-1 overflow-x-auto flex-nowrap w-full pb-1"
              : "flex items-center gap-1 overflow-x-auto"
          }
        >
          {toolbarBlocks.flat().map((block, i) =>
            block.name ? (
              <Select
                key={i}
                value={selected[i] || ""}
                onValueChange={(value) => {
                  setSelected((prev) => ({ ...prev, [i]: value }));
                  if (value && block.items) {
                    const item = block.items.find((itm) => itm.action === value);
                    onCommand(value, ...(item?.args || []));
                  }
                }}
              >
                <SelectTrigger
                  className={
                    isMobile
                      ? "min-w-[80px] max-w-[120px] w-auto h-8 bg-gray-50 text-xs flex-shrink-0 border-none border-l border-r border-gray-500 z-10"
                      : "min-w-[100px] max-w-[180px] w-auto h-full bg-gray-50 text-sm flex-shrink-0 border-none border-l border-r border-gray-500 z-10"
                  }
                >
                  <SelectValue placeholder={block.name} />
                </SelectTrigger>
                <SelectContent className="divide-y">
                  {block.items?.map((item, idx) => (
                    <SelectItem key={idx} value={item.action}>
                      <div className="flex items-center w-full gap-2 justify-start p-1">
                        <Fai style ='far' icon = {item.icon} className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                        <span className={isMobile ? "text-xs" : ""}>{item.label}</span>
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
                    className={isMobile ? "p-1 hover:bg-blue-50 rounded transition flex-shrink-0" : "p-2 hover:bg-blue-50 rounded transition flex-shrink-0"}
                  >
                    {block.icon && <Fai style ='far' icon = {block.icon} className={isMobile ? "h-3 w-3" : "h-4 w-4"} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className={isMobile ? "text-xs" : ""}>{block.label}</span>
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </TooltipProvider>

      <div className={isMobile ? "flex items-center gap-2 ml-2" : "flex items-center gap-2 ml-4"}>
        <Select
          value={mode}
          onValueChange={setMode}
        >
          <SelectTrigger className={isMobile ? "min-w-[80px] max-w-[120px] h-8 bg-gray-50 text-xs flex-shrink-0 border-none border-l border-r border-gray-500 z-10" : "min-w-[100px] max-w-[180px] w-auto h-full bg-gray-50 text-sm flex-shrink-0 border-none border-l border-r border-gray-500 z-10"}>
            <SelectValue placeholder="Editor Mode" />
          </SelectTrigger>
          <SelectContent className="divide-y">
            <SelectItem value="visual">
              <div className="flex items-center w-full gap-2 justify-start p-1">
                <Fai style='far' icon= 'pen' className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                <span className={isMobile ? "text-xs" : ""}>Visual</span>
              </div>
            </SelectItem>
            <SelectItem value="recordmx">
              <div className="flex items-center w-full gap-2 justify-start p-1">
                <Fai style='far' icon= 'code' className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                <span className={isMobile ? "text-xs" : ""}>RecordMX</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <button
          className={isMobile ? "border-l px-2 bg-gray-800 py-1 text-white text-xs rounded" : "border-l px-4 bg-gray-800 p-2 text-white text-sm"}
          style={{ minWidth: isMobile ? "60px" : "80px" }}
          onClick={handleSave}
        >
          Publish
        </button>
      </div>
    </div>
  );
}