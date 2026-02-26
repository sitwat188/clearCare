/**
 * Compliance service
 * Handles compliance tracking operations
 */

import { apiEndpoints } from './apiEndpoints';
import type { ComplianceRecord, ComplianceMetrics } from '../types/compliance.types';

export const complianceService = {
  /**
   * Get compliance records. Pass role so the correct endpoint is used (patient = "my", provider = by patientId).
   */
  getComplianceRecords: async (patientId: string, role: 'patient' | 'provider'): Promise<ComplianceRecord[]> => {
    try {
      if (role === 'patient') {
        const response = await apiEndpoints.patient.getMyCompliance();
        return Array.isArray(response?.data) ? response.data : [];
      }
      const response = await apiEndpoints.provider.getPatientCompliance(patientId);
      return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch compliance records');
    }
  },

  /**
   * Get compliance metrics. Pass role so the correct endpoint is used (patient = "my", provider = by patientId).
   */
  getComplianceMetrics: async (patientId: string, role: 'patient' | 'provider'): Promise<ComplianceMetrics> => {
    try {
      if (role === 'patient') {
        const response = await apiEndpoints.patient.getMyComplianceMetrics();
        if (response?.data && typeof response.data === 'object') return response.data as ComplianceMetrics;
      } else {
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
   * Create a compliance record for an instruction (patient: own instructions only).
   * Use when a medication/lifestyle instruction has no record yet so "Log dose" can work.
   */
  createComplianceRecord: async (
    instructionId: string,
    type: 'medication' | 'lifestyle' | 'appointment'
  ): Promise<ComplianceRecord> => {
    const response = await apiEndpoints.patient.createComplianceRecord({
      instructionId,
      type,
      status: 'not-started',
      overallPercentage: 0,
    });
    return response.data as ComplianceRecord;
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
