import { DecoratorNode } from "lexical";
import * as React from "react";

function TableComponent({ nodeKey, rows, cols }) {
  return (
    <div className="overflow-auto">
      <table className="border-collapse border border-gray-400">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td
                  key={c}
                  contentEditable
                  className="border border-gray-400 p-2 min-w-[80px]"
                >
                  Cell {r + 1},{c + 1}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export class TableNode extends DecoratorNode {
  __rows;
  __cols;
  
  static getType() {
    return "table";
  }
  
  static clone(node) {
    return new TableNode(node.__rows, node.__cols, node.__key);
  }
  
  constructor(rows = 2, cols = 2, key) {
    super(key);
    this.__rows = rows;
    this.__cols = cols;
  }
  
  createDOM() {
    const div = document.createElement("div");
    return div;
  }
  
  updateDOM() {
    return false;
  }
  
  decorate() {
    return <TableComponent nodeKey={this.getKey()} rows={this.__rows} cols={this.__cols} />;
  }
  
  static importJSON(serializedNode) {
    const { rows, cols } = serializedNode;
    return new TableNode(rows, cols);
  }
  
  exportJSON() {
    return {
      type: "table",
      version: 1,
      rows: this.__rows,
      cols: this.__cols,
    };
  }
}

export function $createTableNode(rows = 2, cols = 2) {
  return new TableNode(rows, cols);
}

export function $isTableNode(node) {
  return node instanceof TableNode;
}