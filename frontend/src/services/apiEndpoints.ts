/**
 * API Endpoints
 * REST API endpoint definitions. All requests go to the backend.
 */

import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';
import type { User, LoginCredentials } from '../types/auth.types';
import type { CareInstruction } from '../types/instruction.types';
import type { Patient } from '../types/patient.types';
import type { ComplianceRecord, ComplianceMetrics } from '../types/compliance.types';
import type { Notification } from '../types/notification.types';
import type { Role, AuditLog, SystemSettings, AdminReport } from '../types/admin.types';
import type { FhirPatient, FhirBundle, FhirPractitioner, FhirTask } from '../types/medplum.types';
import type { HealthConnection, AddConnectionResponse, FastenConnectionStatus, FastenEhiExportResponse, PatientHealthData } from '../types/health-connections.types';

/**
 * Make API request. Expects backend to return ApiResponse<T> in response.data.
 */
const makeApiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any
): Promise<ApiResponse<T>> => {
  const response = await api[method]<ApiResponse<T>>(url, data);
  if (!response || !response.data || typeof response.data !== 'object' || !('success' in response.data)) {
    throw new Error(`[API] Unexpected response shape for ${method.toUpperCase()} ${url}`);
  }
  return response.data;
};

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export const authEndpoints = {
  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    return makeApiRequest('post', '/auth/login', credentials);
  },

  /**
   * POST /api/v1/auth/logout
   * Logout current user
   */
  logout: async (): Promise<ApiResponse<void>> => {
    return makeApiRequest('post', '/auth/logout');
  },

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> => {
    return makeApiRequest('post', '/auth/refresh', { refreshToken });
  },

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset
   */
  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('post', '/auth/forgot-password', { email });
  },

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('post', '/auth/reset-password', { token, newPassword });
  },

  /**
   * POST /api/v1/auth/change-password
   * Change password while logged in (requires current password)
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return makeApiRequest('post', '/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * POST /api/v1/auth/verify-2fa
   * Complete login with 2FA code (TOTP or backup code)
   */
  verifyTwoFactor: async (
    twoFactorToken: string,
    code: string,
  ): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    return makeApiRequest('post', '/auth/verify-2fa', { twoFactorToken, code });
  },

  /**
   * POST /api/v1/auth/2fa/setup
   * Start 2FA setup (returns QR code and setupToken)
   */
  setupTwoFactor: async (): Promise<
    ApiResponse<{ secret: string; qrCodeDataUrl: string; setupToken: string; message: string }>
  > => {
    return makeApiRequest('post', '/auth/2fa/setup');
  },

  /**
   * POST /api/v1/auth/2fa/verify-setup
   * Complete 2FA setup with 6-digit code from authenticator app
   */
  verifySetupTwoFactor: async (
    setupToken: string,
    code: string,
  ): Promise<ApiResponse<{ backupCodes: string[]; message: string }>> => {
    return makeApiRequest('post', '/auth/2fa/verify-setup', { setupToken, code });
  },

  /**
   * POST /api/v1/auth/2fa/disable
   * Disable 2FA (requires current password)
   */
  disableTwoFactor: async (password: string): Promise<ApiResponse<{ message: string }>> => {
    return makeApiRequest('post', '/auth/2fa/disable', { password });
  },

  /**
   * GET /api/v1/auth/me
   * Get current user
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return makeApiRequest('get', '/auth/me');
  },

  /**
   * GET /api/v1/users/me/profile
   * Get current user profile (shared across roles)
   */
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    return makeApiRequest('get', '/users/me/profile');
  },

  /**
   * PUT /api/v1/users/me/profile
   * Update current user profile (shared across roles)
   */
  updateMyProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    return makeApiRequest('put', '/users/me/profile', updates);
  },
};

// ============================================================================
// PATIENT ENDPOINTS
// ============================================================================

