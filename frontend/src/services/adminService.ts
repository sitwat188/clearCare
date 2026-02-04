/**
 * Admin service
 * Handles admin-related API calls
 */

import { apiEndpoints } from './apiEndpoints';
import type { User } from '../types/auth.types';
import type { Role, AuditLog, SystemSettings, AdminReport } from '../types/admin.types';

export const adminService = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await apiEndpoints.admin.getUsers();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  },

  /**
   * Get user by ID
   */
  getUser: async (id: string): Promise<User> => {
    try {
      const response = await apiEndpoints.admin.getUser(id);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  },

  /**
   * Create user
   */
  createUser: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await apiEndpoints.admin.createUser(userData);
      return response.data;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to create user');
      throw new Error(message);
    }
  },

  /**
   * Update user
   */
  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    try {
      const response = await apiEndpoints.admin.updateUser(id, updates);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  },

  /**
   * Delete user
   */
  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiEndpoints.admin.deleteUser(id);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  },

  /**
   * Get all roles
   */
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiEndpoints.admin.getRoles();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch roles');
    }
  },

  /**
   * Get role by ID
   */
  getRole: async (id: string): Promise<Role> => {
    try {
      const response = await apiEndpoints.admin.getRole(id);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch role');
    }
  },

  /**
   * Create role
   */
  createRole: async (roleData: Partial<Role>): Promise<Role> => {
    try {
      const response = await apiEndpoints.admin.createRole(roleData);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create role');
    }
  },

  /**
   * Update role
   */
  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    try {
      const response = await apiEndpoints.admin.updateRole(id, updates);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update role');
    }
  },

  /**
   * Delete role
   */
  deleteRole: async (id: string): Promise<void> => {
    try {
      await apiEndpoints.admin.deleteRole(id);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  },

  /**
   * Get audit logs with optional filters and pagination
   */
  getAuditLogs: async (filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> => {
    try {
      const response = await apiEndpoints.admin.getAuditLogs(filters);
      const payload = response.data as {
        data?: AuditLog[];
        total?: number;
        page?: number;
        limit?: number;
        meta?: { total: number; page: number; limit: number };
      };
      const data = payload.data ?? [];
      const meta = payload.meta;
      return {
        data,
        total: payload.total ?? meta?.total ?? data.length,
        page: payload.page ?? meta?.page ?? 1,
        limit: payload.limit ?? meta?.limit ?? 20,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch audit logs');
    }
  },

  /**
   * Get system settings
   */
  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const response = await apiEndpoints.admin.getSystemSettings();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch system settings');
    }
  },

  /**
   * Get admin reports
   */
  getAdminReports: async (): Promise<AdminReport[]> => {
    try {
      const response = await apiEndpoints.admin.getReports();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reports');
    }
  },
};
