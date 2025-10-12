import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Video,
  FileCode,
  Sigma,
  List,
  ListOrdered,
  Table,
  Minus,
  Superscript,
  Subscript,
  Type,
  FileText,
  ListChecks,
  Puzzle
} from "lucide-react";

export const toolbarBlocks = [
  [
    { icon: Bold, action: "bold", label: "Bold (Ctrl+B)" },
    { icon: Italic, action: "italic", label: "Italic (Ctrl+I)" },
    { icon: Type, action: "boldItalic", label: "Bold Italic" },
    { icon: Underline, action: "underline", label: "Underline (Ctrl+U)" },
    { icon: Strikethrough, action: "strikethrough", label: "Strikethrough" },
    {
      name: "Paragraph",
      items: [
        { icon: Heading1, action: "heading", label: "Heading 2", args: [2] },
        { icon: Heading2, action: "heading", label: "Heading 3", args: [3] },
        { icon: Heading3, action: "heading", label: "Heading 4", args: [4] },
        { icon: List, action: "unorderedList", label: "Bullet List" },
        { icon: ListOrdered, action: "orderedList", label: "Numbered List" },
        { icon: Minus, action: "horizontalRule", label: "Horizontal Line" },
      ],
    },
    { icon: Code, action: "inlineCode", label: "Inline Code" },
    { icon: Link, action: "link", label: "Link (Ctrl+K)" },
    {
      name: "Insert",
      items: [
        { icon: Image, action: "image", label: "Image" },
        { icon: Video, action: "video", label: "Video" },
        { icon: FileCode, action: "codeBlock", label: "Code Block" },
        { icon: Sigma, action: "math", label: "Math" },
        { icon: Table, action: "table", label: "Table" },
        { icon: Puzzle, action: "template", label: "Template" },
      ],
    },
    { icon: Superscript, action: "superscript", label: "Superscript" },
    { icon: Subscript, action: "subscript", label: "Subscript" },
    { icon: FileText, action: "reference", label: "Reference" },
    { icon: ListChecks, action: "refList", label: "Reference List" },
  ]
];