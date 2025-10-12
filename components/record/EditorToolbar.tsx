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
import { Pen, Code } from "lucide-react"; // assuming you use lucide icons

export function EditorToolbar({ onCommand, handleSave }) {
  const [selected, setSelected] = useState({});
  const [editorMode, setEditorMode] = useState("visual");
  useEffect(()=>{
    if (editorMode) {
      onModeSwitch(editorMode)
    }
  },[editorMode])
  return (
    <div className="bg-white sticky top-0 z-10 border-b flex items-center justify-between px-2">
      <TooltipProvider>
        <div className="flex items-center gap-1 overflow-x-auto">
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
                <SelectTrigger className="min-w-[100px] max-w-[180px] w-auto h-full bg-gray-50 text-sm flex-shrink-0 border-none border-l border-r border-gray-500 z-10">
                  <SelectValue placeholder={block.name} />
                </SelectTrigger>
                <SelectContent className="divide-y">
                  {block.items?.map((item, idx) => (
                    <SelectItem key={idx} value={item.action}>
                      <div className="flex items-center w-full gap-2 justify-start p-1">
                        <Fai style ='far' icon = {item.icon} className="h-4 w-4" />
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
                    className="p-2 hover:bg-blue-50 rounded transition flex-shrink-0"
                  >
                    {block.icon && <Fai style ='far' icon = {block.icon} className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{block.label}</TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </TooltipProvider>

      <div className="flex items-center gap-2 ml-4">
        <Select
          value={editorMode}
          onValueChange={(value) => setEditorMode(value)}
        >
          <SelectTrigger className="min-w-[100px] max-w-[180px] w-auto h-full bg-gray-50 text-sm flex-shrink-0 border-none border-l border-r border-gray-500 z-10">
            <SelectValue placeholder="Editor Mode" />
          </SelectTrigger>
          <SelectContent className="divide-y">
            <SelectItem value="visual">
              <div className="flex items-center w-full gap-2 justify-start p-1">
                <Fai style='far' icon= 'pen' className="h-4 w-4" />
                <span>Visual</span>
              </div>
            </SelectItem>
            <SelectItem value="recordmx">
              <div className="flex items-center w-full gap-2 justify-start p-1">
<Fai style='far' icon= 'code' className="h-4 w-4" />
                <span>RecordMX</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <button
          className="border-l px-4 bg-gray-800 p-2 text-white text-sm"
          onClick={handleSave}
        >
          Publish
        </button>
      </div>
    </div>
  );
}