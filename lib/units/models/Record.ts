import mongoose, { Document, Schema, Model } from 'mongoose';

export const articleStatusDB = [
  'DRAFT',           // Draft article
  'PUBLISHED',       // Published article
  'UNDER_REVIEW',    // Under editorial review
  'FLAGGED',         // Flagged for issues
  'PROTECTED',       // Protected from editing
  'DELETED',         // Soft deleted
] as const;

export const protectionLevelDB = [
  'NONE',            // No protection
  'SEMI',            // Semi-protected (autoconfirmed users can edit)
  'EXTENDED',        // Extended confirmed users can edit
  'FULL',            // Only admins can edit
  'CASCADE',         // Cascading protection
] as const;

interface IRevision {
  editor: mongoose.Types.ObjectId;
  editor_username: string;
  timestamp: Date;
  content: string;
  edit_summary?: string;
  is_minor_edit: boolean;
  revision_size: number;
  diff?: string;
}

interface IReference {
  title: string;
  url?: string;
  author?: string;
  publication?: string;
  date?: string;
  access_date?: string;
  citation_format?: string;
}

export interface IRecord extends Document {
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: typeof articleStatusDB[number];
  protection_level: typeof protectionLevelDB[number];
  
  // Article metadata
  categories: string[];
  tags: string[];
  infobox?: Record<string, any>;
  
  // Editorial information
  created_by: mongoose.Types.ObjectId;
  created_by_username: string;
  last_edited_by?: mongoose.Types.ObjectId;
  last_edited_by_username?: string;
  
  // Revision history
  revisions: IRevision[];
  current_revision: number;
  
  // References and citations
  references: IReference[];
  external_links: string[];
  
  // Article statistics
  view_count: number;
  edit_count: number;
  watchers: mongoose.Types.ObjectId[];
  
  // Content quality
  quality_rating?: 'STUB' | 'START' | 'C' | 'B' | 'GA' | 'FA';
  importance_rating?: 'LOW' | 'MID' | 'HIGH' | 'TOP';
  
  // Protection and flags
  protection_reason?: string;
  protection_expires?: Date;
  is_disambiguation: boolean;
  is_redirect: boolean;
  redirect_target?: string;
  
  // Discussions and disputes
  has_active_discussion: boolean;
  is_disputed: boolean;
  dispute_tags: string[];
  
  // Timestamps
  published_at?: Date;
  last_reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;

  // Methods
  addRevision(editor: mongoose.Types.ObjectId, content: string, summary?: string, isMinor?: boolean): Promise<void>;
  getRevisionHistory(limit?: number): IRevision[];
  rollbackToRevision(revisionNumber: number): Promise<void>;
  incrementViewCount(): Promise<void>;
}

const RevisionSchema = new Schema<IRevision>({
  editor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  editor_username: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  content: {
    type: String,
    required: true,
  },
  edit_summary: {
    type: String,
    maxlength: 500,
  },
  is_minor_edit: {
    type: Boolean,
    default: false,
  },
  revision_size: {
    type: Number,
    required: true,
  },
  diff: {
    type: String,
  },
});

const ReferenceSchema = new Schema<IReference>({
  title: {
    type: String,
    required: true,
  },
  url: String,
  author: String,
  publication: String,
  date: String,
  access_date: String,
  citation_format: String,
});

const RecordSchema = new Schema<IRecord>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
      index: 'text',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: articleStatusDB,
      default: 'DRAFT',
      required: true,
    },
    protection_level: {
      type: String,
      enum: protectionLevelDB,
      default: 'NONE',
      required: true,
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    infobox: {
      type: Schema.Types.Mixed,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    created_by_username: {
      type: String,
      required: true,
    },
    last_edited_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    last_edited_by_username: {
      type: String,
    },
    content_type :{
      type: String,
      default : 'html'
    },
    revisions: [RevisionSchema],
    current_revision: {
      type: Number,
      default: 0,
    },
    references: [ReferenceSchema],
    external_links: {
      type: [String],
      default: [],
    },
    view_count: {
      type: Number,
      default: 0,
    },
    edit_count: {
      type: Number,
      default: 0,
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    quality_rating: {
      type: String,
      enum: ['STUB', 'START', 'C', 'B', 'GA', 'FA'],
    },
    importance_rating: {
      type: String,
      enum: ['LOW', 'MID', 'HIGH', 'TOP'],
    },
    protection_reason: {
      type: String,
      maxlength: 500,
    },
    protection_expires: {
      type: Date,
    },
    is_disambiguation: {
      type: Boolean,
      default: false,
    },
    is_redirect: {
      type: Boolean,
      default: false,
    },
    redirect_target: {
      type: String,
    },
    has_active_discussion: {
      type: Boolean,
      default: false,
    },
    is_disputed: {
      type: Boolean,
      default: false,
    },
    dispute_tags: {
      type: [String],
      default: [],
    },
    published_at: {
      type: Date,
    },
    schemaOrg:{
      type : Object,
      default: {}
    },
    last_reviewed_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Add a new revision
RecordSchema.methods.addRevision = async function (
  editor: mongoose.Types.ObjectId,
  content: string,
  editor_username: string,
  summary?: string,
  isMinor: boolean = false
): Promise<void> {
  const revision: IRevision = {
    editor,
    editor_username: editor_username, // Should be populated from User
    timestamp: new Date(),
    content,
    edit_summary: summary,
    is_minor_edit: isMinor,
    revision_size: content.length,
  };

  this.revisions.push(revision);
  this.current_revision = this.revisions.length - 1;
  this.content = content;
  this.edit_count += 1;
  this.last_edited_by = editor;

  await this.save();
};

// Get revision history
RecordSchema.methods.getRevisionHistory = function (limit: number = 50): IRevision[] {
  return this.revisions.slice(-limit).reverse();
};

// Rollback to a specific revision
RecordSchema.methods.rollbackToRevision = async function (
  revisionNumber: number
): Promise<void> {
  if (revisionNumber < 0 || revisionNumber >= this.revisions.length) {
    throw new Error('Invalid revision number');
  }

  const targetRevision = this.revisions[revisionNumber];
  this.content = targetRevision.content;
  this.current_revision = revisionNumber;

  await this.save();
};

// Increment view count
RecordSchema.methods.incrementViewCount = async function (): Promise<void> {
  this.view_count += 1;
  await this.save();
};

// Pre-save middleware for initial revision
RecordSchema.pre<IRecord>('save', async function (next) {
  if (this.isNew && this.revisions.length === 0) {
    this.revisions.push({
      editor: this.created_by,
      editor_username: this.created_by_username,
      timestamp: new Date(),
      content: this.content,
      edit_summary: 'Initial creation',
      is_minor_edit: false,
      revision_size: this.content.length,
    } as IRevision);
    this.current_revision = 0;
    this.edit_count = 1;
  }
  next();
});

// Indexes for performance
RecordSchema.index({ slug: 1 });
RecordSchema.index({ status: 1 });
RecordSchema.index({ created_by: 1 });
RecordSchema.index({ categories: 1 });
RecordSchema.index({ tags: 1 });
RecordSchema.index({ created_at: -1 });
RecordSchema.index({ view_count: -1 });
RecordSchema.index({ title: 'text', content: 'text' });
RecordSchema.index({ protection_expires: 1 }, { expireAfterSeconds: 0 });

export const Record: Model<IRecord> =
  mongoose.models.Record || mongoose.model<IRecord>('records', RecordSchema);