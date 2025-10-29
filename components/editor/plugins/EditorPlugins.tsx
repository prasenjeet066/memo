// Editor Plugins

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalEditor } from 'lexical';
import { FORMAT_TEXT_COMMAND, COMMAND_PRIORITY_EDITOR } from 'lexical';

// Custom Commands Plugin
interface CustomCommandsPluginProps {
  onCommand: (command: string) => void;
}

export function CustomCommandsPlugin({ onCommand }: CustomCommandsPluginProps) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (payload) => {
        onCommand('format');
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, onCommand]);
  
  return null;
}

// HTML Import/Export Plugin
interface HtmlPluginProps {
  initialHtml?: string;
  onHtmlChange: (html: string) => void;
}

export function HtmlPlugin({ initialHtml, onHtmlChange }: HtmlPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isInitialized = useRef(false);
  
  useEffect(() => {
    if (initialHtml && !isInitialized.current) {
      isInitialized.current = true;
      editor.update(() => {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(initialHtml, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          nodes.forEach(node => root.append(node));
        } catch (error) {
          console.error('Error loading initial HTML:', error);
        }
      });
    }
  }, [editor, initialHtml]);
  
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          try {
            const html = $generateHtmlFromNodes(editor);
            onHtmlChange(html);
          } catch (error) {
            console.error('Error generating HTML:', error);
          }
        });
      }}
    />
  );
}

// Editor ref plugin to expose editor instance
interface EditorRefPluginProps {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}

export function EditorRefPlugin({ editorRef }: EditorRefPluginProps) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);
  
  return null;
}