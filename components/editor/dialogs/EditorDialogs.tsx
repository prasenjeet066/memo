// Editor Dialog Components

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Fai } from '@/components/Fontawesome';
import { LexicalEditor } from 'lexical';
import { $getSelection, $isRangeSelection, $createTextNode } from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $generateNodesFromDOM } from '@lexical/html';
import { INSERT_IMAGE_COMMAND } from '@/components/utils/editor/nodes/ImageNode';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  LinkDialogState,
  CitationDialogState,
  ImageDialogState,
  VideoDialogState,
  FindReplaceDialogState,
  PublishDialogState,
  PublishStatus,
} from '@/types/editor.types';

// Link Dialog
interface LinkDialogProps {
  state: LinkDialogState;
  setState: (state: LinkDialogState) => void;
  editorRef: React.MutableRefObject < LexicalEditor | null > ;
}

export function LinkDialog({ state, setState, editorRef }: LinkDialogProps) {
  const [url, setUrl] = useState('');
  
  const handleInsert = () => {
    if (url && editorRef.current) {
      editorRef.current.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(url);
          const textNode = $createTextNode(selection.getTextContent() || 'Link');
          linkNode.append(textNode);
          selection.insertNodes([linkNode]);
        }
      });
    }
    setState({ open: false, text: '' });
    setUrl('');
  };
  
  return (
    <Dialog open={state.open} onOpenChange={(open) => setState({ open, text: '' })}>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>Enter the URL for the link</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setState({ open: false, text: '' })}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Citation Dialog
interface CitationDialogProps {
  state: CitationDialogState;
  setState: (state: CitationDialogState) => void;
  onAddCitation: (citation: any) => void;
}

