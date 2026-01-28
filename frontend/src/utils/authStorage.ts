/**
 * Authentication storage utilities
 * Handles persisting auth state to localStorage
 */

import type { User } from '../types/auth.types';

const AUTH_STORAGE_KEY = 'clearcare_auth';

export interface PersistedAuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  timestamp: number; // To check if session is expired
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Save auth state to localStorage
 */
export const saveAuthState = (state: { user: User; token: string }): void => {
  try {
    const persistedState: PersistedAuthState = {
      user: state.user,
      accessToken: state.token,
      isAuthenticated: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persistedState));
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
};

/**
 * Load auth state from localStorage
 */
export const loadAuthState = (): PersistedAuthState | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
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
 * Clear auth state from localStorage
 */
export const clearAuthState = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
