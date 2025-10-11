// lib/mappers/record.mapper.ts

import { IRecord } from '@/lib/units/models/Record';
import {
  RecordDTO,
  RecordListItemDTO,
  BaseRecordDTO,
  RecordStatsDTO,
  RevisionDTO,
  RevisionDetailDTO,
  ReferenceDTO,
} from '@/lib/dtos/record.dto';

/**
 * Mapper class to convert between Record models and DTOs
 */
export class RecordMapper {
  /**
   * Convert Record model to full DTO
   */
  static toDTO(record: IRecord): RecordDTO {
    return {
      id: record._id.toString(),
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      content: record.content,
      status: record.status,
      protectionLevel: record.protection_level,
      categories: record.categories,
      tags: record.tags,
      infobox: record.infobox,
      createdBy: record.created_by.toString(),
      createdByUsername: record.created_by_username,
      lastEditedBy: record.last_edited_by?.toString(),
      lastEditedByUsername: record.last_edited_by_username,
      currentRevision: record.current_revision,
      references: this.toReferenceDTOs(record.references),
      externalLinks: record.external_links,
      viewCount: record.view_count,
      editCount: record.edit_count,
      watchers: record.watchers.map((id) => id.toString()),
      qualityRating: record.quality_rating,
      importanceRating: record.importance_rating,
      protectionReason: record.protection_reason,
      protectionExpires: record.protection_expires,
      isDisambiguation: record.is_disambiguation,
      isRedirect: record.is_redirect,
      redirectTarget: record.redirect_target,
      hasActiveDiscussion: record.has_active_discussion,
      isDisputed: record.is_disputed,
      disputeTags: record.dispute_tags,
      publishedAt: record.published_at,
      lastReviewedAt: record.last_reviewed_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
  
  /**
   * Convert Record model to List Item DTO
   */
  static toListItemDTO(record: IRecord): RecordListItemDTO {
    return {
      id: record._id.toString(),
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      status: record.status,
      categories: record.categories,
      createdBy: record.created_by.toString(),
      createdByUsername: record.created_by_username,
      viewCount: record.view_count,
      editCount: record.edit_count,
      qualityRating: record.quality_rating,
      protectionLevel: record.protection_level,
      publishedAt: record.published_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
  
  /**
   * Convert Record model to Base DTO
   */
  static toBaseDTO(record: IRecord): BaseRecordDTO {
    return {
      id: record._id.toString(),
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      status: record.status,
      categories: record.categories,
      createdBy: record.created_by.toString(),
      createdByUsername: record.created_by_username,
    };
  }
  
  /**
   * Convert Record model to Statistics DTO
   */
  static toStatsDTO(record: IRecord): RecordStatsDTO {
    const ageInDays = Math.floor(
      (Date.now() - record.created_at.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const averageEditsPerDay =
      ageInDays > 0 ? record.edit_count / ageInDays : record.edit_count;
    
    return {
      viewCount: record.view_count,
      editCount: record.edit_count,
      watcherCount: record.watchers?.length || 0,
      revisionCount: record.revisions?.length || 0,
      referenceCount: record.references?.length || 0,
      categoryCount: record.categories?.length || 0,
      ageInDays,
      lastEditDate: record.updated_at,
      averageEditsPerDay: Math.round(averageEditsPerDay * 100) / 100,
    };
  }
  
  /**
   * Convert multiple Record models to List Item DTOs
   */
  static toListItemDTOs(records: IRecord[]): RecordListItemDTO[] {
    return records.map((record) => this.toListItemDTO(record));
  }
  
  /**
   * Convert revision to DTO
   */
  static toRevisionDTO(revision: any): RevisionDTO {
    return {
      editor: revision.editor.toString(),
      editorUsername: revision.editor_username,
      timestamp: revision.timestamp,
      editSummary: revision.edit_summary,
      isMinorEdit: revision.is_minor_edit,
      revisionSize: revision.revision_size,
    };
  }
  
  /**
   * Convert revision to detailed DTO (with content)
   */
  static toRevisionDetailDTO(revision: any): RevisionDetailDTO {
    return {
      ...this.toRevisionDTO(revision),
      content: revision.content,
      diff: revision.diff,
    };
  }
  
  /**
   * Convert revisions to DTOs
   */
  static toRevisionDTOs(revisions: any[]): RevisionDTO[] {
    return revisions.map((rev) => this.toRevisionDTO(rev));
  }
  
  /**
   * Convert references to DTOs
   */
  static toReferenceDTOs(references: any[]): ReferenceDTO[] {
    return references.map((ref) => ({
      title: ref.title,
      url: ref.url,
      author: ref.author,
      publication: ref.publication,
      date: ref.date,
      accessDate: ref.access_date,
      citationFormat: ref.citation_format,
    }));
  }
  
  /**
   * Sanitize record for public display (without sensitive information)
   */
  static toPublicDTO(record: IRecord): Omit < RecordDTO, 'watchers' > {
    const dto = this.toDTO(record);
    const { watchers, ...publicData } = dto;
    return publicData;
  }
  
  /**
   * Convert to minimal DTO for search results
   */
  static toSearchResultDTO(record: IRecord): {
    id: string;
    title: string;
    slug: string;
    summary: string;
    categories: string[];
  } {
    return {
      id: record._id.toString(),
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      categories: record.categories,
    };
  }
}