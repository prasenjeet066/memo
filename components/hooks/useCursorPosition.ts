import { RefObject } from 'react';

export function useCursorPosition(editorRef: RefObject < HTMLDivElement > ) {
  const saveCursor = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    return selection.getRangeAt(0);
  };
  
  const restoreCursor = (range ? : Range | null) => {
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };
  
  return { saveCursor, restoreCursor };
}