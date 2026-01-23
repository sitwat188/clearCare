/**
 * Application constants
 */

export const APP_NAME = 'ClearCare+';
export const APP_DESCRIPTION = 'Post-Visit Care & Follow-Up Compliance Platform';

// OAuth scopes
export const OAUTH_SCOPES = {
  PATIENT: [
    'openid',
    'profile',
    'email',
    'read:own-instructions',
    'write:own-acknowledgment',
    'read:own-compliance',
    'write:own-compliance',
    'read:own-profile',
    'write:own-profile',
  ],
  PROVIDER: [
    'openid',
    'profile',
    'email',
    'read:patients',
    'read:instructions',
    'write:instructions',
    'read:compliance',
    'read:reports',
    'write:templates',
    'read:own-audit',
  ],
  ADMINISTRATOR: [
    'openid',
    'profile',
    'email',
    'admin:users',
    'admin:roles',
    'admin:system',
    'admin:audit',
    'admin:reports',
    'admin:organizations',
  ],
} as const;

// Instruction types
export const INSTRUCTION_TYPES = [
  { value: 'medication', label: 'Medication' },
  { value: 'lifestyle', label: 'Lifestyle Modification' },
  { value: 'follow-up', label: 'Follow-Up Appointment' },
  { value: 'warning', label: 'Warning Signs' },
] as const;

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'info' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'urgent', label: 'Urgent', color: 'error' },
] as const;

// Status options
export const INSTRUCTION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  INPUT: 'yyyy-MM-dd',
  DATETIME_INPUT: "yyyy-MM-dd'T'HH:mm",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;