export const patientEndpoints = {
  /**
   * GET /api/v1/patients/me/instructions
   * Get patient's own instructions
   */
  getMyInstructions: async (): Promise<ApiResponse<CareInstruction[]>> => {
    return makeApiRequest('get', '/patients/me/instructions');
  },

  /**
   * GET /api/v1/patients/me/instructions/:id
   * Get patient's instruction by ID
   */
  getMyInstruction: async (id: string): Promise<ApiResponse<CareInstruction>> => {
    return makeApiRequest('get', `/patients/me/instructions/${id}`);
  },

  /**
   * POST /api/v1/patients/me/instructions/:id/acknowledge
   * Acknowledge an instruction
   */
  acknowledgeInstruction: async (
    id: string,
    acknowledgmentType: 'receipt' | 'understanding' | 'commitment'
  ): Promise<ApiResponse<CareInstruction>> => {
    return makeApiRequest('post', `/patients/me/instructions/${id}/acknowledge`, { acknowledgmentType });
  },

  /**
   * GET /api/v1/patients/me/compliance
   * Get patient's compliance records
   */
  getMyCompliance: async (): Promise<ApiResponse<ComplianceRecord[]>> => {
    return makeApiRequest('get', '/patients/me/compliance');
  },

  /**
   * GET /api/v1/patients/me/compliance/metrics
   * Get patient's compliance metrics
   */
  getMyComplianceMetrics: async (): Promise<ApiResponse<ComplianceMetrics>> => {
    return makeApiRequest('get', '/patients/me/compliance/metrics');
  },

  /**
   * PUT /api/v1/patients/me/compliance/:recordId
   * Update compliance record
   */
  updateCompliance: async (recordId: string, updates: Partial<ComplianceRecord>): Promise<ApiResponse<ComplianceRecord>> => {
    return makeApiRequest('put', `/patients/me/compliance/${recordId}`, updates);
  },

  /**
   * PUT /api/v1/compliance/:recordId/medication
   * Update medication adherence (dose log)
   */
  updateMedicationAdherence: async (
    recordId: string,
    body: { date: string; time?: string; status?: 'taken' | 'missed' | 'pending'; reason?: string; progress?: number }
  ): Promise<ApiResponse<ComplianceRecord>> => {
    return makeApiRequest('put', `/compliance/${recordId}/medication`, body);
  },

  /**
   * PUT /api/v1/compliance/:recordId/lifestyle
   * Update lifestyle compliance (check-in)
   */
  updateLifestyleCompliance: async (
    recordId: string,
    body: { date: string; completed?: boolean; notes?: string; progress?: number; metrics?: Record<string, number> }
  ): Promise<ApiResponse<ComplianceRecord>> => {
    return makeApiRequest('put', `/compliance/${recordId}/lifestyle`, body);
  },

  /**
   * GET /api/v1/patients/me/profile
   * Get patient's profile
   */
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    return makeApiRequest('get', '/patients/me/profile');
  },

  /**
   * PUT /api/v1/patients/me/profile
   * Update patient's profile
   */
  updateMyProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    return makeApiRequest('put', '/patients/me/profile', updates);
  },
};

// ============================================================================
// PROVIDER ENDPOINTS
// ============================================================================

