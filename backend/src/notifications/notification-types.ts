/**
 * Notification and reminder type mapping.
 * Use these types when creating notifications so the UI can display consistent labels/actions.
 */

export const NOTIFICATION_TYPES = {
  /** Admin assigned a provider to the patient; notifies patient and provider */
  PROVIDER_ASSIGNED: 'provider_assigned',
  /** New care instruction assigned to patient; notifies patient */
  INSTRUCTION_ASSIGNED: 'instruction_assigned',
  /** Reminder to acknowledge an instruction before deadline */
  ACKNOWLEDGMENT_REMINDER: 'acknowledgment_reminder',
  /** Reminder that an instruction is expiring soon */
  INSTRUCTION_EXPIRING: 'instruction_expiring',
  /** Compliance-related alert (e.g. missed entry) */
  COMPLIANCE_ALERT: 'compliance_alert',
  /** System or security notice */
  SYSTEM_UPDATE: 'system_update',
  SECURITY_ALERT: 'security_alert',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Default action labels per type (optional; can override when creating) */
export const NOTIFICATION_ACTION_LABELS: Record<string, string> = {
  [NOTIFICATION_TYPES.PROVIDER_ASSIGNED]: 'View instructions',
  [NOTIFICATION_TYPES.INSTRUCTION_ASSIGNED]: 'View instruction',
  [NOTIFICATION_TYPES.ACKNOWLEDGMENT_REMINDER]: 'Acknowledge',
  [NOTIFICATION_TYPES.INSTRUCTION_EXPIRING]: 'View instruction',
  [NOTIFICATION_TYPES.COMPLIANCE_ALERT]: 'Update compliance',
};
