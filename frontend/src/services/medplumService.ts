/**
 * Medplum FHIR service
 * Fetches patients, practitioners, and tasks from Medplum via backend.
 */

import { apiEndpoints } from './apiEndpoints';
import type { FhirPatient, FhirPractitioner, FhirTask } from '../types/medplum.types';

function asArray<T extends { resourceType?: string }>(
  data: unknown,
  resourceType: string,
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter((r): r is T => r?.resourceType === resourceType);
  }
  const entries = (data as { entry?: Array<{ resource?: T }> }).entry ?? [];
  return entries
    .map((e) => e?.resource)
    .filter((r): r is T => r != null && r.resourceType === resourceType);
}

/**
 * Get list of FHIR Patients from Medplum.
 * Handles both: Medplum returns an array of resources (not a Bundle).
 */
export const getMedplumPatients = async (
  params?: Record<string, string>
): Promise<FhirPatient[]> => {
  const response = await apiEndpoints.medplum.getPatients(params);
  if (!response.success || response.data == null) return [];
  return asArray<FhirPatient>(response.data, 'Patient');
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

export const getMedplumPractitioners = async (
  params?: Record<string, string>
): Promise<FhirPractitioner[]> => {
  const response = await apiEndpoints.medplum.getPractitioners(params);
  if (!response.success || response.data == null) return [];
  return asArray<FhirPractitioner>(response.data, 'Practitioner');
};

export const getMedplumPractitioner = async (
  id: string
): Promise<FhirPractitioner | null> => {
  const response = await apiEndpoints.medplum.getPractitioner(id);
  if (!response.success || !response.data) return null;
  return response.data;
};

export const getMedplumTasks = async (
  params?: Record<string, string>
): Promise<FhirTask[]> => {
  const response = await apiEndpoints.medplum.getTasks(params);
  if (!response.success || response.data == null) return [];
  return asArray<FhirTask>(response.data, 'Task');
};

export const getMedplumTask = async (id: string): Promise<FhirTask | null> => {
  const response = await apiEndpoints.medplum.getTask(id);
  if (!response.success || !response.data) return null;
  return response.data;
};

export const medplumService = {
  getMedplumPatients,
  getMedplumPatient,
  getMedplumPractitioners,
  getMedplumPractitioner,
  getMedplumTasks,
  getMedplumTask,
  getMedplumHealth,
  seedSamplePatients,
};
