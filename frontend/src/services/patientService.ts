/**
 * Patient service
 * Handles patient data operations with PHI encryption
 */

import { apiEndpoints } from './apiEndpoints';
import { getDecryptedPatient } from './mockData';
import type { Patient } from '../types/patient.types';

export const patientService = {
  /**
   * Get patients assigned to provider
   * Returns decrypted patient data for display
   */
  getPatients: async (_providerId: string): Promise<Patient[]> => {
    try {
      const response = await apiEndpoints.provider.getPatients();
      // Decrypt PHI fields for display
      return response.data.map(patient => getDecryptedPatient(patient));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch patients');
    }
  },

  /**
   * Get patient by ID
   * Returns decrypted patient data
   */
  getPatient: async (id: string): Promise<Patient> => {
    try {
      const response = await apiEndpoints.provider.getPatient(id);
      // Decrypt PHI fields for display
      return getDecryptedPatient(response.data);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch patient');
    }
  },
};
