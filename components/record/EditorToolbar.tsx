import { toolbarBlocks } from "@/lib/editor/toolbarConfig";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function EditorToolbar({ mode, onCommand, onUndo, onRedo, canUndo, canRedo, onModeSwitch }) {
  return (
    <div className="bg-white sticky top-[73px] z-10 border-b">
      <TooltipProvider>
        <div className="flex items-center gap-1 p-2 overflow-x-auto">
          {toolbarBlocks.map((block, i) =>
            !block.name ? (
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
            ) : (
              <Select
                key={i}
                onValueChange={value => {
                  if (value && block.items) {
                    const item = block.items.find(itm => itm.action === value);
                    onCommand(value, ...(item?.args || []));
                  }
                }}
              >
                <SelectTrigger className="w-[150px] h-9 text-sm flex-shrink-0">
                  <SelectValue placeholder={block.name} />
                </SelectTrigger>
                <SelectContent>
                  {block.items?.map((item, idx) => (
                    <SelectItem key={idx} value={item.action}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}
          <button disabled={!canUndo} onClick={onUndo} className="p-2">Undo</button>
          <button disabled={!canRedo} onClick={onRedo} className="p-2">Redo</button>
          <button onClick={onModeSwitch} className="p-2">Mode: {mode}</button>
        </div>
      </TooltipProvider>
    </div>
  );
}