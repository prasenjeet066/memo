import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, { useEffect } from "react";
import {
  $createImageNode,
  ImageNode,
  INSERT_IMAGE_COMMAND,
  InsertImagePayload,
} from "#/components/utils/editor/nodes/ImageNode";
import { $getSelection } from "lexical";

export function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImageNode not registered on editor");
    }
    
    return editor.registerCommand < InsertImagePayload > (
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        editor.update(() => {
          const selection = $getSelection();
          if (selection) selection.insertNodes([imageNode]);
        });
        return true;
      },
      0
    );
  }, [editor]);
  
  return null;
}