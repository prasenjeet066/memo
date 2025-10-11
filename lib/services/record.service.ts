// lib/services/record.service.ts

import { RecordDAL } from '@/lib/dal/record.dal';
import { RecordMapper } from '@/lib/mappers/record.mapper';
import {
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordDTO,
  RecordListItemDTO,
  PaginatedRecordsDTO,
  RecordStatsDTO,
  RevisionDTO,
  RevisionDetailDTO,
  RecordProtectionDTO,
  RecordStatusUpdateDTO,
  RecordQualityDTO,
  RecordDisputeDTO,
  RecordRedirectDTO,
  RollbackDTO,
  RecordSearchFiltersDTO,
} from '@/lib/dtos/record.dto';

/**
 * Service Layer for Record (Article) business logic
 * Handles validation, business rules, and coordination between DAL and controllers
 */
export class RecordService {
  /**
   * Create a new record
   */
  static async createRecord(
    data: CreateRecordDTO,
    userId: string,
    username: string
  ): Promise<{
    success: boolean;
    record?: RecordDTO;
    error?: string;
  }> {
    try {
      // Validate title length
      if (data.title.length < 3 || data.title.length > 250) {
        return {
          success: false,
          error: 'Title must be between 3 and 250 characters',
        };
      }

      // Validate summary
      if (data.summary.length < 10 || data.summary.length > 500) {
        return {
          success: false,
          error: 'Summary must be between 10 and 500 characters',
        };
      }

      // Create the record
      const record = await RecordDAL.createRecord(data, userId, username);

      return {
        success: true,
        record: RecordMapper.toDTO(record),
      };
    } catch (error: any) {
      console.error('Create record error:', error);
      
      if (error.code === 11000) {
        return {
          success: false,
          error: 'A record with this title already exists',
        };
      }

      return {
        success: false,
        error: 'Failed to create record',
      };
    }
  }

  /**
   * Get record by ID
   */
  static async getRecordById(
    recordId: string,
    incrementView: boolean = true
  ): Promise<RecordDTO | null> {
    try {
      const record = await RecordDAL.findById(recordId);
      
      if (!record) {
        return null;
      }

      // Increment view count if requested
      if (incrementView) {
        await RecordDAL.incrementViewCount(recordId);
        record.view_count += 1;
      }

      return RecordMapper.toDTO(record);
    } catch (error) {
      console.error('Get record by ID error:', error);
      return null;
    }
  }

  /**
   * Get record by slug
   */
  static async getRecordBySlug(
    slug: string,
    incrementView: boolean = true
  ): Promise<RecordDTO | null> {
    try {
      const record = await RecordDAL.findBySlug(slug);
      
      if (!record) {
        return null;
      }

      // Increment view count if requested
      if (incrementView) {
        await RecordDAL.incrementViewCount(record._id.toString());
        record.view_count += 1;
      }

      return RecordMapper.toDTO(record);
    } catch (error) {
      console.error('Get record by slug error:', error);
      return null;
    }
  }

  /**
   * Update record
   */
  static async updateRecord(
    recordId: string,
    data: UpdateRecordDTO,
    userId: string,
    username: string
  ): Promise<{
    success: boolean;
    record?: RecordDTO;
    error?: string;
  }> {
    try {
      // Check if record exists
      const existingRecord = await RecordDAL.findById(recordId);
      
      if (!existingRecord) {
        return {
          success: false,
          error: 'Record not found',
        };
      }

      // Check protection level
      if (existingRecord.protection_level !== 'NONE') {
        // TODO: Add role-based protection checks
        return {
          success: false,
          error: 'This record is protected and cannot be edited',
        };
      }

      // Validate data if provided
      if (data.title && (data.title.length < 3 || data.title.length > 250)) {
        return {
          success: false,
          error: 'Title must be between 3 and 250 characters',
        };
      }

      if (data.summary && (data.summary.length < 10 || data.summary.length > 500)) {
        return {
          success: false,
          error: 'Summary must be between 10 and 500 characters',
        };
      }

      // Update the record
      const record = await RecordDAL.updateRecord(
        recordId,
        data,
        userId,
        username
      );

      if (!record) {
        return {
          success: false,
          error: 'Failed to update record',
        };
      }

      return {
        success: true,
        record: RecordMapper.toDTO(record),
      };
    } catch (error) {
      console.error('Update record error:', error);
      return {
        success: false,
        error: 'Failed to update record',
      };
    }
  }

