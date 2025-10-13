// Professional toolbar grouping for visual mode only
export const toolbarBlocks = [
  // --- Text Formatting ---
  {
    name: "Formatting",
    items: [
      { icon: "bold", action: "bold", label: "Bold (Ctrl+B)" },
      { icon: "italic", action: "italic", label: "Italic (Ctrl+I)" },
      { icon: "underline", action: "underline", label: "Underline (Ctrl+U)" },
      { icon: "strikethrough", action: "strikethrough", label: "Strikethrough" },
      { icon: "superscript", action: "superscript", label: "Superscript" },
      { icon: "subscript", action: "subscript", label: "Subscript" },
      { icon: "code", action: "inlineCode", label: "Inline Code" },
      { icon: "eraser", action: "clearFormatting", label: "Clear Formatting" }
    ]
  },
  // --- Paragraph/Structure ---
  {
    name: "Paragraph",
    items: [
      { icon: "heading", action: "heading", label: "Heading 2", args: [2] },
      { icon: "heading", action: "heading", label: "Heading 3", args: [3] },
      { icon: "heading", action: "heading", label: "Heading 4", args: [4] },
      { icon: "list-ul", action: "unorderedList", label: "Bullet List" },
      { icon: "list-ol", action: "orderedList", label: "Numbered List" },
      { icon: "minus", action: "horizontalRule", label: "Horizontal Line" },
    ]
  },
  // --- Insert ---
  {
    name: "Insert",
    items: [
      { icon: "link", action: "link", label: "Link (Ctrl+K)" },
      { icon: "image", action: "image", label: "Image" },
      { icon: "video", action: "video", label: "Video" },
      { icon: "file-code", action: "codeBlock", label: "Code Block" },
      { icon: "square-root-variable", action: "math", label: "Math Formula" },
      { icon: "table", action: "table", label: "Table" },
      { icon: "puzzle-piece", action: "template", label: "Template" },
      { icon: "file-alt", action: "reference", label: "Reference / Citation" }
    ]
  },
  // --- Utility ---
  {
    name: "Utility",
    items: [
      { icon: "undo", action: "undo", label: "Undo" },
      { icon: "redo", action: "redo", label: "Redo" }
    ]
  }
];