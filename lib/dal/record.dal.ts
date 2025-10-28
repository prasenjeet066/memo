// lib/dal/record.dal.ts

import { Record, IRecord } from '@/lib/units/models/Record';
import { connectDB } from '@/lib/security/auth/db/provider';
import {
  CreateRecordDTO,
  UpdateRecordDTO,
  PaginatedRecordsDTO,
  RecordSearchFiltersDTO,
  RecordProtectionDTO,
  RecordStatusUpdateDTO,
  RecordQualityDTO,
  RecordDisputeDTO,
  RecordRedirectDTO,
  RollbackDTO,
  RecordStatsDTO,
  RevisionDTO,
  RevisionDetailDTO,
} from '@/lib/dtos/record.dto';
import { RecordMapper } from '@/lib/mappers/record.mapper';
import mongoose from 'mongoose';

/**
 * Data Access Layer for Record (Article) operations
 * Handles all database interactions for records
 */
export class RecordDAL {
  /**
   * Ensure database connection before operations
   */
  private static async ensureConnection(): Promise<void> {
    await connectDB();
  }

  /**
   * Generate unique slug from title
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Find record by ID
   */
  static async findById(recordId: string): Promise<IRecord | null> {
    await this.ensureConnection();
    return Record.findById(recordId).exec();
  }

  /**
   * Find record by slug
   */
  static async findBySlug(slug: string): Promise<IRecord | null> {
    await this.ensureConnection();
    return Record.findOne({ slug: slug.toLowerCase() }).exec();
  }

  /**
   * Create a new record
   */
  static async createRecord(
    data: CreateRecordDTO,
    userId: string,
    username: string
  ): Promise<IRecord> {
    await this.ensureConnection();

    let slug = this.generateSlug(data.title);
    let counter = 1;

    // Ensure unique slug
    const record = new Record({
      title: data.title,
      slug,
      content: data.content,
      summary: data.summary,
      categories: data.categories || [],
      tags: data.tags || [],
      infobox: data.infobox,
      references: data.references || [],
      external_links: data.externalLinks || [],
      created_by: new mongoose.Types.ObjectId(userId),
      created_by_username: username,
      status: 'DRAFT',
      protection_level: 'NONE',
    });

    return record.save();
  }

  /**
 * Update a record
 */
static async updateRecord(
  recordId: string,
  data: UpdateRecordDTO,
  userId: string,
  username: string
): Promise < IRecord | null > {
  await this.ensureConnection();
  
  const record = await this.findById(recordId);
  if (!record) return null;
  
  // Update fields
  if (data.title) {
    record.title = data.title;
    record.slug = this.generateSlug(data.title);
  }
  if (data.summary) record.summary = data.summary;
  if (data.categories) record.categories = data.categories;
  if (data.tags) record.tags = data.tags;
  if (data.infobox !== undefined) record.infobox = data.infobox;
  if (data.references) record.references = data.references as any;
  if (data.externalLinks) record.external_links = data.externalLinks;
  
  // Add revision if content changed
  if (data.content) {
    // Fix: Pass parameters in correct order
    // addRevision(editor, content, editor_username, summary?, isMinor?)
    await record.addRevision(
      new mongoose.Types.ObjectId(userId),
      data.content, // content is 2nd parameter
      username, // editor_username is 3rd parameter
      data.editSummary, // summary is 4th parameter
      data.isMinorEdit // isMinor is 5th parameter
    );
    record.last_edited_by = new mongoose.Types.ObjectId(userId);
    record.last_edited_by_username = username;
  }
  
  return record.save();
}

  /**
   * Get paginated records
   */
  static async getPaginatedRecords(
    page: number = 1,
    limit: number = 20,
    filters?: RecordSearchFiltersDTO
  ): Promise<PaginatedRecordsDTO> {
    await this.ensureConnection();

    const query: any = {};

    // Apply filters
    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.protectionLevel) {
      query.protection_level = filters.protectionLevel;
    }

    if (filters?.category) {
      query.categories = { $in: [filters.category] };
    }

    if (filters?.tag) {
      query.tags = { $in: [filters.tag] };
    }

    if (filters?.qualityRating) {
      query.quality_rating = filters.qualityRating;
    }

