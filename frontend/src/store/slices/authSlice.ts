/**
 * Redux slice for authentication state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '../../types/auth.types';
import { loadAuthState, saveAuthState, clearAuthState } from '../../utils/authStorage';
import { setAccessToken } from '../../services/api';

// Load initial state from sessionStorage (authStorage)
const persistedState = loadAuthState();

const initialState: AuthState = {
  user: persistedState?.user || null,
  accessToken: persistedState?.accessToken || null,
  isAuthenticated: persistedState?.isAuthenticated || false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      // Persist to sessionStorage
      saveAuthState(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      // Clear sessionStorage and API token
      clearAuthState();
      setAccessToken(null);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setLoading, setError, loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
