import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const wikipediaUserRolesDB = [
  'IP',        // Unregistered Users
  'REG',       // Registered Users
  'AC',        // Autoconfirmed Users
  'EC',        // Extended Confirmed Users
  'ADMIN',     // Administrators
  'BUC',       // Bureaucrats
  'CU',        // Checkusers
  'OS',        // Oversighters
  'TE',        // Template Editors
  'STEW',      // Stewards
  'ARBC',      // Arbitration Committee Members
  'BOT',       // Bot Operators
] as const;

export interface IUser extends Document {
  user_handler: string;
  user_full_name: string;
  user_names_format: string[];
  user_dob?: string;
  user_role: string[];
  email: string;
  password: string;
  bio?: string;
  profile_image_url?: string;
  is_email_verified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  created_articles: mongoose.Types.ObjectId[];
  edited_articles: mongoose.Types.ObjectId[];
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  failed_login_attempts: number;
  account_locked_until?: Date;
  oauth_provider?: string;

  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementFailedLogins(): Promise<void>;
  resetFailedLogins(): Promise<void>;
  isAccountLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    user_handler: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    user_full_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    user_names_format: {
      type: [String],
      default: [],
    },
    user_dob: {
      type: String,
      required: false,
    },
    user_role: {
      type: [String],
      enum: wikipediaUserRolesDB,
      required: true,
      default: ['REG'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    profile_image_url: {
      type: String,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    created_articles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
    edited_articles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
    last_login: {
      type: Date,
    },
    failed_login_attempts: {
      type: Number,
      default: 0,
    },
    account_locked_until: {
      type: Date,
    },
    oauth_provider: {
      type: String,
      enum: ['google', 'github', null],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Pre-save Middleware to Hash Password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare Password Method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Increment failed login attempts
UserSchema.methods.incrementFailedLogins = async function (): Promise<void> {
  this.failed_login_attempts += 1;

  // Lock account for 1 hour after 5 failed attempts
  if (this.failed_login_attempts >= 5) {
    this.account_locked_until = new Date(Date.now() + 60 * 60 * 1000);
  }

  await this.save();
};

// Reset failed login attempts
UserSchema.methods.resetFailedLogins = async function (): Promise<void> {
  if (this.failed_login_attempts !== 0 || this.account_locked_until) {
    this.failed_login_attempts = 0;
    this.account_locked_until = undefined;
    await this.save();
  }
};

// Check if account is locked
UserSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.account_locked_until && this.account_locked_until > new Date());
};

// Indexes for Performance
UserSchema.index({ user_handler: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 });
UserSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('users', UserSchema);