export const providerEndpoints = {
  /**
   * GET /api/v1/providers/patients
   * Get all patients assigned to provider
   */
  getPatients: async (): Promise<ApiResponse<Patient[]>> => {
    return makeApiRequest('get', '/providers/patients');
  },

  /**
   * GET /api/v1/providers/patients/:id
   * Get patient by ID
   */
  getPatient: async (id: string): Promise<ApiResponse<Patient>> => {
    return makeApiRequest('get', `/providers/patients/${id}`);
  },

  /**
   * GET /api/v1/providers/instructions
   * Get all instructions created by provider
   */
  getInstructions: async (): Promise<ApiResponse<CareInstruction[]>> => {
    return makeApiRequest('get', '/providers/instructions');
  },

  /**
   * GET /api/v1/providers/instructions/:id
   * Get instruction by ID
   */
  getInstruction: async (id: string): Promise<ApiResponse<CareInstruction>> => {
    return makeApiRequest('get', `/providers/instructions/${id}`);
  },

  /**
   * POST /api/v1/providers/instructions
   * Create new instruction
   */
  createInstruction: async (instruction: Partial<CareInstruction>): Promise<ApiResponse<CareInstruction>> => {
    return makeApiRequest('post', '/providers/instructions', instruction);
  },

  /**
   * PUT /api/v1/providers/instructions/:id
   * Update instruction
   */
  updateInstruction: async (id: string, updates: Partial<CareInstruction>): Promise<ApiResponse<CareInstruction>> => {
    return makeApiRequest('put', `/providers/instructions/${id}`, updates);
  },

  /**
   * DELETE /api/v1/providers/instructions/:id
   * Delete instruction
   */
  deleteInstruction: async (id: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('delete', `/providers/instructions/${id}`);
  },

  /**
   * GET /api/v1/providers/patients/:patientId/compliance
   * Get patient compliance records
   */
  getPatientCompliance: async (patientId: string): Promise<ApiResponse<ComplianceRecord[]>> => {
    return makeApiRequest('get', `/providers/patients/${patientId}/compliance`);
  },

  /**
   * GET /api/v1/providers/patients/:patientId/compliance/metrics
   * Get patient compliance metrics
   */
  getPatientComplianceMetrics: async (patientId: string): Promise<ApiResponse<ComplianceMetrics>> => {
    return makeApiRequest('get', `/providers/patients/${patientId}/compliance/metrics`);
  },

  /**
   * GET /api/v1/providers/templates
   * Get instruction templates
   */
  getTemplates: async (): Promise<ApiResponse<any[]>> => {
    return makeApiRequest('get', '/providers/templates');
  },

  /**
   * POST /api/v1/providers/templates
   * Create instruction template
   */
  createTemplate: async (template: any): Promise<ApiResponse<any>> => {
    return makeApiRequest('post', '/providers/templates', template);
  },

  /**
   * PUT /api/v1/providers/templates/:id
   */
  updateTemplate: async (id: string, template: any): Promise<ApiResponse<any>> => {
    return makeApiRequest('put', `/providers/templates/${id}`, template);
  },

  /**
   * DELETE /api/v1/providers/templates/:id
   */
  deleteTemplate: async (id: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('delete', `/providers/templates/${id}`);
  },
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

export const adminEndpoints = {
  /**
   * GET /api/v1/admin/users
   * Get all users
   */
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return makeApiRequest('get', '/admin/users');
  },

  /**
   * GET /api/v1/admin/users/:id
   * Get user by ID
   */
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    return makeApiRequest('get', `/admin/users/${id}`);
  },

  /**
   * POST /api/v1/admin/users
   * Create new user
   */
  createUser: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    return makeApiRequest('post', '/admin/users', userData);
  },

  /**
   * PUT /api/v1/admin/users/:id
   * Update user
   */
  updateUser: async (id: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    return makeApiRequest('put', `/admin/users/${id}`, updates);
  },

  /**
   * DELETE /api/v1/admin/users/:id
   * Delete user (soft delete)
   */
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('delete', `/admin/users/${id}`);
  },

  /**
   * POST /api/v1/admin/users/:id/restore
   * Restore a soft-deleted user (and linked patient)
   */
  restoreUser: async (id: string): Promise<ApiResponse<User>> => {
    return makeApiRequest('post', `/admin/users/${id}/restore`);
  },

  /**
   * GET /api/v1/admin/users/:userId/patient
   * Get patient record by user ID (admin only)
   */
  getPatientByUserId: async (userId: string): Promise<ApiResponse<Patient>> => {
    return makeApiRequest('get', `/admin/users/${userId}/patient`);
  },

  /**
   * PUT /api/v1/patients/:id
   * Update patient record (e.g. assignedProviderIds)
   */
  updatePatient: async (patientId: string, updates: { assignedProviderIds?: string[] }): Promise<ApiResponse<Patient>> => {
    return makeApiRequest('put', `/patients/${patientId}`, updates);
  },

  /**
   * GET /api/v1/admin/roles
   * Get all roles
   */
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    return makeApiRequest('get', '/admin/roles');
  },

  /**
   * GET /api/v1/admin/roles/:id
   * Get role by ID
   */
  getRole: async (id: string): Promise<ApiResponse<Role>> => {
    return makeApiRequest('get', `/admin/roles/${id}`);
  },

  /**
   * POST /api/v1/admin/roles
   * Create new role
   */
  createRole: async (roleData: Partial<Role>): Promise<ApiResponse<Role>> => {
    return makeApiRequest('post', '/admin/roles', roleData);
  },

  /**
   * PUT /api/v1/admin/roles/:id
   * Update role
   */
  updateRole: async (id: string, updates: Partial<Role>): Promise<ApiResponse<Role>> => {
    return makeApiRequest('put', `/admin/roles/${id}`, updates);
  },

  /**
   * DELETE /api/v1/admin/roles/:id
   * Delete role
   */
  deleteRole: async (id: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('delete', `/admin/roles/${id}`);
  },

  /**
   * GET /api/v1/admin/audit-logs
   * Get audit logs with filters
   */
  getAuditLogs: async (filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<AuditLog>>> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const queryString = params.toString();
    const url = queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';
    return makeApiRequest('get', url);
  },

  /**
   * GET /api/v1/admin/settings
   * Get system settings
   */
  getSystemSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    return makeApiRequest('get', '/admin/settings');
  },

  /**
   * PUT /api/v1/admin/settings
   * Update system settings
   */
  updateSystemSettings: async (updates: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> => {
    return makeApiRequest('put', '/admin/settings', updates);
  },

  /**
   * GET /api/v1/admin/reports
   * Get all reports
   */
  getReports: async (): Promise<ApiResponse<AdminReport[]>> => {
    return makeApiRequest('get', '/admin/reports');
  },

  /**
   * POST /api/v1/admin/reports
   * Generate new report
   */
  generateReport: async (reportConfig: {
    type: 'compliance' | 'audit' | 'users' | 'system';
    dateRange: { start: string; end: string };
    format: 'pdf' | 'csv' | 'json';
  }): Promise<ApiResponse<AdminReport>> => {
    return makeApiRequest('post', '/admin/reports', reportConfig);
  },
};

