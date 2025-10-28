import { DecoratorNode, $applyNodeReplacement, createCommand, LexicalCommand, NodeKey } from "lexical";
import React from "react";

/** Command payload type */
export interface InsertImagePayload {
  src: string;
  altText?: string;
  width?: number | string;
  height?: number | string;
}

/** Command definition */
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand("INSERT_IMAGE_COMMAND");

/** React component used to render the image inside the editor */
function ImageComponent({
  src,
  altText,
  width,
  height,
}: {
  src: string;
  altText?: string;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <img
      src={src}
      alt={altText ?? ""}
      width={width}
      height={height}
      style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}
    />
  );
}

/** The ImageNode class for Lexical */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number | string;
  __height?: number | string;

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

  constructor(
    src: string,
    altText: string = "",
    width?: number | string,
    height?: number | string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    return div;
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

/** Helper function to create an ImageNode */
export function $createImageNode({
  src,
  altText = "",
  width,
  height,
}: InsertImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, height));
}

/** Type guard */
export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode;
}