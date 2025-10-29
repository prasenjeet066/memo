// Editor Status Bar Component

import { AutoSaveStatus } from '@/types/editor.types';

interface EditorStatusBarProps {
  wordCount: number;
  characterCount: number;
  readingTime: number;
  autoSaveStatus: AutoSaveStatus;
}

export function EditorStatusBar({
  wordCount,
  characterCount,
  readingTime,
  autoSaveStatus,
}: EditorStatusBarProps) {
  return (
    <div className="flex items-center w-full p-2 gap-2 text-xs text-gray-500">
      <span className='p-2 border-r'>{wordCount} words</span>
      <span className='p-2 border-r'>{characterCount} characters</span>
      <span className='p-2 border-r'>{readingTime} min read</span>
    
      <span className={`font-medium ${
        autoSaveStatus === 'saved' ? 'text-green-600' : 
        autoSaveStatus === 'saving' ? 'text-yellow-600' : 
        'text-gray-400'
      }`}>
        {autoSaveStatus === 'saved' ? 'Saved' : 
         autoSaveStatus === 'saving' ? 'Saving...' : 
         'Unsaved'}
      </span>
    </div>
  );
}