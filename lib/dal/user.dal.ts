// lib/dal/user.dal.ts

import { User, IUser } from '@/lib/units/models/User';
import { connectDB } from '@/lib/security/auth/db/provider';
import {
  RegisterUserDTO,
  UpdateUserDTO,
  OAuthUserDTO,
  PaginatedUsersDTO,
} from '@/lib/dtos/user.dto';
import { UserMapper } from '@/lib/mappers/user.mapper';
import crypto from 'crypto';

/**
 * Data Access Layer for User operations
 * Handles all database interactions for users
 */
export class UserDAL {
  /**
   * Ensure database connection before operations
   */
  private static async ensureConnection(): Promise<void> {
    await connectDB();
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string): Promise<IUser | null> {
    await this.ensureConnection();
    return User.findById(userId).exec();
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    await this.ensureConnection();
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<IUser | null> {
    await this.ensureConnection();
    return User.findOne({ user_handler: username.toLowerCase() }).exec();
  }

  /**
   * Find user by email or username
   */
  static async findByEmailOrUsername(
    identifier: string
  ): Promise<IUser | null> {
    await this.ensureConnection();
    return User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { user_handler: identifier.toLowerCase() },
      ],
    }).exec();
  }

  /**
   * Check if user exists by email or username
   */
  static async existsByEmailOrUsername(
    email: string,
    username: string
  ): Promise<boolean> {
    await this.ensureConnection();
    const count = await User.countDocuments({
      $or: [{ email: email.toLowerCase() }, { user_handler: username.toLowerCase() }],
    }).exec();
    return count > 0;
  }

  /**
   * Create a new user
   */
  static async createUser(data: RegisterUserDTO): Promise<IUser> {
    await this.ensureConnection();

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      email: data.email.toLowerCase(),
      password: data.password,
      user_handler: data.username.toLowerCase(),
      user_full_name: data.fullName,
      user_dob: data.dob,
      user_role: ['REG'],
      emailVerificationToken,
      emailVerificationExpires,
      is_email_verified: false,
    });

    return user.save();
  }

  /**
   * Create OAuth user
   */
  static async createOAuthUser(data: OAuthUserDTO): Promise<IUser> {
    await this.ensureConnection();

    // Generate secure random password for OAuth users
    const securePassword = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email: data.email.toLowerCase(),
      user_full_name: data.fullName,
      user_handler: data.username.toLowerCase(),
      password: securePassword,
      is_email_verified: true,
      profile_image_url: data.profileImageUrl,
      oauth_provider: data.oauthProvider,
      user_role: ['REG'],
    });

    return user.save();
  }

  /**
   * Update user profile
   */
  static async updateUser(
    userId: string,
    data: UpdateUserDTO
  ): Promise<IUser | null> {
    await this.ensureConnection();

    return User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(data.fullName && { user_full_name: data.fullName }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.profileImageUrl !== undefined && {
            profile_image_url: data.profileImageUrl,
          }),
        },
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await this.ensureConnection();
    await User.findByIdAndUpdate(userId, {
      $set: { last_login: new Date() },
    }).exec();
  }

  /**
   * Verify user email
   */
  static async verifyEmail(token: string): Promise<IUser | null> {
    await this.ensureConnection();

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).exec();

    if (!user) {
      return null;
    }

    user.is_email_verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    return user.save();
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(
    email: string
  ): Promise<{ user: IUser; token: string } | null> {
    await this.ensureConnection();

    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    return { user, token: resetToken };
  }

  /**
   * Reset password using token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<IUser | null> {
    await this.ensureConnection();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).exec();

    if (!user) {
      return null;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.failed_login_attempts = 0;
    user.account_locked_until = undefined;

    return user.save();
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await User.findByIdAndDelete(userId).exec();
    return !!result;
  }

  /**
   * Get paginated users list
   */
  static async getPaginatedUsers(
    page: number = 1,
    limit: number = 20,
    filters?: {
      role?: string;
      isEmailVerified?: boolean;
      search?: string;
    }
  ): Promise<PaginatedUsersDTO> {
    await this.ensureConnection();

    const query: any = {};

    if (filters?.role) {
      query.user_role = { $in: [filters.role] };
    }

    if (filters?.isEmailVerified !== undefined) {
      query.is_email_verified = filters.isEmailVerified;
    }

    if (filters?.search) {
      query.$or = [
        { user_handler: { $regex: filters.search, $options: 'i' } },
        { user_full_name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(query).exec(),
    ]);

    return {
      users: UserMapper.toListItemDTOs(users),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string): Promise<IUser[]> {
    await this.ensureConnection();
    return User.find({ user_role: { $in: [role] } })
      .sort({ created_at: -1 })
      .exec();
  }

  /**
   * Search users
   */
  static async searchUsers(
    searchTerm: string,
    limit: number = 10
  ): Promise<IUser[]> {
    await this.ensureConnection();

    return User.find({
      $or: [
        { user_handler: { $regex: searchTerm, $options: 'i' } },
        { user_full_name: { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .limit(limit)
      .exec();
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    await this.ensureConnection();

    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    return UserMapper.toStatsDTO(user);
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    await this.ensureConnection();
    const user = await this.findByUsername(username);
    return !user;
  }

  /**
   * Generate unique username from base
   */
  static async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername.toLowerCase();
    let counter = 1;

    while (!(await this.isUsernameAvailable(username))) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }
}