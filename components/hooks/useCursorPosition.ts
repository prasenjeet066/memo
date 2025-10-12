import { RefObject } from 'react';

export function useCursorPosition(editorRef: RefObject<HTMLDivElement>) {
  const saveCursor = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    
    try {
      return selection.getRangeAt(0).cloneRange();
    } catch (e) {
      return null;
    }
  };
  
  const restoreCursor = (range?: Range | null) => {
    if (!range) return;
    
    try {
      const selection = window.getSelection();
      if (!selection) return;
      
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      console.warn('Failed to restore cursor position:', e);
    }
  };
  
  return { saveCursor, restoreCursor };
}