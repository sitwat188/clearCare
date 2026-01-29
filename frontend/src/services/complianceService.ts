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
      try {
        const response = await apiEndpoints.patient.getMyCompliance();
        return Array.isArray(response?.data) ? response.data : [];
      } catch {
        const response = await apiEndpoints.provider.getPatientCompliance(patientId);
        return Array.isArray(response?.data) ? response.data : [];
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
      try {
        const response = await apiEndpoints.patient.getMyComplianceMetrics();
        if (response?.data && typeof response.data === 'object') return response.data as ComplianceMetrics;
      } catch {
        const response = await apiEndpoints.provider.getPatientComplianceMetrics(patientId);
        if (response?.data && typeof response.data === 'object') return response.data as ComplianceMetrics;
      }
    } catch (_e) {
      // ignore
    }
    return {
      patientId: patientId || '',
      overallScore: 0,
      medicationAdherence: 0,
      lifestyleCompliance: 0,
      appointmentCompliance: 0,
      activeInstructions: 0,
      compliantInstructions: 0,
      trends: [],
    };
  },

  /**
   * Update medication adherence (by compliance record id)
   */
  updateMedicationAdherence: async (
    recordId: string,
    date: string,
    time: string,
    status: 'taken' | 'missed',
    reason?: string
  ): Promise<void> => {
    await apiEndpoints.patient.updateMedicationAdherence(recordId, {
      date,
      time,
      status,
      reason,
    });
  },

  /**
   * Update lifestyle compliance (by compliance record id)
   */
  updateLifestyleCompliance: async (
    recordId: string,
    data: {
      date: string;
      completed: boolean;
      notes?: string;
      metrics?: Record<string, number>;
    }
  ): Promise<void> => {
    await apiEndpoints.patient.updateLifestyleCompliance(recordId, {
      date: data.date,
      completed: data.completed,
      notes: data.notes,
      metrics: data.metrics,
    });
  },
};
