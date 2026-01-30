/**
 * Patient service
 * Handles patient data operations. With real API, backend returns plain data; with mock, PHI may be "decrypted" for display.
 */

import { apiEndpoints } from './apiEndpoints';
import { getDecryptedPatient } from './mockData';
import type { Patient } from '../types/patient.types';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const patientService = {
  /**
   * Get patients assigned to provider
   */
  getPatients: async (_providerId: string): Promise<Patient[]> => {
    try {
      const response = await apiEndpoints.provider.getPatients();
      const data = Array.isArray(response?.data) ? response.data : [];
      if (USE_MOCK_DATA) {
        return data.map((patient: Patient) => getDecryptedPatient(patient));
      }
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
      if (USE_MOCK_DATA) {
        return getDecryptedPatient(data as Patient);
      }
      return data as Patient;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch patient');
    }
  },
};
