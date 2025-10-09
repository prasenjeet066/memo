// lib/mappers/user.mapper.ts

import { IUser } from '@/lib/units/models/User';
import {
  UserProfileDTO,
  UserSessionDTO,
  UserListItemDTO,
  BaseUserDTO,
  UserStatsDTO,
} from '@/lib/dtos/user.dto';

/**
 * Mapper class to convert between database models and DTOs
 * This provides a clean separation between data layers
 */
export class UserMapper {
  /**
   * Convert User model to Profile DTO
   */
  static toProfileDTO(user: IUser): UserProfileDTO {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.user_handler,
      fullName: user.user_full_name,
      role: user.user_role,
      isEmailVerified: user.is_email_verified,
      bio: user.bio,
      profileImageUrl: user.profile_image_url,
      dob: user.user_dob,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
      oauthProvider: user.oauth_provider,
    };
  }
  
  /**
   * Convert User model to Session DTO (for NextAuth)
   */
  static toSessionDTO(user: IUser): UserSessionDTO {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.user_full_name,
      image: user.profile_image_url || undefined,
      role: user.user_role,
      username: user.user_handler,
      isEmailVerified: user.is_email_verified,
    };
  }
  
  /**
   * Convert User model to List Item DTO
   */
  static toListItemDTO(user: IUser): UserListItemDTO {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.user_handler,
      fullName: user.user_full_name,
      role: user.user_role,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };
  }
  
  /**
   * Convert User model to Base DTO
   */
  static toBaseDTO(user: IUser): BaseUserDTO {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.user_handler,
      fullName: user.user_full_name,
      role: user.user_role,
      isEmailVerified: user.is_email_verified,
    };
  }
  
  /**
   * Convert User model to Statistics DTO
   */
  static toStatsDTO(user: IUser): UserStatsDTO {
    const accountAge = Math.floor(
      (Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      totalArticlesCreated: user.created_articles?.length || 0,
      totalArticlesEdited: user.edited_articles?.length || 0,
      accountAge,
      lastActiveDate: user.last_login,
    };
  }
  
  /**
   * Convert multiple User models to List Item DTOs
   */
  static toListItemDTOs(users: IUser[]): UserListItemDTO[] {
    return users.map((user) => this.toListItemDTO(user));
  }
  
  /**
   * Sanitize user data for public display (remove sensitive fields)
   */
  static toPublicDTO(user: IUser): Omit < UserProfileDTO, 'email' | 'dob' > {
    const profile = this.toProfileDTO(user);
    const { email, dob, ...publicData } = profile;
    return publicData;
  }
}