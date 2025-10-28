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
  // Text formatting
  { icon: "bold", action: "bold", label: "Bold (Ctrl+B)" },
  { icon: "italic", action: "italic", label: "Italic (Ctrl+I)" },
  { icon: "underline", action: "underline", label: "Underline (Ctrl+U)" },
  { icon: "strikethrough", action: "strikethrough", label: "Strikethrough" },
  
  // Headings & Paragraph
  {
    name: "Paragraph",
    icon: "heading",
    items: [
      { icon: "paragraph", action: "paragraph", label: "Paragraph" },
      { icon: "heading", action: "heading", label: "Heading 2", args: [2] },
      { icon: "heading", action: "heading", label: "Heading 3", args: [3] },
      { icon: "code", action: "inlineCode", label: "Inline Code" },
    ],
  },
  
  // Lists
  {
    name: "Lists",
    icon: "list",
    items: [
      { icon: "list-ul", action: "unorderedList", label: "Bullet List" },
      { icon: "list-ol", action: "orderedList", label: "Numbered List" },
      { icon: "list-check", action: "refList", label: "Reference List" },
    ],
  },
  
  // Links & Media
  { icon: "link", action: "link", label: "Link (Ctrl+K)" },
  { icon: "image", action: "image", label: "Image" },
  { icon: "video", action: "video", label: "Video" },
  
  // Insert menu
  {
    name: "Insert",
    icon: "plus",
    items: [
      { icon: "file-code", action: "codeBlock", label: "Code Block" },
      { icon: "square-root-variable", action: "math", label: "Math Formula" },
      { icon: "table", action: "table", label: "Table" },
      { icon: "minus", action: "horizontalRule", label: "Horizontal Line" },
      { icon: "puzzle-piece", action: "template", label: "Template" },
      { icon: "info-circle", action: "infobox", label: "InfoBox" },
      { icon: "superscript", action: "superscript", label: "Superscript" },
      { icon: "subscript", action: "subscript", label: "Subscript" },
      { icon: "file-alt", action: "reference", label: "Reference" },
    ],
  },
];