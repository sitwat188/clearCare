/**
 * Health connections (Fasten Connect) service
 * Patient: list, connect, disconnect, status. Provider: list for patient, status, request EHI export.
 */

import { apiEndpoints } from './apiEndpoints';
import type { HealthConnection, AddConnectionResponse, FastenConnectionStatus, FastenEhiExportResponse, PatientHealthData } from '../types/health-connections.types';

const getData = <T>(res: { success: boolean; data: T }): T => res.data;

export const healthConnectionsService = {
  /** List current user's (patient) health connections */
  listMyConnections: async (): Promise<HealthConnection[]> => {
    const res = await apiEndpoints.healthConnections.listMyConnections();
    return getData(res) ?? [];
  },

  /** URL to start Fasten Connect flow (null if not configured) */
  getConnectUrl: async (): Promise<string | null> => {
    const res = await apiEndpoints.healthConnections.getConnectUrl();
    return getData(res)?.url ?? null;
  },

  /** Add connection after Fasten redirect (patient); backend may trigger EHI export and return ehiExport. */
  addConnection: async (orgConnectionId: string, sourceName?: string): Promise<AddConnectionResponse> => {
    const res = await apiEndpoints.healthConnections.addConnection(orgConnectionId, sourceName);
    return getData(res);
  },

  /** Remove connection (patient) */
  removeConnection: async (orgConnectionId: string): Promise<void> => {
    await apiEndpoints.healthConnections.removeConnection(orgConnectionId);
  },

  /** Get Fasten status for a connection (patient) */
  getConnectionStatus: async (orgConnectionId: string): Promise<FastenConnectionStatus | null> => {
    const res = await apiEndpoints.healthConnections.getConnectionStatus(orgConnectionId);
    return getData(res) ?? null;
  },

  /** Provider/Admin: list health connections for a patient */
  listForPatient: async (patientId: string): Promise<HealthConnection[]> => {
    const res = await apiEndpoints.healthConnectionsPatient.listForPatient(patientId);
    return getData(res) ?? [];
  },

  /** Provider/Admin: get connection status for a patient's connection */
  getConnectionStatusForPatient: async (
    patientId: string,
    orgConnectionId: string,
  ): Promise<FastenConnectionStatus | null> => {
    const res = await apiEndpoints.healthConnectionsPatient.getConnectionStatus(patientId, orgConnectionId);
    return getData(res) ?? null;
  },

  /** Provider/Admin: request EHI export for a patient's connection */
  requestEhiExport: async (
    patientId: string,
    orgConnectionId: string,
  ): Promise<FastenEhiExportResponse | null> => {
    const res = await apiEndpoints.healthConnectionsPatient.requestEhiExport(patientId, orgConnectionId);
    return getData(res) ?? null;
  },

  /** Patient: get imported health data (observations, medications, conditions, encounters) */
  getMyHealthData: async (): Promise<PatientHealthData> => {
    const res = await apiEndpoints.healthConnections.getMyHealthData();
    return getData(res) ?? { observations: [], medications: [], conditions: [], encounters: [] };
  },

  /** Provider/Admin: get health data for a patient */
  getHealthDataForPatient: async (patientId: string): Promise<PatientHealthData> => {
    const res = await apiEndpoints.healthConnectionsPatient.getHealthData(patientId);
    return getData(res) ?? { observations: [], medications: [], conditions: [], encounters: [] };
  },
};
