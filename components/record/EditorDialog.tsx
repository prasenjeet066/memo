import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function EditorDialog({ open, type, data, selection, onClose, onSubmit, editorMode, ref }) {
  // Local state for dialog fields
  const [fields, setFields] = useState(data || {});
  
  useEffect(() => {
    setFields(data || {});
  }, [data, type]);
  
  function handleFieldChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }
  
  function handleDialogSubmit() {
    onSubmit(fields);
    onClose();
  }
  
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className ='bg-white rounded'>
        <DialogHeader>
          <DialogTitle>{type?.toUpperCase()}</DialogTitle>
        </DialogHeader>
        {/* Render dialog fields based on type */}
        {type === "link" && (
          <>
            <Label>Text</Label>
            <Input name="text" value={fields.text ?? selection ?? ""} onChange={handleFieldChange} />
            <Label>URL</Label>
            <Input name="url" value={fields.url ?? ""} onChange={handleFieldChange} />
          </>
        )}
        {type === "image" && (
          <>
            <Label>Alt Text</Label>
            <Input name="alt" value={fields.alt ?? selection ?? ""} onChange={handleFieldChange} />
            <Label>Source URL</Label>
            <Input name="src" value={fields.src ?? ""} onChange={handleFieldChange} />
          </>
        )}
        {type === "codeBlock" && (
          <>
            <Label>Language</Label>
            <Input name="language" value={fields.language ?? ""} onChange={handleFieldChange} />
            <Label>Code</Label>
            <Input name="code" value={fields.code ?? selection ?? ""} onChange={handleFieldChange} />
          </>
        )}
        {type === "template" && (
          <>
            <Label>Template Name</Label>
            <Input name="name" value={fields.name ?? ""} onChange={handleFieldChange} />
            <Label>Params (key=value, space separated)</Label>
            <Input name="params" value={fields.params ?? ""} onChange={handleFieldChange} />
          </>
        )}
        {type === "footnote" && (
          <>
            <Label>ID</Label>
            <Input name="id" value={fields.id ?? ""} onChange={handleFieldChange} />
            <Label>Text</Label>
            <Input name="text" value={fields.text ?? selection ?? ""} onChange={handleFieldChange} />
          </>
        )}
        {/* Add more types as needed */}
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleDialogSubmit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}