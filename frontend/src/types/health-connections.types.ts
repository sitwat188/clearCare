/**
 * Health connections (Fasten Connect) types
 */

export interface HealthConnection {
  id: string;
  orgConnectionId: string;
  sourceName?: string;
  connectedAt: string;
  lastSyncedAt?: string;
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
