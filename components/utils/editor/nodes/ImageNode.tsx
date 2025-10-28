import {
  DecoratorNode,
  $applyNodeReplacement,
  createCommand,
  LexicalCommand,
  NodeKey,
  $getSelection,
} from "lexical";
import React, { useRef, useState } from "react";

/** Payload for inserting an image */
export interface InsertImagePayload {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}

/** Command for inserting an image */
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand(
  "INSERT_IMAGE_COMMAND"
);

/** React component to render + handle resize + actions */
function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
  nodeKey: NodeKey;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [size, setSize] = useState({ width: width || 300, height: height || 200 });
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useRef<{ x: number; width: number }>({ x: 0, width: 0 });

  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startRef.current = { x: e.clientX, width: size.width };
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - startRef.current.x;
    const newWidth = Math.max(100, startRef.current.width + deltaX);
    setSize((prev) => ({
      width: newWidth,
      height: prev.height,
    }));
  };

  const stopResize = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", stopResize);
    }
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing]);

  return (
    <div
      className={`relative inline-block ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => setIsSelected((prev) => !prev)}
    >
      <img
        ref={imgRef}
        src={src}
        alt={altText ?? ""}
        width={size.width}
        height={size.height}
        className="rounded-md"
        style={{ display: "block", maxWidth: "100%", margin: "auto" }}
      />

      {/* Resize handle (bottom-right corner) */}
      {isSelected && (
        <div
          onMouseDown={startResize}
          className="absolute bottom-1 right-1 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
        />
      )}

      {/* Toolbar actions */}
      {isSelected && (
        <div className="absolute top-1 right-1 bg-white/90 shadow-md rounded-md flex gap-1 p-1">
          <button
            onClick={() => {
              const newUrl = window.prompt("Enter new image URL:", src);
              if (newUrl && imgRef.current) {
                imgRef.current.src = newUrl;
              }
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Replace
          </button>
          <button
            onClick={() => {
              if (imgRef.current?.parentElement) {
                imgRef.current.parentElement.remove();
              }
            }}
            className="text-xs text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/** Lexical ImageNode definition */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number;
  __height: number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  constructor(src: string, altText = "", width = 300, height = 200, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.__key}
      />
    );
  }

  static importJSON(serializedNode: any): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({ src, altText, width, height });
  }

  exportJSON(): any {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    };
  }
}

/** Helper to create a new ImageNode */
export function $createImageNode({
  src,
  altText = "",
  width = 300,
  height = 200,
}: InsertImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, height));
}

/** Type guard */
export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode;
}