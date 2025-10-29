// Editor Types and Interfaces

export interface EditorProps {
  editor_mode ? : 'visual' | 'code';
  record_name ? : string;
  onPublish ? : (payload: any) => Promise < void > ;
  sideBarTools ? : (arg: React.ReactNode) => void;
  ExpandedIs ? : boolean;
  IsExpandedSet ? : (value: boolean) => void;
  isSuccesfullCreated ? : { success: boolean;message ? : string } | null;
  __data ? : any;
}

export interface Citation {
  id: string;
  text: string;
  url ? : string;
  author ? : string;
  date ? : string;
  title ? : string;
}

export interface EditSummary {
  timestamp: number;
  content: string;
  summary: string;
  charChange: number;
}

export interface LinkDialogState {
  open: boolean;
  text: string;
}

export interface CitationDialogState {
  open: boolean;
  author: string;
  title: string;
  url: string;
  date: string;
}

export interface ImageDialogState {
  open: boolean;
  url: string;
}

export interface VideoDialogState {
  open: boolean;
  url: string;
}

export interface FindReplaceDialogState {
  open: boolean;
  find: string;
  replace: string;
}

export interface PublishDialogState {
  open: boolean;
  summary: string;
}

export interface TableDialogState {
  open: boolean;
  rows: number;
  columns: number;
  hasHeader: boolean;
}

export type AutoSaveStatus = 'saved' | 'saving' | 'unsaved';

export type PublishStatusType = 'idle' | 'loading' | 'success' | 'error';

export interface PublishStatus {
  type: PublishStatusType;
  message: string;
}