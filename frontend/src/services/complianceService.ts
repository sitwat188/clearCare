/**
 * Compliance service
 * Handles compliance tracking operations
 */

import { apiEndpoints } from './apiEndpoints';
import type { ComplianceRecord, ComplianceMetrics } from '../types/compliance.types';

export const complianceService = {
  /**
   * Get compliance records for patient
   */
  getComplianceRecords: async (patientId: string): Promise<ComplianceRecord[]> => {
    try {
      // Try patient endpoint first (for patient role), fallback to provider endpoint
      try {
        const response = await apiEndpoints.patient.getMyCompliance();
        return response.data;
      } catch {
        const response = await apiEndpoints.provider.getPatientCompliance(patientId);
        return response.data;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch compliance records');
    }
  },

  /**
   * Get compliance metrics for patient
   */
  getComplianceMetrics: async (patientId: string): Promise<ComplianceMetrics> => {
    try {
      // Try patient endpoint first (for patient role), fallback to provider endpoint
      try {
        const response = await apiEndpoints.patient.getMyComplianceMetrics();
        return response.data;
      } catch {
        const response = await apiEndpoints.provider.getPatientComplianceMetrics(patientId);
        return response.data;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch compliance metrics');
    }
  },

  /**
   * Update medication adherence
   */
  updateMedicationAdherence: async (
    _instructionId: string,
    _date: string,
    _time: string,
    _status: 'taken' | 'missed',
    _reason?: string
  ): Promise<void> => {
    // TODO: Implement with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  /**
   * Update lifestyle compliance
   */
  updateLifestyleCompliance: async (
    _instructionId: string,
    _data: {
      date: string;
      completed: boolean;
      notes?: string;
      metrics?: Record<string, number>;
    }
  ): Promise<void> => {
    // TODO: Implement with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
  },
};
