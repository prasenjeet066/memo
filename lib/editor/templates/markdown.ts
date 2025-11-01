import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";

/**
 * Converts Markdown text to HTML using Lexical (server-side).
 * Works in Next.js Server Actions, Server Components, or build-time functions.
 */
export async function markdownToHtml(markdownText) {
  if (!markdownText) return "";

  const editor = createHeadlessEditor({
    namespace: "EnhancedEditor",
    nodes: [], // You can add extra Lexical nodes if you want
  });

  // Convert markdown → Lexical nodes
  editor.update(() => {
    $convertFromMarkdownString(markdownText, TRANSFORMERS);
  });

  // Read editor state → HTML
  const html = editor.getEditorState().read(() => {
    return $generateHtmlFromNodes(editor);
  });

  return html;
}