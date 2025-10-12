import { useState, useCallback } from 'react';

export function useEditorHistory(
  initialContent: string,
  setContent: (val: string) => void,
  limit = 50
) {
  const [history, setHistory] = useState < string[] > ([initialContent]);
  const [index, setIndex] = useState(0);
  
  const addToHistory = useCallback((val: string) => {
    setHistory(prev => {
      // Don't add if it's the same as current
      if (prev[index] === val) return prev;
      
      const newHistory = [...prev.slice(0, index + 1), val].slice(-limit);
      setIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [index, limit]);
  
  const undo = useCallback(() => {
    if (index > 0) {
      const newIndex = index - 1;
      setIndex(newIndex);
      setContent(history[newIndex]);
    }
  }, [index, history, setContent]);
  
  const redo = useCallback(() => {
    if (index < history.length - 1) {
      const newIndex = index + 1;
      setIndex(newIndex);
      setContent(history[newIndex]);
    }
  }, [index, history, setContent]);
  
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;
  
  return { history, addToHistory, undo, redo, canUndo, canRedo };
}