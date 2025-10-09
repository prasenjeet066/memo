// lib/dtos/user.dto.ts

/**
 * Data Transfer Objects for User-related operations
 * These DTOs ensure type safety and define the contract between layers
 */

// Base User DTO (common fields)
export interface BaseUserDTO {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string[];
  isEmailVerified: boolean;
}

// User Registration DTO (input)
export interface RegisterUserDTO {
  email: string;
  password: string;
  username: string;
  fullName: string;
  dob: string;
}

// User Login DTO (input)
export interface LoginUserDTO {
  usernameOrEmail: string;
  password: string;
}

// User Profile DTO (output)
export interface UserProfileDTO extends BaseUserDTO {
  bio ? : string;
  profileImageUrl ? : string;
  dob ? : string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin ? : Date;
  oauthProvider ? : string;
}

// User Update DTO (input)
export interface UpdateUserDTO {
  fullName ? : string;
  bio ? : string;
  profileImageUrl ? : string;
}

// User Session DTO (for NextAuth)
export interface UserSessionDTO {
  id: string;
  email: string;
  name: string;
  image ? : string;
  role: string[];
  username: string;
  isEmailVerified: boolean;
}

// User List DTO (for admin/search)
export interface UserListItemDTO {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string[];
  isEmailVerified: boolean;
  createdAt: Date;
  lastLogin ? : Date;
}

// Email Verification DTO
export interface EmailVerificationDTO {
  token: string;
  userId: string;
}

// Password Reset DTO
export interface PasswordResetRequestDTO {
  email: string;
}

export interface PasswordResetDTO {
  token: string;
  newPassword: string;
}

// OAuth User Creation DTO
export interface OAuthUserDTO {
  email: string;
  fullName: string;
  username: string;
  profileImageUrl ? : string;
  oauthProvider: 'google' | 'github';
}

// Pagination DTO
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated User List Response
export interface PaginatedUsersDTO {
  users: UserListItemDTO[];
  pagination: PaginationDTO;
}

// User Statistics DTO
export interface UserStatsDTO {
  totalArticlesCreated: number;
  totalArticlesEdited: number;
  accountAge: number; // in days
  lastActiveDate ? : Date;
}