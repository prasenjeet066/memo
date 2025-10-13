import { useState } from "react";

export const saveCursorPosition = (el: HTMLElement) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return { node: range.startContainer, offset: range.startOffset };
};

export const restoreCursorPosition = (el: HTMLElement, position: any) => {
  if (!position || !position.node) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return;
  }
  try {
    const range = document.createRange();
    range.setStart(position.node, Math.min(position.offset, position.node.textContent?.length || 0));
    range.collapse(true);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch (e) {
    el.focus();
  }
};

export function useEditorHistory(initialText: string, setText: (text: string) => void) {
  const [history, setHistory] = useState([initialText]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const addToHistory = (text: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== text) {
        newHistory.push(text);
        if (newHistory.length > 50) newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
    }
  };
  
  return { history, historyIndex, addToHistory, handleUndo, handleRedo };
}