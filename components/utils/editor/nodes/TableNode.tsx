import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import * as React from "react";

type CellData = {
  [key: string]: string; // "row-col": content
};

type SerializedTableNode = Spread <
  {
    rows: number;
    cols: number;
    cellData: CellData;
  },
  SerializedLexicalNode >
;

function TableComponent({
  nodeKey,
  rows,
  cols,
  cellData,
  onCellChange
}: {
  nodeKey: NodeKey;
  rows: number;
  cols: number;
  cellData: CellData;
  onCellChange: (row: number, col: number, content: string) => void;
}) {
  return (
    <div className="overflow-auto my-4">
      <table className="border-collapse border border-gray-400">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td
                  key={c}
                  contentEditable
                  suppressContentEditableWarning
                  className="border border-gray-400 p-2 min-w-[80px]"
                  onBlur={(e) => {
                    onCellChange(r, c, e.currentTarget.textContent || "");
                  }}
                  dangerouslySetInnerHTML={{
                    __html: cellData[`${r}-${c}`] || `Cell ${r + 1},${c + 1}`
                  }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export class TableNode extends DecoratorNode < React.ReactElement > {
  __rows: number;
  __cols: number;
  __cellData: CellData;
  
  static getType(): string {
    return "table";
  }
  
  static clone(node: TableNode): TableNode {
    return new TableNode(node.__rows, node.__cols, node.__cellData, node.__key);
  }
  
  constructor(rows = 2, cols = 2, cellData: CellData = {}, key ? : NodeKey) {
    super(key);
    this.__rows = rows;
    this.__cols = cols;
    this.__cellData = cellData;
  }
  
  createDOM(): HTMLElement {
    const div = document.createElement("div");
    return div;
  }
  
  updateDOM(): boolean {
    return false;
  }
  
  setRows(rows: number): void {
    const writable = this.getWritable();
    writable.__rows = rows;
  }
  
  setCols(cols: number): void {
    const writable = this.getWritable();
    writable.__cols = cols;
  }
  
  setCellData(row: number, col: number, content: string): void {
    const writable = this.getWritable();
    writable.__cellData = {
      ...writable.__cellData,
      [`${row}-${col}`]: content
    };
  }
  
  getRows(): number {
    return this.__rows;
  }
  
  getCols(): number {
    return this.__cols;
  }
  
  decorate(): React.ReactElement {
    return (
      <TableComponent 
        nodeKey={this.getKey()} 
        rows={this.__rows} 
        cols={this.__cols} 
        cellData={this.__cellData}
        onCellChange={(row, col, content) => {
          this.getLatest().setCellData(row, col, content);
        }}
      />
    );
  }
  
  static importJSON(serializedNode: SerializedTableNode): TableNode {
    const { rows, cols, cellData } = serializedNode;
    return new TableNode(rows, cols, cellData || {});
  }
  
  exportJSON(): SerializedTableNode {
    return {
      type: "table",
      version: 1,
      rows: this.__rows,
      cols: this.__cols,
      cellData: this.__cellData,
    };
  }
}

export function $createTableNode(rows = 2, cols = 2): TableNode {
  return new TableNode(rows, cols);
}

export function $isTableNode(node: any): node is TableNode {
  return node instanceof TableNode;
}