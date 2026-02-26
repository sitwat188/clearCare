/**
 * Notification and reminder types (aligned with backend notification-types.ts).
 */

export const NOTIFICATION_TYPES = {
  PROVIDER_ASSIGNED: 'provider_assigned',
  INSTRUCTION_ASSIGNED: 'instruction_assigned',
  ACKNOWLEDGMENT_REMINDER: 'acknowledgment_reminder',
  INSTRUCTION_EXPIRING: 'instruction_expiring',
  COMPLIANCE_ALERT: 'compliance_alert',
  SYSTEM_UPDATE: 'system_update',
  SECURITY_ALERT: 'security_alert',
} as const;

/** Human-readable labels for notification type (for badges/subtitles). */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  [NOTIFICATION_TYPES.PROVIDER_ASSIGNED]: 'Provider assigned',
  [NOTIFICATION_TYPES.INSTRUCTION_ASSIGNED]: 'Care instruction',
  [NOTIFICATION_TYPES.ACKNOWLEDGMENT_REMINDER]: 'Acknowledgment reminder',
  [NOTIFICATION_TYPES.INSTRUCTION_EXPIRING]: 'Instruction expiring',
  [NOTIFICATION_TYPES.COMPLIANCE_ALERT]: 'Compliance',
  [NOTIFICATION_TYPES.SYSTEM_UPDATE]: 'System',
  [NOTIFICATION_TYPES.SECURITY_ALERT]: 'Security',
};

export type NotificationType =
  | 'provider_assigned'
  | 'instruction_assigned'
  | 'instruction_reminder'
  | 'acknowledgment_reminder'
  | 'acknowledgment_required'
  | 'instruction_expiring'
  | 'compliance_alert'
  | 'appointment_reminder'
  | 'system_update'
  | 'security_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    instructionId?: string;
    patientId?: string;
    appointmentId?: string;
    [key: string]: unknown;
  };
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}
