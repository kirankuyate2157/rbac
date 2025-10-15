// src/types/user.types.js

/** -------------------
 * DTOs for User operations
 * ------------------- */

/** Data required to create a user */
export interface CreateUserDto {
  name: string;
  email: string;
  password_hash: string;
  role?: "admin" | "user" | "manager"; // optional, can enforce roles
  tenantId?: string;
}

/** Data allowed to update for a user */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password_hash?: string;
  role?: "admin" | "user" | "manager"; // optional, same as create
  isActive?: boolean;
}

/** DTO for login request */
export interface LoginDto {
  email: string;
  password_hash: string;
}

/** Auth payload returned after login */
export interface AuthPayload {
  userId: string;
  tenantId?: string;
  role?: "admin" | "user" | "manager";
}

/** Optional: Pagination parameters */
export interface PaginationParams {
  skip?: number;
  take?: number;
}
