/**
 * Patient types
 */

export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  medicalRecordNumber: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
  };
  assignedProviderIds: string[];
  createdAt: string;
  updatedAt: string;
}
