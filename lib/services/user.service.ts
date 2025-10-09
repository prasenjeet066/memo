// lib/services/user.service.ts

import { UserDAL } from '@/lib/dal/user.dal';
import { UserMapper } from '@/lib/mappers/user.mapper';
import {
  RegisterUserDTO,
  UpdateUserDTO,
  UserProfileDTO,
  PasswordResetRequestDTO,
  PasswordResetDTO,
  PaginatedUsersDTO,
  UserStatsDTO,
} from '@/lib/dtos/user.dto';

/**
 * Service Layer for User business logic
 * Sits between controllers/routes and the data access layer
 */
export class UserService {
  /**
   * Register a new user
   */
  static async registerUser(data: RegisterUserDTO): Promise<{
    success: boolean;
    user?: UserProfileDTO;
    error?: string;
  }> {
    try {
      // Check if user exists
      const exists = await UserDAL.existsByEmailOrUsername(
        data.email,
        data.username
      );

      if (exists) {
        const emailUser = await UserDAL.findByEmail(data.email);
        const field = emailUser ? 'email' : 'username';
        return {
          success: false,
          error: `A user with this ${field} already exists`,
        };
      }

      // Create user
      const user = await UserDAL.createUser(data);

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, user.emailVerificationToken);

      return {
        success: true,
        user: UserMapper.toProfileDTO(user),
      };
    } catch (error) {
      console.error('User registration error:', error);
      return {
        success: false,
        error: 'Failed to register user',
      };
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfileDTO | null> {
    try {
      const user = await UserDAL.findById(userId);
      if (!user) {
        return null;
      }
      return UserMapper.toProfileDTO(user);
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Get user profile by username
   */
  static async getUserProfileByUsername(
    username: string
  ): Promise<UserProfileDTO | null> {
    try {
      const user = await UserDAL.findByUsername(username);
      if (!user) {
        return null;
      }
      return UserMapper.toProfileDTO(user);
    } catch (error) {
      console.error('Get user profile by username error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    data: UpdateUserDTO
  ): Promise<{
    success: boolean;
    user?: UserProfileDTO;
    error?: string;
  }> {
    try {
      const user = await UserDAL.updateUser(userId, data);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: UserMapper.toProfileDTO(user),
      };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }
  }

  /**
   * Verify user email
   */
  static async verifyEmail(token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const user = await UserDAL.verifyEmail(token);

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired verification token',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: 'Failed to verify email',
      };
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(
    data: PasswordResetRequestDTO
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await UserDAL.generatePasswordResetToken(data.email);

      if (!result) {
        // Don't reveal if user exists for security
        return { success: true };
      }

      // TODO: Send password reset email
      // await EmailService.sendPasswordResetEmail(result.user.email, result.token);

      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Failed to process password reset request',
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(data: PasswordResetDTO): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const user = await UserDAL.resetPassword(data.token, data.newPassword);

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired reset token',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Failed to reset password',
      };
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const deleted = await UserDAL.deleteUser(userId);

      if (!deleted) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: 'Failed to delete user',
      };
    }
  }

  /**
   * Get paginated users
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
    try {
      return await UserDAL.getPaginatedUsers(page, limit, filters);
    } catch (error) {
      console.error('Get paginated users error:', error);
      return {
        users: [],
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
   * Search users
   */
  static async searchUsers(searchTerm: string, limit: number = 10) {
    try {
      const users = await UserDAL.searchUsers(searchTerm, limit);
      return UserMapper.toListItemDTOs(users);
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<UserStatsDTO | null> {
    try {
      return await UserDAL.getUserStats(userId);
    } catch (error) {
      console.error('Get user stats error:', error);
      return null;
    }
  }

  /**
   * Check username availability
   */
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      return await UserDAL.isUsernameAvailable(username);
    } catch (error) {
      console.error('Check username availability error:', error);
      return false;
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string) {
    try {
      const users = await UserDAL.getUsersByRole(role);
      return UserMapper.toListItemDTOs(users);
    } catch (error) {
      console.error('Get users by role error:', error);
      return [];
    }
  }
}