//imports 
import { useState, useEffect, useCallback } from 'react';
import toolbarBlocks from '@/lib/editor/toolbarConfig'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fai } from '@/components/Fontawesome'
export default function Editor(
{
  editor_mode = 'visual',
  record_name = ''
}) {
  // state management 
  const [editorMode, setEditorMode] = useState('visual')
  const [ActiveAction, setActiveAction] = useState(null)
  
  
  // Validate record_name
  useEffect(() => {
    callCommand(ActiveAction);
  }, [ActiveAction])
  //
  useEffect(() => {
    if (!record_name || record_name.trim() === '') {
      console.error('Record name is required');
    }
  }, [record_name])
  
  // Update editor mode when prop changes
  useEffect(() => {
    if (editor_mode.toLowerCase() !== editorMode.toLowerCase()) {
      setEditorMode(editor_mode)
    }
  }, [editorMode, editor_mode])
  
  const handlePublish = useCallback(() => {
    // Add publish logic here
    console.log('Publishing...');
  }, []);
  
  const callCommand = useCallback(()=>{
    
  },[ActiveAction])
  return (
    <div className = 'w-full h-full bg-white'>
      <div className = 'flex items-center justify-between'>
        <h1 className="text-xl font-bold">{record_name || 'Untitled'}</h1>
      </div>
      <div className = 'flex items-center justify-between'>
        <div className = 'flex items-center justify-between'>
          {toolbarBlocks[0].map((blocks, i) => {
            if (blocks.items) {
              const subItems = blocks.items;
              return (
                <Select key={`toolbar-${i}`}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={blocks.label || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {subItems.map((item, j) => (
                      <SelectItem key={`item-${i}-${j}`} value={item.value || item.label}>
                        <Fai icon = {item.icon} style  = 'fas'/>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            return (
              <>
                <button className = {` bg-none border-y-none border-x ${blocks.action === ActiveAction ? 'text-blue-600' : 'text-gray-800'} `} onClick = {()=>{
                  if (blocks.action &&  blocks.action!==ActiveAction) {
                    setActiveAction(blocks.action)
                  }
                }}>
                  <Fai icon = {blocks.icon} style = {'fas'}/>
                </button>
              </>
            );
          })}
        </div>
        <div className ='flex items-center justify-end border-l'>
          <button 
            className = 'px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transition-colors'
            onClick={handlePublish}
          >
            {"Publish"}
          </button>
        </div>
      </div>
    </div>
  )
}