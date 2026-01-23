/**
 * Notification types
 */

export type NotificationType = 
  | 'instruction_assigned'
  | 'instruction_reminder'
  | 'acknowledgment_required'
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
