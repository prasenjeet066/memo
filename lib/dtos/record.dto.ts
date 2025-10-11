// lib/dtos/record.dto.ts

/**
 * Data Transfer Objects for Record (Article) operations
 */

// Base Record DTO
export interface BaseRecordDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  categories: string[];
  createdBy: string;
  createdByUsername: string;
}

// Create Record DTO (input)
export interface CreateRecordDTO {
  title: string;
  content: string;
  summary: string;
  categories?: string[];
  tags?: string[];
  infobox?: Record<string, any>;
  references?: ReferenceDTO[];
  externalLinks?: string[];
}

// Update Record DTO (input)
export interface UpdateRecordDTO {
  title?: string;
  content?: string;
  summary?: string;
  categories?: string[];
  tags?: string[];
  infobox?: Record<string, any>;
  references?: ReferenceDTO[];
  externalLinks?: string[];
  editSummary?: string;
  isMinorEdit?: boolean;
}

// Full Record DTO (output)
export interface RecordDTO extends BaseRecordDTO {
  content: string;
  protectionLevel: string;
  tags: string[];
  infobox?: Record<string, any>;
  lastEditedBy?: string;
  lastEditedByUsername?: string;
  currentRevision: number;
  references: ReferenceDTO[];
  externalLinks: string[];
  viewCount: number;
  editCount: number;
  watchers: string[];
  qualityRating?: string;
  importanceRating?: string;
  protectionReason?: string;
  protectionExpires?: Date;
  isDisambiguation: boolean;
  isRedirect: boolean;
  redirectTarget?: string;
  hasActiveDiscussion: boolean;
  isDisputed: boolean;
  disputeTags: string[];
  publishedAt?: Date;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Record List Item DTO (for listings)
export interface RecordListItemDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: string;
  categories: string[];
  createdBy: string;
  createdByUsername: string;
  viewCount: number;
  editCount: number;
  qualityRating?: string;
  protectionLevel: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Revision DTO
export interface RevisionDTO {
  editor: string;
  editorUsername: string;
  timestamp: Date;
  editSummary?: string;
  isMinorEdit: boolean;
  revisionSize: number;
}

// Revision Detail DTO (includes content)
export interface RevisionDetailDTO extends RevisionDTO {
  content: string;
  diff?: string;
}

// Reference DTO
export interface ReferenceDTO {
  title: string;
  url?: string;
  author?: string;
  publication?: string;
  date?: string;
  accessDate?: string;
  citationFormat?: string;
}

// Record Statistics DTO
export interface RecordStatsDTO {
  viewCount: number;
  editCount: number;
  watcherCount: number;
  revisionCount: number;
  referenceCount: number;
  categoryCount: number;
  ageInDays: number;
  lastEditDate?: Date;
  averageEditsPerDay: number;
}

// Pagination DTO
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated Records Response
export interface PaginatedRecordsDTO {
  records: RecordListItemDTO[];
  pagination: PaginationDTO;
}

// Record Search Filters
export interface RecordSearchFiltersDTO {
  status?: string;
  protectionLevel?: string;
  category?: string;
  tag?: string;
  qualityRating?: string;
  createdBy?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Record Protection DTO
export interface RecordProtectionDTO {
  protectionLevel: 'NONE' | 'SEMI' | 'EXTENDED' | 'FULL' | 'CASCADE';
  protectionReason?: string;
  protectionExpires?: Date;
}

// Record Status Update DTO
export interface RecordStatusUpdateDTO {
  status: 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'FLAGGED' | 'PROTECTED' | 'DELETED';
  reason?: string;
}

// Record Quality Rating DTO
export interface RecordQualityDTO {
  qualityRating?: 'STUB' | 'START' | 'C' | 'B' | 'GA' | 'FA';
  importanceRating?: 'LOW' | 'MID' | 'HIGH' | 'TOP';
}

// Dispute Management DTO
export interface RecordDisputeDTO {
  isDisputed: boolean;
  disputeTags: string[];
  hasActiveDiscussion: boolean;
}

// Redirect Configuration DTO
export interface RecordRedirectDTO {
  isRedirect: boolean;
  redirectTarget?: string;
}

// Watch Record DTO
export interface WatchRecordDTO {
  userId: string;
  action: 'watch' | 'unwatch';
}

// Rollback DTO
export interface RollbackDTO {
  revisionNumber: number;
  reason: string;
}