  /**
   * Delete record (soft delete)
   */
  static async deleteRecord(
    recordId: string,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if record exists
      const record = await RecordDAL.findById(recordId);
      
      if (!record) {
        return {
          success: false,
          error: 'Record not found',
        };
      }

      // Update status to DELETED
      await RecordDAL.updateStatus(recordId, {
        status: 'DELETED',
        reason: `Deleted by user ${userId}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Delete record error:', error);
      return {
        success: false,
        error: 'Failed to delete record',
      };
    }
  }

  /**
   * Get paginated records
   */
  static async getPaginatedRecords(
    page: number = 1,
    limit: number = 20,
    filters?: RecordSearchFiltersDTO
  ): Promise<PaginatedRecordsDTO> {
    try {
      return await RecordDAL.getPaginatedRecords(page, limit, filters);
    } catch (error) {
      console.error('Get paginated records error:', error);
      return {
        records: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Search records
   */
  static async searchRecords(
    searchTerm: string,
    limit: number = 10
  ): Promise<RecordListItemDTO[]> {
    try {
      const records = await RecordDAL.searchRecords(searchTerm, limit);
      return RecordMapper.toListItemDTOs(records);
    } catch (error) {
      console.error('Search records error:', error);
      return [];
    }
  }

  /**
   * Get record statistics
   */
  static async getRecordStats(recordId: string): Promise<RecordStatsDTO | null> {
    try {
      return await RecordDAL.getRecordStats(recordId);
    } catch (error) {
      console.error('Get record stats error:', error);
      return null;
    }
  }

  /**
   * Get revision history
   */
  static async getRevisionHistory(
    recordId: string,
    limit: number = 50
  ): Promise<RevisionDTO[]> {
    try {
      return await RecordDAL.getRevisionHistory(recordId, limit);
    } catch (error) {
      console.error('Get revision history error:', error);
      return [];
    }
  }

  /**
   * Get specific revision
   */
  static async getRevision(
    recordId: string,
    revisionNumber: number
  ): Promise<RevisionDetailDTO | null> {
    try {
      return await RecordDAL.getRevision(recordId, revisionNumber);
    } catch (error) {
      console.error('Get revision error:', error);
      return null;
    }
  }

  /**
   * Rollback to specific revision
   */
  static async rollbackToRevision(
    recordId: string,
    data: RollbackDTO,
    userId: string
  ): Promise<{
    success: boolean;
    record?: RecordDTO;
    error?: string;
  }> {
    try {
      const record = await RecordDAL.rollbackToRevision(recordId, data, userId);

      if (!record) {
        return {
          success: false,
          error: 'Failed to rollback',
        };
      }

      return {
        success: true,
        record: RecordMapper.toDTO(record),
      };
    } catch (error: any) {
      console.error('Rollback error:', error);
      return {
        success: false,
        error: error.message || 'Failed to rollback record',
      };
    }
  }

  /**
   * Update record protection
   */
  static async updateProtection(
    recordId: string,
    data: RecordProtectionDTO,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // TODO: Add admin role check
      
      await RecordDAL.updateProtection(recordId, data);

      return { success: true };
    } catch (error) {
      console.error('Update protection error:', error);
      return {
        success: false,
        error: 'Failed to update protection',
      };
    }
  }

  /**
   * Update record status
   */
  static async updateStatus(
    recordId: string,
    data: RecordStatusUpdateDTO,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await RecordDAL.updateStatus(recordId, data);

      return { success: true };
    } catch (error) {
      console.error('Update status error:', error);
      return {
        success: false,
        error: 'Failed to update status',
      };
    }
  }

  /**
   * Update quality ratings
   */
  static async updateQuality(
    recordId: string,
    data: RecordQualityDTO
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await RecordDAL.updateQuality(recordId, data);

      return { success: true };
    } catch (error) {
      console.error('Update quality error:', error);
      return {
        success: false,
        error: 'Failed to update quality ratings',
      };
    }
  }

  /**
   * Update dispute status
   */
  static async updateDispute(
    recordId: string,
    data: RecordDisputeDTO
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await RecordDAL.updateDispute(recordId, data);

      return { success: true };
    } catch (error) {
      console.error('Update dispute error:', error);
      return {
        success: false,
        error: 'Failed to update dispute status',
      };
    }
  }

  /**
   * Configure redirect
   */
  static async configureRedirect(
    recordId: string,
    data: RecordRedirectDTO
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await RecordDAL.configureRedirect(recordId, data);

      return { success: true };
    } catch (error) {
      console.error('Configure redirect error:', error);
      return {
        success: false,
        error: 'Failed to configure redirect',
      };
    }
  }

  /**
   * Add/remove watcher
   */
  static async toggleWatch(
    recordId: string,
    userId: string,
    action: 'watch' | 'unwatch'
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (action === 'watch') {
        await RecordDAL.addWatcher(recordId, userId);
      } else {
        await RecordDAL.removeWatcher(recordId, userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Toggle watch error:', error);
      return {
        success: false,
        error: 'Failed to update watch status',
      };
    }
  }

  /**
   * Get records by category
   */
  static async getRecordsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    try {
      return await RecordDAL.getRecordsByCategory(category, page, limit);
    } catch (error) {
      console.error('Get records by category error:', error);
      return {
        records: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get records by tag
   */
  static async getRecordsByTag(
    tag: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    try {
      return await RecordDAL.getRecordsByTag(tag, page, limit);
    } catch (error) {
      console.error('Get records by tag error:', error);
      return {
        records: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get records by user
   */
  static async getRecordsByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    try {
      return await RecordDAL.getRecordsByUser(userId, page, limit);
    } catch (error) {
      console.error('Get records by user error:', error);
      return {
        records: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Get trending records
   */
  static async getTrendingRecords(
    limit: number = 10,
    timeframe: number = 7 // days
  ): Promise<RecordListItemDTO[]> {
    try {
      const records = await RecordDAL.getTrendingRecords(limit, timeframe);
      return RecordMapper.toListItemDTOs(records);
    } catch (error) {
      console.error('Get trending records error:', error);
      return [];
    }
  }

  /**
   * Get recently updated records
   */
  static async getRecentlyUpdated(limit: number = 10): Promise<RecordListItemDTO[]> {
    try {
      const records = await RecordDAL.getRecentlyUpdated(limit);
      return RecordMapper.toListItemDTOs(records);
    } catch (error) {
      console.error('Get recently updated records error:', error);
      return [];
    }
  }

  /**
   * Get featured records
   */
  static async getFeaturedRecords(limit: number = 10): Promise<RecordListItemDTO[]> {
    try {
      const records = await RecordDAL.getFeaturedRecords(limit);
      return RecordMapper.toListItemDTOs(records);
    } catch (error) {
      console.error('Get featured records error:', error);
      return [];
    }
  }

  /**
   * Check if slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      return await RecordDAL.isSlugAvailable(slug);
    } catch (error) {
      console.error('Check slug availability error:', error);
      return false;
    }
  }

  /**
   * Get watched records by user
   */
  static async getWatchedRecords(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    try {
      return await RecordDAL.getWatchedRecords(userId, page, limit);
    } catch (error) {
      console.error('Get watched records error:', error);
      return {
        records: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }
}