import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api.types';
import { clearAuthState, updateAccessToken, getRefreshToken, setRefreshToken } from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// In-memory access token (auth state + refresh token in sessionStorage via authStorage)
let accessToken: string | null = null;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

// Create axios instance (simple, no mock adapter)
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Call backend POST /auth/refresh with refresh token; return new access token or null. */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Use raw axios so we don't attach the expired Bearer token
    const { data } = await axios.post<{ success?: boolean; data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    const payload = data?.data ?? data;
    const newAccessToken = payload?.accessToken ?? null;
    const newRefreshToken = payload?.refreshToken;
    if (newAccessToken) {
      setRefreshToken(newRefreshToken ?? null);
      updateAccessToken(newAccessToken);
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
};

const handleLogout = (): void => {
  setAccessToken(null);
  clearAuthState();
  window.location.href = '/login';
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          setAccessToken(newToken);
          return api(originalRequest);
        }
      } catch {
        // fall through to logout
      }
      handleLogout();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;