// lib/dal/base.dal.ts

import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { connectDB } from '@/lib/security/auth/db/provider';

/**
 * Generic Base Data Access Layer
 * Provides common CRUD operations for any model
 */
export class BaseDAL < T extends Document > {
  protected model: Model < T > ;
  
  constructor(model: Model < T > ) {
    this.model = model;
  }
  
  /**
   * Ensure database connection
   */
  protected async ensureConnection(): Promise < void > {
    await connectDB();
  }
  
  /**
   * Find document by ID
   */
  async findById(id: string): Promise < T | null > {
    await this.ensureConnection();
    return this.model.findById(id).exec();
  }
  
  /**
   * Find one document matching filter
   */
  async findOne(filter: FilterQuery < T > ): Promise < T | null > {
    await this.ensureConnection();
    return this.model.findOne(filter).exec();
  }
  
  /**
   * Find multiple documents
   */
  async find(filter: FilterQuery < T > = {}, options ? : {
    limit ? : number;
    skip ? : number;
    sort ? : any;
    select ? : string;
  }): Promise < T[] > {
    await this.ensureConnection();
    
    let query = this.model.find(filter);
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.skip) {
      query = query.skip(options.skip);
    }
    
    if (options?.sort) {
      query = query.sort(options.sort);
    }
    
    if (options?.select) {
      query = query.select(options.select);
    }
    
    return query.exec();
  }
  
  /**
   * Create a new document
   */
  async create(data: Partial < T > ): Promise < T > {
    await this.ensureConnection();
    const document = new this.model(data);
    return document.save();
  }
  
  /**
   * Create multiple documents
   */
  async createMany(data: Partial < T > []): Promise < T[] > {
    await this.ensureConnection();
    return this.model.insertMany(data);
  }
  
  /**
   * Update document by ID
   */
  async updateById(
    id: string,
    update: UpdateQuery < T > ,
    options ? : { new ? : boolean;runValidators ? : boolean }
  ): Promise < T | null > {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(id, update, {
      new: options?.new ?? true,
      runValidators: options?.runValidators ?? true,
    }).exec();
  }
  
  /**
   * Update one document
   */
  async updateOne(
    filter: FilterQuery < T > ,
    update: UpdateQuery < T > ,
    options ? : { new ? : boolean;runValidators ? : boolean }
  ): Promise < T | null > {
    await this.ensureConnection();
    return this.model.findOneAndUpdate(filter, update, {
      new: options?.new ?? true,
      runValidators: options?.runValidators ?? true,
    }).exec();
  }
  
  /**
   * Update multiple documents
   */
  async updateMany(
    filter: FilterQuery < T > ,
    update: UpdateQuery < T >
  ): Promise < { matchedCount: number;modifiedCount: number } > {
    await this.ensureConnection();
    const result = await this.model.updateMany(filter, update).exec();
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }
  
  /**
   * Delete document by ID
   */
  async deleteById(id: string): Promise < boolean > {
    await this.ensureConnection();
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
  
  /**
   * Delete one document
   */
  async deleteOne(filter: FilterQuery < T > ): Promise < boolean > {
    await this.ensureConnection();
    const result = await this.model.findOneAndDelete(filter).exec();
    return !!result;
  }
  
  /**
   * Delete multiple documents
   */
  async deleteMany(filter: FilterQuery < T > ): Promise < number > {
    await this.ensureConnection();
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount || 0;
  }
  
  /**
   * Count documents
   */
  async count(filter: FilterQuery < T > = {}): Promise < number > {
    await this.ensureConnection();
    return this.model.countDocuments(filter).exec();
  }
  
  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery < T > ): Promise < boolean > {
    await this.ensureConnection();
    const count = await this.model.countDocuments(filter).limit(1).exec();
    return count > 0;
  }
  
  /**
   * Get paginated results
   */
  async paginate(
    filter: FilterQuery < T > = {},
    page: number = 1,
    limit: number = 20,
    sort: any = { createdAt: -1 }
  ): Promise < {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } > {
    await this.ensureConnection();
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  /**
   * Aggregate query
   */
  async aggregate(pipeline: any[]): Promise < any[] > {
    await this.ensureConnection();
    return this.model.aggregate(pipeline).exec();
  }
  
  /**
   * Bulk write operations
   */
  async bulkWrite(operations: any[]): Promise < any > {
    await this.ensureConnection();
    return this.model.bulkWrite(operations);
  }
}