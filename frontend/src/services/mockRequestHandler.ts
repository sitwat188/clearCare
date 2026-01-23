/**
 * Mock Request Handler
 * Intercepts axios requests in development mode and returns mock data
 * This allows API calls to show in the network tab while returning mock data
 */

import type { InternalAxiosRequestConfig } from 'axios';
import { mockApi, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from './mockData';
import type { ApiResponse } from '../types/api.types';

/**
 * Handle mock requests based on URL and method
 */
export const handleMockRequest = async (
  config: InternalAxiosRequestConfig
): Promise<ApiResponse<any> | null> => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  // Parse data if it's a string (JSON), otherwise use as-is
  let data = config.data;
  if (typeof data === 'string' && data.trim().startsWith('{')) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      // If parsing fails, use original data
      console.warn('[MockHandler] Failed to parse request data as JSON:', e);
    }
  }

  // Auth endpoints
  if (url.includes('/auth/login') && method === 'post') {
    console.log('[MockHandler] Handling login request with data:', data);
    const credentials = data;
    if (!credentials || !credentials.email || !credentials.password) {
      console.error('[MockHandler] Invalid login credentials:', credentials);
      return { 
        success: false, 
        message: 'Email and password are required',
        data: null as any
      };
    }
    try {
      const response = await mockApi.login(credentials.email, credentials.password);
      console.log('[MockHandler] Login response:', response);
      return { data: response, success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      console.error('[MockHandler] Login error:', errorMessage);
      return { 
        success: false, 
        message: errorMessage,
        data: null as any
      };
    }
  }

  if (url.includes('/auth/logout') && method === 'post') {
    return { success: true, data: undefined };
  }

  if (url.includes('/auth/refresh') && method === 'post') {
    return {
      data: {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
      },
      success: true,
    };
  }

  if (url.includes('/auth/forgot-password') && method === 'post') {
    // Mock: accept any email and return success
    return { success: true, data: undefined };
  }

  if (url.includes('/auth/reset-password') && method === 'post') {
    // Mock: accept any token/reset and return success
    return { success: true, data: undefined };
  }

  if (url.includes('/auth/me') && method === 'get') {
    const users = await mockApi.getAllUsers();
    return { data: users[0], success: true };
  }

  // Patient endpoints
  if (url.includes('/patients/me/instructions')) {
    if (method === 'get') {
      const userId = 'user-1'; // Would come from auth context
      const instructions = await mockApi.getInstructions(userId, 'patient');
      return { data: instructions, success: true };
    }
    if (url.match(/\/patients\/me\/instructions\/([^/]+)$/) && method === 'get') {
      const match = url.match(/\/patients\/me\/instructions\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const instruction = await mockApi.getInstruction(id);
        if (instruction) {
          return { data: instruction, success: true };
        }
      }
    }
    if (url.match(/\/patients\/me\/instructions\/([^/]+)\/acknowledge$/) && method === 'post') {
      const match = url.match(/\/patients\/me\/instructions\/([^/]+)\/acknowledge$/);
      const id = match?.[1];
      if (id) {
        const instruction = await mockApi.getInstruction(id);
        if (instruction) {
          return { data: instruction, success: true };
        }
      }
    }
  }

  if (url.includes('/patients/me/compliance')) {
    if (url.includes('/metrics') && method === 'get') {
      const userId = 'user-1';
      const metrics = await mockApi.getComplianceMetrics(userId);
      return { data: metrics, success: true };
    }
    if (method === 'get') {
      const userId = 'user-1';
      const records = await mockApi.getComplianceRecords(userId);
      return { data: records, success: true };
    }
    if (url.match(/\/patients\/me\/compliance\/([^/]+)$/) && method === 'put') {
      const match = url.match(/\/patients\/me\/compliance\/([^/]+)$/);
      const recordId = match?.[1];
      if (recordId) {
        const records = await mockApi.getComplianceRecords('user-1');
        const record = records.find(r => r.id === recordId);
        if (record) {
          return { data: { ...record, ...data }, success: true };
        }
      }
    }
  }

  if (url.includes('/patients/me/profile')) {
    if (method === 'get') {
      const users = await mockApi.getAllUsers();
      const user = users.find(u => u.role === 'patient');
      if (user) {
        return { data: user, success: true };
      }
    }
    if (method === 'put') {
      const users = await mockApi.getAllUsers();
      const user = users.find(u => u.role === 'patient');
      if (user) {
        return { data: { ...user, ...data }, success: true };
      }
    }
  }

  // Provider endpoints
  if (url.includes('/providers/patients')) {
    if (url.match(/\/providers\/patients\/([^/]+)$/) && method === 'get') {
      const match = url.match(/\/providers\/patients\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const patient = await mockApi.getPatient(id);
        if (patient) {
          return { data: patient, success: true };
        }
      }
    }
    if (method === 'get') {
      const providerId = 'user-2';
      const patients = await mockApi.getPatients(providerId);
      return { data: patients, success: true };
    }
  }

  if (url.includes('/providers/instructions')) {
    if (url.match(/\/providers\/instructions\/([^/]+)$/) && method === 'get') {
      const match = url.match(/\/providers\/instructions\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const instruction = await mockApi.getInstruction(id);
        if (instruction) {
          return { data: instruction, success: true };
        }
      }
    }
    if (method === 'get') {
      const providerId = 'user-2';
      const instructions = await mockApi.getInstructions(providerId, 'provider');
      return { data: instructions, success: true };
    }
    if (method === 'post') {
      const newInstruction = {
        id: `inst-${Date.now()}`,
        providerId: 'user-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        ...data,
      };
      return { data: newInstruction, success: true };
    }
    if (url.match(/\/providers\/instructions\/([^/]+)$/) && method === 'put') {
      const match = url.match(/\/providers\/instructions\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const instruction = await mockApi.getInstruction(id);
        if (instruction) {
          return { data: { ...instruction, ...data }, success: true };
        }
      }
    }
    if (url.match(/\/providers\/instructions\/([^/]+)$/) && method === 'delete') {
      return { success: true, data: undefined };
    }
  }

  if (url.includes('/providers/patients') && url.includes('/compliance')) {
    const match = url.match(/\/providers\/patients\/([^/]+)\/compliance/);
    const patientId = match?.[1];
    if (patientId) {
      if (url.includes('/metrics') && method === 'get') {
        const metrics = await mockApi.getComplianceMetrics(patientId);
        return { data: metrics, success: true };
      }
      if (method === 'get') {
        const records = await mockApi.getComplianceRecords(patientId);
        return { data: records, success: true };
      }
    }
  }

  if (url.includes('/providers/templates')) {
    if (method === 'get') {
      return { data: [], success: true };
    }
    if (method === 'post') {
      return { data: { id: `template-${Date.now()}`, ...data }, success: true };
    }
  }

  // Admin endpoints
  if (url.includes('/admin/users')) {
    if (url.match(/\/admin\/users\/([^/]+)$/) && method === 'get') {
      const match = url.match(/\/admin\/users\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const user = await mockApi.getUser(id);
        if (user) {
          return { data: user, success: true };
        }
      }
    }
    if (method === 'get') {
      const users = await mockApi.getAllUsers();
      return { data: users, success: true };
    }
    if (method === 'post') {
      const newUser = {
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...data,
      };
      return { data: newUser, success: true };
    }
    if (url.match(/\/admin\/users\/([^/]+)$/) && method === 'put') {
      const match = url.match(/\/admin\/users\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const user = await mockApi.getUser(id);
        if (user) {
          return { data: { ...user, ...data }, success: true };
        }
      }
    }
    if (url.match(/\/admin\/users\/([^/]+)$/) && method === 'delete') {
      return { success: true, data: undefined };
    }
  }

  if (url.includes('/admin/roles')) {
    if (url.match(/\/admin\/roles\/([^/]+)$/) && method === 'get') {
      const match = url.match(/\/admin\/roles\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const role = await mockApi.getRole(id);
        if (role) {
          return { data: role, success: true };
        }
      }
    }
    if (method === 'get') {
      const roles = await mockApi.getRoles();
      return { data: roles, success: true };
    }
    if (method === 'post') {
      const newRole = {
        id: `role-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSystemRole: false,
        userCount: 0,
        ...data,
      };
      return { data: newRole, success: true };
    }
    if (url.match(/\/admin\/roles\/([^/]+)$/) && method === 'put') {
      const match = url.match(/\/admin\/roles\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const role = await mockApi.getRole(id);
        if (role) {
          return { data: { ...role, ...data, updatedAt: new Date().toISOString() }, success: true };
        }
      }
    }
    if (url.match(/\/admin\/roles\/([^/]+)$/) && method === 'delete') {
      return { success: true, data: undefined };
    }
  }

  if (url.includes('/admin/audit-logs') && method === 'get') {
    // Extract query parameters
    try {
      const urlObj = new URL(url, 'http://localhost');
      const filters: any = {};
      if (urlObj.searchParams.get('userId')) filters.userId = urlObj.searchParams.get('userId');
      if (urlObj.searchParams.get('action')) filters.action = urlObj.searchParams.get('action');
      if (urlObj.searchParams.get('startDate')) filters.startDate = urlObj.searchParams.get('startDate');
      if (urlObj.searchParams.get('endDate')) filters.endDate = urlObj.searchParams.get('endDate');
      if (urlObj.searchParams.get('page')) filters.page = parseInt(urlObj.searchParams.get('page') || '1');
      if (urlObj.searchParams.get('limit')) filters.limit = parseInt(urlObj.searchParams.get('limit') || '50');
      
      const logs = await mockApi.getAuditLogs(Object.keys(filters).length > 0 ? filters : undefined);
      return {
        data: {
          data: logs,
          meta: {
            page: filters.page || 1,
            limit: filters.limit || 50,
            total: logs.length,
            totalPages: Math.ceil(logs.length / (filters.limit || 50)),
          },
        },
        success: true,
      };
    } catch {
      // Fallback if URL parsing fails
      const logs = await mockApi.getAuditLogs();
      return {
        data: {
          data: logs,
          meta: {
            page: 1,
            limit: 50,
            total: logs.length,
            totalPages: 1,
          },
        },
        success: true,
      };
    }
  }

  if (url.includes('/admin/settings')) {
    if (method === 'get') {
      const settings = await mockApi.getSystemSettings();
      return { data: settings, success: true };
    }
    if (method === 'put') {
      const settings = await mockApi.getSystemSettings();
      return { data: { ...settings, ...data }, success: true };
    }
  }

  if (url.includes('/admin/reports')) {
    if (method === 'get') {
      const reports = await mockApi.getAdminReports();
      return { data: reports, success: true };
    }
    if (method === 'post') {
      const newReport = {
        id: `report-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        generatedBy: 'user-3',
        ...data,
      };
      return { data: newReport, success: true };
    }
  }

  // Notification endpoints
  if (url.includes('/notifications')) {
    if (url.match(/\/notifications\/([^/]+)\/read$/) && method === 'put') {
      const match = url.match(/\/notifications\/([^/]+)\/read$/);
      const id = match?.[1];
      if (id) {
        const userId = 'user-1';
        markNotificationAsRead(userId, id);
        const notifications = getNotifications(userId);
        const notification = notifications.find(n => n.id === id);
        if (notification) {
          return { data: notification, success: true };
        }
      }
    }
    if (url.includes('/read-all') && method === 'put') {
      const userId = 'user-1';
      markAllNotificationsAsRead(userId);
      return { success: true, data: undefined };
    }
    if (url.match(/\/notifications\/([^/]+)$/) && method === 'delete') {
      const match = url.match(/\/notifications\/([^/]+)$/);
      const id = match?.[1];
      if (id) {
        const userId = 'user-1';
        deleteNotification(userId, id);
        return { success: true, data: undefined };
      }
    }
    if (method === 'get') {
      const userId = 'user-1';
      const notifications = getNotifications(userId);
      return { data: notifications, success: true };
    }
  }

  // Return null if no mock handler found (will use normal error handling)
  return null;
};