    if (filters?.createdBy) {
      query.created_by = new mongoose.Types.ObjectId(filters.createdBy);
    }

    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    if (filters?.dateFrom || filters?.dateTo) {
      query.created_at = {};
      if (filters.dateFrom) query.created_at.$gte = filters.dateFrom;
      if (filters.dateTo) query.created_at.$lte = filters.dateTo;
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Record.countDocuments(query).exec(),
    ]);

    return {
      records: RecordMapper.toListItemDTOs(records),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search records by text
   */
  static async searchRecords(
    searchTerm: string,
    limit: number = 10
  ): Promise<IRecord[]> {
    await this.ensureConnection();

    return Record.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { summary: { $regex: searchTerm, $options: 'i' } },
      ],
      status: { $ne: 'DELETED' },
    })
      .limit(limit)
      .exec();
  }

  /**
   * Get record statistics
   */
  static async getRecordStats(recordId: string): Promise<RecordStatsDTO | null> {
    await this.ensureConnection();

    const record = await this.findById(recordId);
    if (!record) return null;

    return RecordMapper.toStatsDTO(record);
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(recordId: string): Promise<void> {
    await this.ensureConnection();
    await Record.findByIdAndUpdate(recordId, {
      $inc: { view_count: 1 },
    }).exec();
  }

  /**
   * Get revision history
   */
  static async getRevisionHistory(
    recordId: string,
    limit: number = 50
  ): Promise<RevisionDTO[]> {
    await this.ensureConnection();

    const record = await this.findById(recordId);
    if (!record) return [];

    const revisions = record.getRevisionHistory(limit);
    return RecordMapper.toRevisionDTOs(revisions);
  }

  /**
   * Get specific revision
   */
  static async getRevision(
    recordId: string,
    revisionNumber: number
  ): Promise<RevisionDetailDTO | null> {
    await this.ensureConnection();

    const record = await this.findById(recordId);
    if (!record || !record.revisions[revisionNumber]) return null;

    return RecordMapper.toRevisionDetailDTO(record.revisions[revisionNumber]);
  }

  /**
   * Rollback to specific revision
   */
  static async rollbackToRevision(
    recordId: string,
    data: RollbackDTO,
    userId: string
  ): Promise<IRecord | null> {
    await this.ensureConnection();

    const record = await this.findById(recordId);
    if (!record) return null;

    await record.rollbackToRevision(data.revisionNumber);
    return record;
  }

  /**
   * Update record protection
   */
  static async updateProtection(
    recordId: string,
    data: RecordProtectionDTO
  ): Promise<void> {
    await this.ensureConnection();

    await Record.findByIdAndUpdate(recordId, {
      $set: {
        protection_level: data.protectionLevel,
        protection_reason: data.protectionReason,
        protection_expires: data.protectionExpires,
      },
    }).exec();
  }

  /**
   * Update record status
   */
  static async updateStatus(
    recordId: string,
    data: RecordStatusUpdateDTO
  ): Promise<void> {
    await this.ensureConnection();

    const updateData: any = { status: data.status };

    if (data.status === 'PUBLISHED' && data.reason) {
      updateData.published_at = new Date();
    }

    await Record.findByIdAndUpdate(recordId, { $set: updateData }).exec();
  }

  /**
   * Update quality ratings
   */
  static async updateQuality(
    recordId: string,
    data: RecordQualityDTO
  ): Promise<void> {
    await this.ensureConnection();

    await Record.findByIdAndUpdate(recordId, {
      $set: {
        ...(data.qualityRating && { quality_rating: data.qualityRating }),
        ...(data.importanceRating && { importance_rating: data.importanceRating }),
      },
    }).exec();
  }

  /**
   * Update dispute status
   */
  static async updateDispute(
    recordId: string,
    data: RecordDisputeDTO
  ): Promise<void> {
    await this.ensureConnection();

    await Record.findByIdAndUpdate(recordId, {
      $set: {
        is_disputed: data.isDisputed,
        dispute_tags: data.disputeTags,
        has_active_discussion: data.hasActiveDiscussion,
      },
    }).exec();
  }

  /**
   * Configure redirect
   */
  static async configureRedirect(
    recordId: string,
    data: RecordRedirectDTO
  ): Promise<void> {
    await this.ensureConnection();

    await Record.findByIdAndUpdate(recordId, {
      $set: {
        is_redirect: data.isRedirect,
        redirect_target: data.redirectTarget,
      },
    }).exec();
  }

  /**
   * Add watcher
   */
  static async addWatcher(recordId: string, userId: string): Promise<void> {
    await this.ensureConnection();

    await Record.findByIdAndUpdate(recordId, {
      $addToSet: { watchers: new mongoose.Types.ObjectId(userId) },
    }).exec();
  }

  /**
   * Remove watcher
   */
  static async removeWatcher(recordId: string, userId: string): Promise<void> {
    await this.ensureConnection();

    await Record.findByIdAndUpdate(recordId, {
      $pull: { watchers: new mongoose.Types.ObjectId(userId) },
    }).exec();
  }

  /**
   * Get records by category
   */
  static async getRecordsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    await this.ensureConnection();

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find({ categories: { $in: [category] }, status: { $ne: 'DELETED' } })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Record.countDocuments({ categories: { $in: [category] }, status: { $ne: 'DELETED' } }).exec(),
    ]);

    return {
      records: RecordMapper.toListItemDTOs(records),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get records by tag
   */
  static async getRecordsByTag(
    tag: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    await this.ensureConnection();

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find({ tags: { $in: [tag] }, status: { $ne: 'DELETED' } })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Record.countDocuments({ tags: { $in: [tag] }, status: { $ne: 'DELETED' } }).exec(),
    ]);

    return {
      records: RecordMapper.toListItemDTOs(records),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get records by user
   */
  static async getRecordsByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    await this.ensureConnection();

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find({
        created_by: new mongoose.Types.ObjectId(userId),
        status: { $ne: 'DELETED' },
      })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Record.countDocuments({
        created_by: new mongoose.Types.ObjectId(userId),
        status: { $ne: 'DELETED' },
      }).exec(),
    ]);

    return {
      records: RecordMapper.toListItemDTOs(records),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trending records (most viewed in timeframe)
   */
  static async getTrendingRecords(
    limit: number = 10,
    timeframe: number = 7
  ): Promise<IRecord[]> {
    await this.ensureConnection();

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - timeframe);

    return Record.find({
      status: 'PUBLISHED',
      created_at: { $gte: dateThreshold },
    })
      .sort({ view_count: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get recently updated records
   */
  static async getRecentlyUpdated(limit: number = 10): Promise<IRecord[]> {
    await this.ensureConnection();

    return Record.find({ status: 'PUBLISHED' })
      .sort({ updated_at: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get featured records (highest quality)
   */
  static async getFeaturedRecords(limit: number = 10): Promise<IRecord[]> {
    await this.ensureConnection();

    return Record.find({
      status: 'PUBLISHED',
      quality_rating: { $in: ['FA', 'GA'] },
    })
      .sort({ view_count: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Check if slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    await this.ensureConnection();
    const record = await this.findBySlug(slug);
    return !record;
  }

  /**
   * Get watched records by user
   */
  static async getWatchedRecords(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedRecordsDTO> {
    await this.ensureConnection();

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find({
        watchers: new mongoose.Types.ObjectId(userId),
        status: { $ne: 'DELETED' },
      })
        .sort({ updated_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Record.countDocuments({
        watchers: new mongoose.Types.ObjectId(userId),
        status: { $ne: 'DELETED' },
      }).exec(),
    ]);

    return {
      records: RecordMapper.toListItemDTOs(records),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get records count by status
   */
  static async getRecordCountByStatus(): Promise<Record<string, number>> {
    await this.ensureConnection();

    const result = await Record.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const counts: Record<string, number> = {};
    result.forEach((item) => {
      counts[item._id] = item.count;
    });

    return counts;
  }

  /**
   * Get records count by category
   */
  static async getRecordCountByCategory(): Promise<Array<{ category: string; count: number }>> {
    await this.ensureConnection();

    return Record.aggregate([
      { $match: { status: { $ne: 'DELETED' } } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
        },
      },
    ]).exec();
  }

  /**
   * Get popular tags
   */
  static async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    await this.ensureConnection();

    return Record.aggregate([
      { $match: { status: 'PUBLISHED' } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
        },
      },
    ]).exec();
  }

  /**
   * Get related records (by categories and tags)
   */
  static async getRelatedRecords(
    recordId: string,
    limit: number = 5
  ): Promise<IRecord[]> {
    await this.ensureConnection();

    const record = await this.findById(recordId);
    if (!record) return [];

    return Record.find({
      _id: { $ne: recordId },
      status: 'PUBLISHED',
      $or: [
        { categories: { $in: record.categories } },
        { tags: { $in: record.tags } },
      ],
    })
      .sort({ view_count: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Bulk update records
   */
  static async bulkUpdateRecords(
    recordIds: string[],
    update: Partial<IRecord>
  ): Promise<number> {
    await this.ensureConnection();

    const result = await Record.updateMany(
      { _id: { $in: recordIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { $set: update }
    ).exec();

    return result.modifiedCount;
  }

  /**
   * Delete record permanently
   */
  static async deleteRecordPermanently(recordId: string): Promise<boolean> {
    await this.ensureConnection();

    const result = await Record.findByIdAndDelete(recordId).exec();
    return !!result;
  }

  /**
   * Get record edit count by user
   */
  static async getEditCountByUser(userId: string): Promise<number> {
    await this.ensureConnection();

    const records = await Record.find({
      'revisions.editor': new mongoose.Types.ObjectId(userId),
    }).exec();

    let totalEdits = 0;
    records.forEach((record) => {
      totalEdits += record.revisions.filter(
        (rev) => rev.editor.toString() === userId
      ).length;
    });

    return totalEdits;
  }

  /**
   * Get all categories
   */
  static async getAllCategories(): Promise<string[]> {
    await this.ensureConnection();

    const result = await Record.distinct('categories', {
      status: { $ne: 'DELETED' },
    }).exec();

    return result.sort();
  }

  /**
   * Get all tags
   */
  static async getAllTags(): Promise<string[]> {
    await this.ensureConnection();

    const result = await Record.distinct('tags', {
      status: { $ne: 'DELETED' },
    }).exec();

    return result.sort();
  }
}