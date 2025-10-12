import { useState } from 'react';

export function useEditorHistory(
  content: string,
  setContent: (val: string) => void,
  limit = 50
) {
  const [history, setHistory] = useState < string[] > ([content]);
  const [index, setIndex] = useState(0);
  
  const addToHistory = (val: string) => {
    setHistory(prev => {
      const newHistory = [...prev.slice(0, index + 1), val].slice(-limit);
      setIndex(newHistory.length - 1);
      return newHistory;
    });
  };
  
  const undo = () => {
    setIndex(i => {
      const newIndex = Math.max(i - 1, 0);
      setContent(history[newIndex]);
      return newIndex;
    });
  };
  
  const redo = () => {
    setIndex(i => {
      const newIndex = Math.min(i + 1, history.length - 1);
      setContent(history[newIndex]);
      return newIndex;
    });
  };
  
  return { history, addToHistory, undo, redo };
}