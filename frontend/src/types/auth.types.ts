/**
 * Authentication and authorization types
 */

export type UserRole = 'patient' | 'provider' | 'administrator';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  organizationId?: string;
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  /** Admin list: 'active' | 'inactive' (soft-deleted) */
  status?: 'active' | 'inactive';
  /** Admin list: ISO date when soft-deleted, null when active */
  deletedAt?: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Result of login: either full success (optionally must change password) or 2FA required */
export type LoginResult =
  | { user: User; token: string; mustChangePassword?: boolean }
  | { requiresTwoFactor: true; twoFactorToken: string; message?: string };
