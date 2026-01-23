/**
 * Authentication service
 * Handles OAuth flow and authentication
 */

import { setAccessToken } from './api';
import { apiEndpoints } from './apiEndpoints';
import type { User, LoginCredentials, OAuthTokenResponse } from '../types/auth.types';

/**
 * Simulates OAuth PKCE flow
 * In production, this would handle the actual OAuth 2.0 flow
 */
export const generatePKCE = () => {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = btoa(codeVerifier); // Simplified - should use SHA256 in production
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
};

const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Login with credentials
 */
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  try {
    console.log('[AuthService] Attempting login with:', credentials.email);
    const response = await apiEndpoints.auth.login(credentials);
    console.log('[AuthService] Login response:', response);
    if (response.success && response.data) {
      setAccessToken(response.data.token);
      return response.data;
    }
    console.error('[AuthService] Login failed - invalid response:', response);
    throw new Error('Login failed - invalid response');
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (code: string, codeVerifier: string): Promise<OAuthTokenResponse> => {
  // Simulate OAuth token exchange
  // In production, this would call the actual OAuth token endpoint
  const tokenResponse: OAuthTokenResponse = {
    access_token: `mock-access-token-${Date.now()}`,
    refresh_token: `mock-refresh-token-${Date.now()}`,
    id_token: `mock-id-token-${Date.now()}`,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'openid profile email',
  };

  setAccessToken(tokenResponse.access_token);
  return tokenResponse;
};

/**
 * Logout
 */
export const logout = (): void => {
  setAccessToken(null);
  // Clear any other auth-related data
};

/**
 * Get current user (from token or session)
 */
export const getCurrentUser = async (): Promise<User | null> => {
  // In production, decode JWT token or fetch from API
  // For mock, return null and let components handle it
  return null;
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<string | null> => {
  // TODO: Implement actual token refresh
  return null;
};

/**
 * Request password reset
 */
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    await apiEndpoints.auth.forgotPassword(email);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to request password reset');
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    await apiEndpoints.auth.resetPassword(token, newPassword);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
  }
};
