/**
 * Fasten Connect webhook payload (common wrapper + event-specific data).
 * @see https://docs.connect.fastenhealth.com/webhooks/introduction
 */

export interface FastenWebhookDownloadLink {
  url: string;
  export_type?: string;
  content_type?: string;
}

export interface FastenEhiExportSuccessData {
  download_links: FastenWebhookDownloadLink[];
  org_connection_id?: string;
  task_id: string;
  org_id?: string;
  stats?: { total_resources?: number };
}

export interface FastenEhiExportFailedData {
  failure_reason: string;
  org_connection_id?: string;
  task_id: string;
  org_id?: string;
}

export interface FastenWebhookPayload {
  api_mode?: string;
  date?: string;
  id?: string;
  type: string;
  data: FastenEhiExportSuccessData | FastenEhiExportFailedData | Record<string, unknown>;
}

/** Use for controller @Body() so ValidationPipe does not strip unknown fields. */
export class FastenWebhookDto implements FastenWebhookPayload {
  api_mode?: string;
  date?: string;
  id?: string;
  type!: string;
  data!: FastenEhiExportSuccessData | FastenEhiExportFailedData | Record<string, unknown>;
}
