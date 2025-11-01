import { createEditor } from "lexical";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $generateHtmlFromNodes } from "@lexical/html";

export function convertMarkdownToHtmlOnce(markdown) {
  const editor = createEditor();
  let html = "";
  
  editor.update(() => {
    $convertFromMarkdownString(markdown, TRANSFORMERS);
    html = $generateHtmlFromNodes(editor);
  });
  
  return html;
}