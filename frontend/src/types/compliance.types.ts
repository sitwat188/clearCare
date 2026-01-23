/**
 * Compliance tracking types
 */

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial' | 'not-started';
export type ComplianceType = 'medication' | 'lifestyle' | 'appointment';

export interface MedicationAdherence {
  instructionId: string;
  medicationName: string;
  schedule: Array<{
    date: string;
    time: string;
    status: 'taken' | 'missed' | 'pending';
    reason?: string;
  }>;
  adherencePercentage: number;
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
}

export interface LifestyleCompliance {
  instructionId: string;
  category: string;
  progress: number;
  milestones: Array<{
    id: string;
    name: string;
    achieved: boolean;
    achievedDate?: string;
  }>;
  checkIns: Array<{
    date: string;
    completed: boolean;
    notes?: string;
    metrics?: Record<string, number>;
    evidence?: Array<{
      id: string;
      url: string;
      type: string;
    }>;
  }>;
}

export interface AppointmentCompliance {
  instructionId: string;
  appointmentType: string;
  scheduledDate: string;
  status: 'scheduled' | 'attended' | 'no-show' | 'rescheduled' | 'cancelled';
  attendanceDate?: string;
  rescheduledDate?: string;
  notes?: string;
}

export interface ComplianceRecord {
  id: string;
  instructionId: string;
  patientId: string;
  type: ComplianceType;
  status: ComplianceStatus;
  overallPercentage: number;
  medicationAdherence?: MedicationAdherence;
  lifestyleCompliance?: LifestyleCompliance;
  appointmentCompliance?: AppointmentCompliance;
  updatedAt: string;
  lastUpdatedBy: string;
}

export interface ComplianceMetrics {
  patientId: string;
  overallScore: number;
  medicationAdherence: number;
  lifestyleCompliance: number;
  appointmentCompliance: number;
  activeInstructions: number;
  compliantInstructions: number;
  trends: Array<{
    date: string;
    score: number;
  }>;
}
