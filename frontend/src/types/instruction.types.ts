/**
 * Care instruction types
 */

export type InstructionType = 'medication' | 'lifestyle' | 'follow-up' | 'warning';
export type InstructionStatus = 'draft' | 'active' | 'acknowledged' | 'completed' | 'expired' | 'cancelled';
export type InstructionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AcknowledgmentType = 'receipt' | 'understanding' | 'commitment';

export interface MedicationDetails {
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  duration: string;
  specialInstructions?: string;
  refillInformation?: string;
  sideEffects?: string;
}

export interface LifestyleDetails {
  category: 'diet' | 'exercise' | 'activity' | 'sleep';
  instructions: string;
  goals?: string;
  milestones?: string[];
  trackingRequirements?: string;
}

export interface FollowUpDetails {
  appointmentType: string;
  timeframe: string;
  preparationInstructions?: string;
  contactInformation: string;
}

export interface WarningDetails {
  symptoms: string;
  whenToSeekCare: string;
  emergencyContacts: string;
}

export interface Acknowledgment {
  id: string;
  instructionId: string;
  patientId: string;
  acknowledgmentType: AcknowledgmentType;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  comprehensionQuizResults?: {
    score: number;
    answers: Record<string, string>;
  };
}

export interface CareInstruction {
  id: string;
  providerId: string;
  providerName: string;
  patientId: string;
  patientName: string;
  title: string;
  type: InstructionType;
  status: InstructionStatus;
  priority: InstructionPriority;
  content: string;
  medicationDetails?: MedicationDetails;
  lifestyleDetails?: LifestyleDetails;
  followUpDetails?: FollowUpDetails;
  warningDetails?: WarningDetails;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  acknowledgmentDeadline?: string;
  expirationDate?: string;
  assignedDate: string;
  acknowledgedDate?: string;
  acknowledgments?: Acknowledgment[];
  complianceTrackingEnabled: boolean;
  lifestyleTrackingEnabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstructionTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  type: InstructionType;
  content: string;
  medicationDetails?: MedicationDetails;
  lifestyleDetails?: LifestyleDetails;
  followUpDetails?: FollowUpDetails;
  warningDetails?: WarningDetails;
  defaultComplianceSettings: {
    medicationTracking: boolean;
    lifestyleTracking: boolean;
  };
  defaultAcknowledgmentSettings: {
    requireReceipt: boolean;
    requireUnderstanding: boolean;
    requireCommitment: boolean;
  };
  visibility: 'personal' | 'organization';
  usageCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}
