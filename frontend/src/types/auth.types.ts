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

/** Result of login: either full success or 2FA required */
export type LoginResult =
  | { user: User; token: string }
  | { requiresTwoFactor: true; twoFactorToken: string; message?: string };