export function CitationDialog({ state, setState, onAddCitation }: CitationDialogProps) {
  const handleAdd = () => {
    if (state.author) {
      const date = new Date().toLocaleDateString();
      onAddCitation({
        text: state.author,
        author: state.author,
        title: state.title || '',
        url: state.url || '',
        date,
      });
      setState({ open: false, author: '', title: '', url: '', date: '' });
    }
  };
  
  return (
    <Dialog open={state.open} onOpenChange={(open) => 
      setState({ open, author: '', title: '', url: '', date: '' })
    }>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Add Citation</DialogTitle>
          <DialogDescription>Enter citation details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cite-author">Author *</Label>
            <Input
              id="cite-author"
              placeholder="Author name"
              value={state.author}
              onChange={(e) => setState({ ...state, author: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cite-title">Title</Label>
            <Input
              id="cite-title"
              placeholder="Title of work"
              value={state.title}
              onChange={(e) => setState({ ...state, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cite-url">URL</Label>
            <Input
              id="cite-url"
              placeholder="https://example.com"
              value={state.url}
              onChange={(e) => setState({ ...state, url: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => 
            setState({ open: false, author: '', title: '', url: '', date: '' })
          }>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Citation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Image Dialog
interface ImageDialogProps {
  state: ImageDialogState;
  setState: (state: ImageDialogState) => void;
  editorRef: React.MutableRefObject < LexicalEditor | null > ;
}

export function ImageDialog({ state, setState, editorRef }: ImageDialogProps) {
  const [url, setUrl] = useState('');
  
  const handleInsert = () => {
    if (url && editorRef.current) {
      editorRef.current.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: url,
        altText: "Image",
        width: "100%",
        height: "auto",
      });
    }
    setState({ open: false, url: '' });
    setUrl('');
  };
  
  return (
    <Dialog open={state.open} onOpenChange={(open) => setState({ open, url: '' })}>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>Enter the image URL</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setState({ open: false, url: '' })}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Video Dialog
interface VideoDialogProps {
  state: VideoDialogState;
  setState: (state: VideoDialogState) => void;
  editorRef: React.MutableRefObject < LexicalEditor | null > ;
}

export function VideoDialog({ state, setState, editorRef }: VideoDialogProps) {
  const [url, setUrl] = useState('');
  
  const handleInsert = () => {
    if (url && editorRef.current) {
      editorRef.current.update(() => {
        const parser = new DOMParser();
        const iframeHtml = `<iframe width="560" height="315" src="${encodeURI(url)}" frameborder="0" allowfullscreen></iframe>`;
        const dom = parser.parseFromString(iframeHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editorRef.current!, dom);
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes(nodes);
        }
      });
    }
    setState({ open: false, url: '' });
    setUrl('');
  };
  
  return (
    <Dialog open={state.open} onOpenChange={(open) => setState({ open, url: '' })}>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Insert Video</DialogTitle>
          <DialogDescription>Enter the video URL (YouTube/Vimeo embed URL)</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.youtube.com/embed/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setState({ open: false, url: '' })}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Table Dialog
interface TableDialogProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  editorRef: React.MutableRefObject < LexicalEditor | null > ;
}

export function TableDialog({ isOpen, setIsOpen, editorRef }: TableDialogProps) {
  const [rows, setRows] = useState('5');
  const [columns, setColumns] = useState('5');
  const [isDisabled, setIsDisabled] = useState(true);
  
  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);
    setIsDisabled(!(row > 0 && row <= 500 && column > 0 && column <= 50));
  }, [rows, columns]);
  
  const onClick = () => {
    editorRef.current?.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: String(columns),
      includeHeaders: true,
      rows: String(rows),
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="number"
            placeholder="# of rows (1-500)"
            value={rows}
            onChange={(e) => setRows(e.currentTarget.value)}
            aria-label="Rows"
          />
          <Input
            type="number"
            placeholder="# of columns (1-50)"
            value={columns}
            onChange={(e) => setColumns(e.currentTarget.value)}
            aria-label="Columns"
          />
        </div>
        <DialogFooter>
          <Button disabled={isDisabled} onClick={onClick}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Find Replace Dialog
interface FindReplaceDialogProps {
  state: FindReplaceDialogState;
  setState: (state: FindReplaceDialogState) => void;
  onFindReplace: (find: string, replace: string, replaceAll: boolean) => void;
}

export function FindReplaceDialog({ state, setState, onFindReplace }: FindReplaceDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={(open) => 
      setState({ open, find: '', replace: '' })
    }>
      <DialogContent className='rounded bg-white'>
        <DialogHeader>
          <DialogTitle>Find and Replace</DialogTitle>
          <DialogDescription>Search and replace text in the document</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="find-text">Find</Label>
            <Input
              id="find-text"
              placeholder="Text to find"
              value={state.find}
              onChange={(e) => setState({ ...state, find: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="replace-text">Replace with</Label>
            <Input
              id="replace-text"
              placeholder="Replacement text"
              value={state.replace}
              onChange={(e) => setState({ ...state, replace: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => 
            setState({ open: false, find: '', replace: '' })
          }>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => {
            if (state.find) {
              onFindReplace(state.find, state.replace, false);
              setState({ open: false, find: '', replace: '' });
            }
          }}>
            Replace
          </Button>
          <Button onClick={() => {
            if (state.find) {
              onFindReplace(state.find, state.replace, true);
              setState({ open: false, find: '', replace: '' });
            }
          }}>
            Replace All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Publish Dialog
interface PublishDialogProps {
  state: PublishDialogState;
  setState: (state: PublishDialogState) => void;
  publishStatus: PublishStatus | null;
  onPublish: (summary: string) => void;
}

export function PublishDialog({ state, setState, publishStatus, onPublish }: PublishDialogProps) {
  const [localSummary, setLocalSummary] = useState('');
  
  const handlePublish = () => {
    if (!localSummary.trim()) {
      alert('Please enter an edit summary');
      return;
    }
    onPublish(localSummary);
    setLocalSummary('');
  };
  
  return (
    <Dialog 
      open={state.open} 
      onOpenChange={(open) => {
        if (!open) setState({ open: false, summary: '' });
      }}
    >
      <DialogContent className='rounded-lg bg-white max-w-md'>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Publish Article</DialogTitle>
          <DialogDescription className="text-gray-600">
            Describe your changes before publishing
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-summary" className="font-medium">
              Edit Summary
            </Label>
            <Textarea
              id="edit-summary"
              className='rounded bg-gray-50'
              placeholder="e.g., Added new section on methodology, fixed typos, updated references..."
              value={localSummary}
              onChange={(e) => setLocalSummary(e.target.value)}
              rows={4}
              disabled={publishStatus?.type === 'loading'}
            />
            <p className="text-xs text-gray-500">
              {localSummary.length}/500 characters
            </p>
          </div>

          {publishStatus && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              publishStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
              publishStatus.type === 'success' ? 'bg-green-50 text-green-700' :
              publishStatus.type === 'error' ? 'bg-red-50 text-red-700' : ''
            }`}>
              {publishStatus.type === 'loading' && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              )}
              {publishStatus.type === 'success' && (
                <Fai icon="check-circle" className="text-green-600" />
              )}
              {publishStatus.type === 'error' && (
                <Fai icon="exclamation-circle" className="text-red-600" />
              )}
              <span className="text-sm font-medium">{publishStatus.message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setState({ open: false, summary: '' })}
            className='rounded-full border-gray-300'
            disabled={publishStatus?.type === 'loading'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePublish}
            className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6'
            disabled={!localSummary.trim() || publishStatus?.type === 'loading'}
          >
            {publishStatus?.type === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Fai icon='arrow-right' className='mr-2'/>
                Publish Article
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent> 
      </Dialog>
  );
}