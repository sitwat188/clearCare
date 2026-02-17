/**
 * Application routes configuration
 */

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  SET_PASSWORD: '/set-password', // Required after first login with temporary password
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
    HEALTH_CONNECTIONS: '/patient/health-connections',
    HEALTH_CONNECTIONS_CALLBACK: '/patient/health-connections/callback',
    PROFILE: '/patient/profile',
    SETTINGS: '/patient/settings',
  },
  
  // Provider routes
  PROVIDER: {
    DASHBOARD: '/provider/dashboard',
    PATIENTS: '/provider/patients',
    PATIENT_DETAIL: (id: string) => `/provider/patients/${id}`,
    MEDPLUM_PATIENTS: '/provider/medplum-patients',
    MEDPLUM_PATIENT_DETAIL: (id: string) => `/provider/medplum-patients/${id}`,
    MEDPLUM_PROVIDERS: '/provider/medplum-providers',
    MEDPLUM_PROVIDER_DETAIL: (id: string) => `/provider/medplum-providers/${id}`,
    MEDPLUM_INSTRUCTIONS: '/provider/medplum-instructions',
    MEDPLUM_INSTRUCTION_DETAIL: (id: string) => `/provider/medplum-instructions/${id}`,
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
    MEDPLUM_PATIENTS: '/admin/medplum-patients',
    MEDPLUM_PATIENT_DETAIL: (id: string) => `/admin/medplum-patients/${id}`,
    MEDPLUM_PROVIDERS: '/admin/medplum-providers',
    MEDPLUM_PROVIDER_DETAIL: (id: string) => `/admin/medplum-providers/${id}`,
    MEDPLUM_INSTRUCTIONS: '/admin/medplum-instructions',
    MEDPLUM_INSTRUCTION_DETAIL: (id: string) => `/admin/medplum-instructions/${id}`,
  },
} as const;
