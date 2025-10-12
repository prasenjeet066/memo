export type EditorMode = 'visual' | 'source';

export interface DialogState {
  open: boolean;
  type: 'link' | 'image' | 'video' | 'table' | null;
}