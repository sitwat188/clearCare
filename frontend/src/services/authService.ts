/**
 * Authentication service
 * Handles OAuth flow and authentication
 */

import { setAccessToken, refreshAccessToken } from './api';
import { apiEndpoints } from './apiEndpoints';
import type { User, LoginCredentials, LoginResult, OAuthTokenResponse } from '../types/auth.types';

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
export const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
  try {
    console.log('[AuthService] Attempting login with:', credentials.email);

    const { api } = await import('./api');
    const response = await api.post('/auth/login', credentials);

    // Backend may return { success, data } or raw; data may be login result or 2FA required
    const payload = response.data?.data ?? response.data;
    const { requiresTwoFactor, twoFactorToken, message } = payload ?? {};

    if (requiresTwoFactor && twoFactorToken) {
      return { requiresTwoFactor: true, twoFactorToken, message };
    }

    const { user, accessToken, refreshToken, mustChangePassword } = payload ?? {};
    if (accessToken) {
      setAccessToken(accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      return { user, token: accessToken, mustChangePassword: mustChangePassword === true };
    }

    throw new Error('Login failed - no access token received');
  } catch (error: any) {
    console.error('[AuthService] Login error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    throw new Error(errorMessage);
  }
};

/**
 * Complete login with 2FA code (TOTP from authenticator app or backup code)
 */
export const verifyTwoFactor = async (
  twoFactorToken: string,
  code: string,
): Promise<{ user: User; token: string; mustChangePassword?: boolean }> => {
  try {
    const { api } = await import('./api');
    const response = await api.post('/auth/verify-2fa', { twoFactorToken, code });
    const payload = response.data?.data ?? response.data;
    const { user, accessToken, refreshToken, mustChangePassword } = payload ?? {};
    if (!accessToken || !user) {
      throw new Error('Invalid response from 2FA verification');
    }
    setAccessToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    return { user, token: accessToken, mustChangePassword: mustChangePassword === true };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      (error instanceof Error ? error.message : '2FA verification failed');
    throw new Error(message);
  }
};

/**
 * Start 2FA setup; returns QR code data URL and setupToken for verifySetupTwoFactor
 */
export const setupTwoFactor = async (): Promise<{
  secret: string;
  qrCodeDataUrl: string;
  setupToken: string;
  message: string;
}> => {
  try {
    const { api } = await import('./api');
    const response = await api.post('/auth/2fa/setup');
    const payload = response.data?.data ?? response.data;
    if (!payload?.setupToken || !payload?.qrCodeDataUrl) {
      throw new Error('Invalid 2FA setup response');
    }
    return payload;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      (error instanceof Error ? error.message : 'Failed to start 2FA setup');
    throw new Error(message);
  }
};

/**
 * Complete 2FA setup with 6-digit code from authenticator app; returns backup codes
 */
export const verifySetupTwoFactor = async (
  setupToken: string,
  code: string,
): Promise<{ backupCodes: string[]; message: string }> => {
  try {
    const { api } = await import('./api');
    const response = await api.post('/auth/2fa/verify-setup', { setupToken, code });
    const payload = response.data?.data ?? response.data;
    if (!payload?.backupCodes) {
      throw new Error('Invalid 2FA verify response');
    }
    return payload;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      (error instanceof Error ? error.message : 'Invalid code. Please try again.');
    throw new Error(message);
  }
};

/**
 * Disable 2FA (requires current password)
 */
export const disableTwoFactor = async (password: string): Promise<void> => {
  try {
    const { api } = await import('./api');
    await api.post('/auth/2fa/disable', { password });
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      (error instanceof Error ? error.message : 'Failed to disable 2FA');
    throw new Error(message);
  }
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (_code: string, _codeVerifier: string): Promise<OAuthTokenResponse> => {
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
  try {
    const { api } = await import('./api');
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('[AuthService] Get current user error:', error);
    return null;
  }
};

/**
 * Refresh access token using stored refresh token.
 * Uses the same logic as the api interceptor (no Bearer sent).
 */
export const refreshToken = async (): Promise<string | null> => {
  return refreshAccessToken();
};

/**
 * Request password reset
 */
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    await apiEndpoints.auth.forgotPassword(email);
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      (error instanceof Error ? error.message : 'Failed to request password reset');
    throw new Error(message);
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

/**
 * Change password while logged in (requires current password)
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  try {
    await apiEndpoints.auth.changePassword(currentPassword, newPassword);
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      (error instanceof Error ? error.message : 'Failed to change password');
    throw new Error(message);
  }
};
