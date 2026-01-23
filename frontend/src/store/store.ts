/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { loadAuthState } from '../utils/authStorage';
import { setAccessToken } from '../services/api';

// Load persisted auth state and set API token
const persistedState = loadAuthState();
if (persistedState?.accessToken) {
  setAccessToken(persistedState.accessToken);
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
