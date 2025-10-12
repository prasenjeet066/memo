import {
  Bold, Italic, Strikethrough, Underline, Code, Heading1, Heading2, Heading3, Link, Image, Video,
  FileCode, Sigma, List, ListOrdered, Table, Minus, Superscript, Subscript, Type, FileText, ListChecks, Puzzle
} from "lucide-react";

export const toolbarBlocks = [
  { icon: Bold, action: "bold", label: "বোল্ড (Ctrl+B)" },
  { icon: Italic, action: "italic", label: "ইটালিক (Ctrl+I)" },
  {
    name: "শিরোনাম",
    items: [
      { icon: Heading1, action: "heading", label: "শিরোনাম ২", args: [2] },
      { icon: Heading2, action: "heading", label: "শিরোনাম ৩", args: [3] },
      { icon: Heading3, action: "heading", label: "শিরোনাম ৪", args: [4] },
    ],
  },
  { icon: Type, action: "boldItalic", label: "বোল্ড ইটালিক" },
  { icon: Strikethrough, action: "strikethrough", label: "স্ট্রাইকথ্রু" },
  { icon: Underline, action: "underline", label: "আন্ডারলাইন (Ctrl+U)" },
  { icon: Code, action: "inlineCode", label: "ইনলাইন কোড" },
  { icon: Link, action: "link", label: "লিঙ্ক (Ctrl+K)" },
  { icon: Image, action: "image", label: "ছবি" },
  { icon: Video, action: "video", label: "ভিডিও" },
  { icon: FileCode, action: "codeBlock", label: "কোড ব্লক" },
  { icon: Sigma, action: "math", label: "গণিত" },
  { icon: List, action: "unorderedList", label: "বুলেট তালিকা" },
  { icon: ListOrdered, action: "orderedList", label: "সংখ্যাযুক্ত তালিকা" },
  { icon: Table, action: "table", label: "টেবিল" },
  { icon: Puzzle, action: "template", label: "টেমপ্লেট" },
  { icon: Minus, action: "horizontalRule", label: "অনুভূমিক রেখা" },
  { icon: Superscript, action: "superscript", label: "সুপারস্ক্রিপ্ট" },
  { icon: Subscript, action: "subscript", label: "সাবস্ক্রিপ্ট" },
  { icon: FileText, action: "reference", label: "তথ্যসূত্র" },
  { icon: ListChecks, action: "refList", label: "তথ্যসূত্র তালিকা" },
];