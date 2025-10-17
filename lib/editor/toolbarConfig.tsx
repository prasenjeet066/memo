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
    items: [
      { icon: "heading", action: "heading", label: "Heading 2", args: [2] },
      { icon: "heading", action: "heading", label: "Heading 3", args: [3] },
      { icon: "heading", action: "heading", label: "Heading 4", args: [4] },
    ],
  },
  
  // === LISTS ===
  {
    name: "Lists",
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
    items: [
      { icon: "file-code", action: "codeBlock", label: "Code" },
      {
        icon: "magic",
        action: 'aiTask',
        lable: 'AI'
      },
      { icon: "square-root-variable", action: "math", label: "Math Formula" },
      {
        icon: "table",
        action: "table",
        label: "Table",
        editor: [
        {
          "type": "select",
          "label": "Border Style",
          "name": "borderStyle",
          "options": [
            { "value": "solid", "text": "Solid" },
            { "value": "dashed", "text": "Dashed" },
            { "value": "dotted", "text": "Dotted" },
            { "value": "double", "text": "Double" },
            { "value": "none", "text": "None" }
          ]
        },
        {
          "type": "color",
          "label": "Border Color",
          "name": "borderColor"
        },
        {
          "type": "number",
          "label": "Border Width",
          "name": "borderWidth",
          "min": 0,
          "max": 10,
          "step": 1
        },
        {
          "type": "color",
          "label": "Background Color",
          "name": "backgroundColor"
        },
        {
          "type": "color",
          "label": "Text Color",
          "name": "color"
        },
        {
          "type": "select",
          "label": "Font Family",
          "name": "fontFamily",
          "options": [
            { "value": "Arial, sans-serif", "text": "Arial" },
            { "value": "Georgia, serif", "text": "Georgia" },
            { "value": "Courier New, monospace", "text": "Courier New" },
            { "value": "Times New Roman, serif", "text": "Times New Roman" }
          ]
        },
        {
          "type": "number",
          "label": "Font Size",
          "name": "fontSize",
          "min": 8,
          "max": 72,
          "step": 1
        },
        {
          "type": "select",
          "label": "Text Align",
          "name": "textAlign",
          "options": [
            { "value": "left", "text": "Left" },
            { "value": "center", "text": "Center" },
            { "value": "right", "text": "Right" },
            { "value": "justify", "text": "Justify" }
          ]
        },
        {
          "type": "select",
          "label": "Font Weight",
          "name": "fontWeight",
          "options": [
            { "value": "normal", "text": "Normal" },
            { "value": "bold", "text": "Bold" },
            { "value": "lighter", "text": "Lighter" },
            { "value": "bolder", "text": "Bolder" }
          ]
        },
        {
          "type": "select",
          "label": "Font Style",
          "name": "fontStyle",
          "options": [
            { "value": "normal", "text": "Normal" },
            { "value": "italic", "text": "Italic" },
            { "value": "oblique", "text": "Oblique" }
          ]
        },
        {
          "type": "number",
          "label": "Cell Padding",
          "name": "cellPadding",
          "min": 0,
          "max": 20,
          "step": 1
        },
        {
          "type": "number",
          "label": "Cell Spacing",
          "name": "cellSpacing",
          "min": 0,
          "max": 20,
          "step": 1
          
        }]
      },
      { icon: "minus", action: "horizontalRule", label: "Horizontal Line" },
      
      { icon: "puzzle-piece", action: "template", label: "Template" },
      { icon: "file-alt", action: "reference", label: "Reference" },
      
    ],
  },
  
  // === ADVANCED ===
];