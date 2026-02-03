/**
 * Patient service
 * Handles patient data operations. Backend returns data; PHI is decrypted by backend as needed.
 */

import { apiEndpoints } from './apiEndpoints';
import type { Patient } from '../types/patient.types';

export const patientService = {
  /**
   * Get patients assigned to provider
   */
  getPatients: async (_providerId: string): Promise<Patient[]> => {
    try {
      const response = await apiEndpoints.provider.getPatients();
      const data = Array.isArray(response?.data) ? response.data : [];
      return data as Patient[];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch patients');
    }
  },

  /**
   * Get patient by ID
   */
  getPatient: async (id: string): Promise<Patient> => {
    try {
      const response = await apiEndpoints.provider.getPatient(id);
      const data = response?.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid patient response');
      }
      return data as Patient;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch patient');
    }
  },
};
