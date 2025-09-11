import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * TypeScript Interface for User Document
 */
export interface IUser extends Document {
  user_handler: string;
  user_full_name: string;
  user_names_format: string[];
  user_dob: string;
  user_role: ('user' | 'bot' | 'admin')[];
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

  comparePassword(candidatePassword: string): Promise<boolean>;
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
      required: true,
    },
    user_role: {
      type: [String],
      enum: ['user', 'bot', 'admin'],
      required: true,
      default: ['user'],
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

/**
 * Pre-save Middleware to Hash Password
 */
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

/**
 * Compare Password Method
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Indexes for Performance and TTL
 */
UserSchema.index({ user_handler: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 });
UserSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 });

/**
 * Export Mongoose Model
 */
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('users', UserSchema);