// ============================================================================
// MEDPLUM (FHIR) ENDPOINTS (admin + provider)
// ============================================================================

export const medplumEndpoints = {
  /**
   * GET /api/v1/medplum/health
   * Medplum connection status (no auth)
   */
  getHealth: async (): Promise<ApiResponse<{ status: string; medplum: string }>> => {
    return makeApiRequest('get', '/medplum/health');
  },

  /**
   * GET /api/v1/medplum/patients
   * Search FHIR Patients in Medplum. Returns array of Patient resources (Medplum SDK returns ResourceArray).
   */
  getPatients: async (params?: Record<string, string>): Promise<ApiResponse<FhirBundle | FhirPatient[]>> => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return makeApiRequest('get', `/medplum/patients${query}`);
  },

  /**
   * GET /api/v1/medplum/patients/:id
   * Get one FHIR Patient by id
   */
  getPatient: async (id: string): Promise<ApiResponse<FhirPatient>> => {
    return makeApiRequest('get', `/medplum/patients/${id}`);
  },

  /**
   * GET /api/v1/medplum/seed
   * Create sample FHIR Patients in Medplum for demo (GET so it works if POST is blocked)
   */
  seedSamplePatients: async (): Promise<ApiResponse<FhirPatient[]>> => {
    return makeApiRequest('get', '/medplum/seed');
  },

  /**
   * GET /api/v1/medplum/practitioners
   * Search FHIR Practitioners (providers) in Medplum
   */
  getPractitioners: async (params?: Record<string, string>): Promise<ApiResponse<FhirPractitioner[] | FhirBundle>> => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return makeApiRequest('get', `/medplum/practitioners${query}`);
  },

  /**
   * GET /api/v1/medplum/practitioners/:id
   * Get one FHIR Practitioner by id
   */
  getPractitioner: async (id: string): Promise<ApiResponse<FhirPractitioner>> => {
    return makeApiRequest('get', `/medplum/practitioners/${id}`);
  },

  /**
   * GET /api/v1/medplum/tasks
   * Search FHIR Tasks (instructions/orders) in Medplum
   */
  getTasks: async (params?: Record<string, string>): Promise<ApiResponse<FhirTask[] | FhirBundle>> => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return makeApiRequest('get', `/medplum/tasks${query}`);
  },

  /**
   * GET /api/v1/medplum/tasks/:id
   * Get one FHIR Task by id
   */
  getTask: async (id: string): Promise<ApiResponse<FhirTask>> => {
    return makeApiRequest('get', `/medplum/tasks/${id}`);
  },
};

// ============================================================================
// HEALTH CONNECTIONS (Fasten Connect – patient "me")
// ============================================================================

