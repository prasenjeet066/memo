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
import { Fai } from '@/components/Fontawesome'
export const toolbarBlocks = [
  [
    { icon: "bold", action: "bold", label: "Bold (Ctrl+B)" },
    { icon: "italic", action: "italic", label: "Italic (Ctrl+I)" },
    { icon: "italic", action: "boldItalic", label: "Bold Italic" },
    { icon: "underline", action: "underline", label: "Underline (Ctrl+U)" },
    { icon: "strikethrough", action: "strikethrough", label: "Strikethrough" },
    
    {
      name: "Paragraph",
      items: [
        { icon: "heading", action: "heading", label: "Heading 2", args: [2] },
        { icon: "heading", action: "heading", label: "Heading 3", args: [3] },
        { icon: "heading", action: "heading", label: "Heading 4", args: [4] },
        { icon: "list-ul", action: "unorderedList", label: "Bullet List" },
        { icon: "list-ol", action: "orderedList", label: "Numbered List" },
        { icon: "minus", action: "horizontalRule", label: "Horizontal Line" },
      ],
    },
    
    { icon: "code", action: "inlineCode", label: "Inline Code" },
    { icon: "link", action: "link", label: "Link (Ctrl+K)" },
    
    {
      name: "Insert",
      items: [
        { icon: "image", action: "image", label: "Image" },
        { icon: "video", action: "video", label: "Video" },
        { icon: "file-code", action: "codeBlock", label: "Code Block" },
        { icon: "square-root-variable", action: "math", label: "Math" },
        { icon: "table", action: "table", label: "Table" },
        { icon: "puzzle-piece", action: "template", label: "Template" },
      ],
    },
    
    { icon: "superscript", action: "superscript", label: "Superscript" },
    { icon: "subscript", action: "subscript", label: "Subscript" },
    { icon: "file-alt", action: "reference", label: "Reference" },
    { icon: "list-check", action: "refList", label: "Reference List" },
  ]
];