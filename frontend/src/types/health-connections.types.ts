/**
 * Health connections (Fasten Connect) types
 */

export interface HealthConnection {
  id: string;
  orgConnectionId: string;
  sourceName?: string;
  connectedAt: string;
  lastSyncedAt?: string;
  lastExportTaskId?: string;
  lastExportFailureReason?: string;
}

export interface HealthObservation {
  id: string;
  connectionId: string;
  sourceName?: string;
  code?: string;
  display?: string;
  category?: string; // e.g. laboratory, vital-signs
  value?: string;
  unit?: string;
  effectiveAt?: string;
}

export interface HealthMedication {
  id: string;
  connectionId: string;
  sourceName?: string;
  name?: string;
  dosage?: string; // e.g. "10 mg once daily"
  status?: string;
  prescribedAt?: string;
}

export interface HealthCondition {
  id: string;
  connectionId: string;
  sourceName?: string;
  code?: string;
  display?: string;
  clinicalStatus?: string;
  onsetAt?: string;
}

export interface HealthEncounter {
  id: string;
  connectionId: string;
  sourceName?: string;
  type?: string;
  reasonText?: string; // e.g. "Annual physical"
  serviceType?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface PatientHealthData {
  observations: HealthObservation[];
  medications: HealthMedication[];
  conditions: HealthCondition[];
  encounters: HealthEncounter[];
}

/** Response from adding a connection; may include EHI export request result. */
export interface AddConnectionResponse extends HealthConnection {
  ehiExport?: { taskId: string; status: string };
}

export interface FastenConnectionStatus {
  org_connection_id: string;
  org_id: string;
  catalog_brand_id?: string;
  catalog_portal_id?: string;
  catalog_endpoint_id?: string;
  platform_type?: string;
  api_mode?: string;
  status: 'authorized' | 'rejected' | 'refreshing';
  scope?: string;
  consent_expires_at?: string;
}

export interface FastenEhiExportResponse {
  task_id: string;
  status: 'pending' | 'success' | 'failed';
}