export const healthConnectionsEndpoints = {
  /**
   * GET /api/v1/patients/me/health-connections
   */
  listMyConnections: async (): Promise<ApiResponse<HealthConnection[]>> => {
    return makeApiRequest('get', '/patients/me/health-connections');
  },

  /**
   * GET /api/v1/patients/me/health-connections/connect-url
   */
  getConnectUrl: async (): Promise<ApiResponse<{ url: string | null }>> => {
    return makeApiRequest('get', '/patients/me/health-connections/connect-url');
  },

  /**
   * GET /api/v1/patients/me/health-connections/health-data
   */
  getMyHealthData: async (): Promise<ApiResponse<PatientHealthData>> => {
    return makeApiRequest('get', '/patients/me/health-connections/health-data');
  },

  /**
   * POST /api/v1/patients/me/health-connections
   */
  addConnection: async (orgConnectionId: string, sourceName?: string): Promise<ApiResponse<AddConnectionResponse>> => {
    return makeApiRequest('post', '/patients/me/health-connections', { orgConnectionId, sourceName });
  },

  /**
   * DELETE /api/v1/patients/me/health-connections/:orgConnectionId
   */
  removeConnection: async (orgConnectionId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return makeApiRequest('delete', `/patients/me/health-connections/${encodeURIComponent(orgConnectionId)}`);
  },

  /**
   * GET /api/v1/patients/me/health-connections/:orgConnectionId/status
   */
  getConnectionStatus: async (orgConnectionId: string): Promise<ApiResponse<FastenConnectionStatus | null>> => {
    return makeApiRequest('get', `/patients/me/health-connections/${encodeURIComponent(orgConnectionId)}/status`);
  },
};

// ============================================================================
// HEALTH CONNECTIONS FOR PATIENT (provider / admin – by patientId)
// ============================================================================

export const healthConnectionsPatientEndpoints = {
  /**
   * GET /api/v1/patients/:patientId/health-connections
   */
  listForPatient: async (patientId: string): Promise<ApiResponse<HealthConnection[]>> => {
    return makeApiRequest('get', `/patients/${patientId}/health-connections`);
  },

  /**
   * GET /api/v1/patients/:patientId/health-connections/health-data
   */
  getHealthData: async (patientId: string): Promise<ApiResponse<PatientHealthData>> => {
    return makeApiRequest('get', `/patients/${patientId}/health-connections/health-data`);
  },

  /**
   * GET /api/v1/patients/:patientId/health-connections/:orgConnectionId/status
   */
  getConnectionStatus: async (
    patientId: string,
    orgConnectionId: string,
  ): Promise<ApiResponse<FastenConnectionStatus | null>> => {
    return makeApiRequest(
      'get',
      `/patients/${patientId}/health-connections/${encodeURIComponent(orgConnectionId)}/status`,
    );
  },

  /**
   * POST /api/v1/patients/:patientId/health-connections/:orgConnectionId/request-export
   */
  requestEhiExport: async (
    patientId: string,
    orgConnectionId: string,
  ): Promise<ApiResponse<FastenEhiExportResponse | null>> => {
    return makeApiRequest(
      'post',
      `/patients/${patientId}/health-connections/${encodeURIComponent(orgConnectionId)}/request-export`,
    );
  },
};

// ============================================================================
// NOTIFICATION ENDPOINTS (Shared across roles)
// ============================================================================

export const notificationEndpoints = {
  /**
   * GET /api/v1/notifications
   * Get user notifications
   */
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    return makeApiRequest('get', '/notifications');
  },

  /**
   * PUT /api/v1/notifications/:id/read
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    return makeApiRequest('put', `/notifications/${id}/read`);
  },

  /**
   * PUT /api/v1/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return makeApiRequest('put', '/notifications/read-all');
  },

  /**
   * DELETE /api/v1/notifications/:id
   * Delete notification
   */
  deleteNotification: async (id: string): Promise<ApiResponse<void>> => {
    return makeApiRequest('delete', `/notifications/${id}`);
  },
};

// ============================================================================
// EXPORT ALL ENDPOINTS
// ============================================================================

export const apiEndpoints = {
  auth: authEndpoints,
  patient: patientEndpoints,
  provider: providerEndpoints,
  admin: adminEndpoints,
  medplum: medplumEndpoints,
  healthConnections: healthConnectionsEndpoints,
  healthConnectionsPatient: healthConnectionsPatientEndpoints,
  notifications: notificationEndpoints,
};

export default apiEndpoints;
