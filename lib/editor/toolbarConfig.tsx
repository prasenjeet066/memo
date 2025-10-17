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
  
  // === TEXT FORMATTING ===      
  { icon: "bold", action: "bold", label: "Bold (Ctrl+B)" },
  { icon: "italic", action: "italic", label: "Italic (Ctrl+I)" },
  { icon: "underline", action: "underline", label: "Underline (Ctrl+U)" },
  { icon: "code", action: "inlineCode", label: "Inline Code" },
  
  // === HEADINGS & PARAGRAPH ===      
  {
    name: "H1",
    icon: "heading",
    items: [
      { icon: "heading", action: "heading", label: "Heading 2", args: [2] },
      { icon: "heading", action: "heading", label: "Heading 3", args: [3] },
      { icon: "heading", action: "heading", label: "Heading 4", args: [4] },
    ],
  },
  
  // === LISTS ===      
  {
    name: "Lists",
    icon: "list",
    items: [
      { icon: "list-ul", action: "unorderedList", label: "Bullet List" },
      { icon: "list-ol", action: "orderedList", label: "Num List" },
      { icon: "list-check", action: "refList", label: "Reference List" },
    ],
  },
  
  // === LINKS & MEDIA ===      
  { icon: "link", action: "link", label: "Link (Ctrl+K)" },
  { icon: "image", action: "image", label: "Image" },
  { icon: "video", action: "video", label: "Video" },
  
  // === BLOCKS & STRUCTURE ===      
  {
    name: "Insert",
    icon: "plus",
    items: [
      { icon: "file-code", action: "codeBlock", label: "Code" },
      { icon: "magic", action: "aiTask", label: "AI" },
      { icon: "square-root-variable", action: "math", label: "Math Formula" },
      {
        icon: "table",
        action: "table",
        label: "Table",
        editor: [ /* editor options as before */ ]
      },
      { icon: "minus", action: "horizontalRule", label: "Horizontal Line" },
      { icon: "puzzle-piece", action: "template", label: "Template" },
      { icon: "file-alt", action: "reference", label: "Reference" },
    ],
  },
  
  // === ADVANCED ===      
];