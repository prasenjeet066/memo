import { useState } from "react";
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

export function EditorToolbar({ onCommand , handleSave}) {
  // Track selected value for each dropdown by its index
  const [selected, setSelected] = useState({});
  
  return (
    <div className="bg-white sticky top-0 z-10 border-b flex items-center justify-between">
      <TooltipProvider>
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
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
                <SelectTrigger className="w-[140px] h-9 text-sm flex-shrink-0 border-none border-l border-r border-gray-500 z-10">
                  <SelectValue placeholder={block.name} />
                </SelectTrigger>
                <SelectContent className='divide-y'>
                  {block.items?.map((item, idx) => (
                    <SelectItem key={idx} value={item.action}>
                      <div className="flex items-center w-full gap-2 justify-start p-1">
                        <item.icon className="h-4 w-4" />
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
                    {block.icon && <block.icon className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{block.label}</TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </TooltipProvider>
      <div className='flex items-center justify-end'>
         <button className='border-l px-4 bg-gray-800 text-white text-sm' onClick={handleSave}>
            Publish
          </button>
      </div>
    </div>
  );
}