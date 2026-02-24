/**
 * Authentication storage utilities
 * Uses sessionStorage (not localStorage) for auth state and refresh token
 * so tokens are cleared when the tab closes and exposure to XSS is reduced.
 */

import type { User } from '../types/auth.types';

const AUTH_STORAGE_KEY = 'clearcare_auth';
const REFRESH_TOKEN_KEY = 'refreshToken';

const storage = sessionStorage;

export interface PersistedAuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  timestamp: number; // To check if session is expired
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Save auth state to sessionStorage
 */
export const saveAuthState = (state: { user: User; token: string }): void => {
  try {
    const persistedState: PersistedAuthState = {
      user: state.user,
      accessToken: state.token,
      isAuthenticated: true,
      timestamp: Date.now(),
    };
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persistedState));
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
};

/**
 * Load auth state from sessionStorage
 */
export const loadAuthState = (): PersistedAuthState | null => {
  try {
    const stored = storage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const persistedState: PersistedAuthState = JSON.parse(stored);

    // Check if session is expired
    const now = Date.now();
    if (persistedState.timestamp && now - persistedState.timestamp > SESSION_DURATION) {
      // Session expired, clear storage
      clearAuthState();
      return null;
    }

    return persistedState;
  } catch (error) {
    console.error('Failed to load auth state:', error);
    clearAuthState();
    return null;
  }
};

/**
 * Update only the access token in persisted auth state (e.g. after refresh).
 */
export const updateAccessToken = (token: string): void => {
  try {
    const stored = storage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;
    const state: PersistedAuthState = JSON.parse(stored);
    state.accessToken = token;
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to update access token:', error);
  }
};

/** Get refresh token from sessionStorage (single source for key). */
export const getRefreshToken = (): string | null => storage.getItem(REFRESH_TOKEN_KEY);

/** Set or clear refresh token in sessionStorage. */
export const setRefreshToken = (token: string | null): void => {
  if (token) storage.setItem(REFRESH_TOKEN_KEY, token);
  else storage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Clear auth state and refresh token from sessionStorage
 */
export const clearAuthState = (): void => {
  try {
    storage.removeItem(AUTH_STORAGE_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
};

/**
 * Check if auth state exists and is valid
 */
export const hasValidAuthState = (): boolean => {
  const state = loadAuthState();
  return state !== null && state.isAuthenticated && state.user !== null && state.accessToken !== null;
};
