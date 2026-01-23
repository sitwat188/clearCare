/**
 * Admin-related types
 */

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
}

export interface SystemSettings {
  sessionTimeout: number; // minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
  };
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    defaultNotificationTypes: string[];
  };
  dataRetention: {
    auditLogsDays: number;
    complianceRecordsDays: number;
    archivedInstructionsDays: number;
  };
  featureFlags: Record<string, boolean>;
}

export interface AdminReport {
  id: string;
  type: 'compliance' | 'users' | 'audit' | 'system';
  title: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  dateRange: {
    start: string;
    end: string;
  };
  data: Record<string, unknown>;
  format: 'pdf' | 'csv' | 'json';
}
