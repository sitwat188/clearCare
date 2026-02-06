/**
 * Medplum FHIR service
 * Fetches patients from Medplum via backend and normalizes responses.
 */

import { apiEndpoints } from './apiEndpoints';
import type { FhirPatient } from '../types/medplum.types';

/**
 * Get list of FHIR Patients from Medplum.
 * Handles both: Medplum returns an array of resources (not a Bundle).
 */
export const getMedplumPatients = async (
  params?: Record<string, string>
): Promise<FhirPatient[]> => {
  const response = await apiEndpoints.medplum.getPatients(params);
  if (!response.success || response.data == null) return [];
  const data = response.data;
  // Medplum searchResources returns ResourceArray (array), not Bundle
  if (Array.isArray(data)) {
    return data.filter((r): r is FhirPatient => r?.resourceType === 'Patient');
  }
  // Fallback: if backend ever returns a Bundle
  const entries = (data as { entry?: Array<{ resource?: FhirPatient }> }).entry ?? [];
  return entries
    .map((e) => e?.resource)
    .filter((r): r is FhirPatient => r != null && r.resourceType === 'Patient');
};

/**
 * Get one FHIR Patient by id from Medplum.
 */
export const getMedplumPatient = async (id: string): Promise<FhirPatient | null> => {
  const response = await apiEndpoints.medplum.getPatient(id);
  if (!response.success || !response.data) return null;
  return response.data;
};

/**
 * Medplum connection status (for UI).
 */
export const getMedplumHealth = async () => {
  return apiEndpoints.medplum.getHealth();
};

/**
 * Create sample FHIR Patients in Medplum (for empty list demo).
 */
export const seedSamplePatients = async (): Promise<FhirPatient[]> => {
  const response = await apiEndpoints.medplum.seedSamplePatients();
  if (!response.success || !response.data) return [];
  return Array.isArray(response.data) ? response.data : [];
};

export const medplumService = {
  getMedplumPatients,
  getMedplumPatient,
  getMedplumHealth,
  seedSamplePatients,
};
