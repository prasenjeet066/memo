import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function EditorDialog({ open, type, data, selection, onClose, onSubmit, editorMode, ref }) {
  // Render dialog fields per block type
  // You can split block-specific dialog logic into small sub-components if needed
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className= 'bg-white border-none'>
        <DialogHeader>
          <DialogTitle>{type}</DialogTitle>
        </DialogHeader>
        {/* Render dialog fields based on type */}
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(data)}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}