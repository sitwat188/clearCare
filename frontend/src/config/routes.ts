/**
 * Application routes configuration
 */

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_2FA: '/verify-2fa',
  OAUTH_CALLBACK: '/auth/callback',
  
  // Patient routes
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    INSTRUCTIONS: '/patient/instructions',
    INSTRUCTION_DETAIL: (id: string) => `/patient/instructions/${id}`,
    COMPLIANCE: '/patient/compliance',
    HISTORY: '/patient/history',
    NOTIFICATIONS: '/patient/notifications',
    PROFILE: '/patient/profile',
    SETTINGS: '/patient/settings',
  },
  
  // Provider routes
  PROVIDER: {
    DASHBOARD: '/provider/dashboard',
    PATIENTS: '/provider/patients',
    PATIENT_DETAIL: (id: string) => `/provider/patients/${id}`,
    CREATE_INSTRUCTION: '/provider/instructions/create',
    INSTRUCTIONS: '/provider/instructions',
    INSTRUCTION_DETAIL: (id: string) => `/provider/instructions/${id}`,
    COMPLIANCE: '/provider/compliance',
    PATIENT_COMPLIANCE: (patientId: string) => `/provider/compliance/${patientId}`,
    REPORTS: '/provider/reports',
    TEMPLATES: '/provider/templates',
    NOTIFICATIONS: '/provider/notifications',
    PROFILE: '/provider/profile',
    SETTINGS: '/provider/settings',
  },
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
    ROLES: '/admin/roles',
    AUDIT_LOGS: '/admin/audit-logs',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    NOTIFICATIONS: '/admin/notifications',
    PROFILE: '/admin/profile',
  },
} as const;
