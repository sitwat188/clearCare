/**
 * HTTP client for Fasten Connect API.
 * Uses Basic Auth (public_id:private_key). Do not expose private key to frontend.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_BASE_URL = 'https://api.connect.fastenhealth.com/v1';

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

@Injectable()
export class FastenConnectService {
  private readonly logger = new Logger(FastenConnectService.name);
  private baseUrl: string;
  private authHeader: string | null = null;

  constructor(private config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('FASTEN_BASE_URL')?.replace(/\/+$/, '') ||
      DEFAULT_BASE_URL;
    this.initAuth();
  }

  private initAuth(): void {
    const publicId = this.config.get<string>('FASTEN_PUBLIC_ID')?.trim();
    const privateKey = this.config.get<string>('FASTEN_PRIVATE_KEY')?.trim();
    if (!publicId || !privateKey) {
      this.logger.warn(
        'Fasten Connect not configured (FASTEN_PUBLIC_ID, FASTEN_PRIVATE_KEY). Health connections disabled.',
      );
      this.authHeader = null;
      return;
    }
    const encoded = Buffer.from(`${publicId}:${privateKey}`).toString('base64');
    this.authHeader = `Basic ${encoded}`;
  }

  isConfigured(): boolean {
    return this.authHeader != null;
  }

  async getConnectionStatus(
    orgConnectionId: string,
  ): Promise<FastenConnectionStatus | null> {
    if (!this.authHeader) return null;
    const url = `${this.baseUrl}/bridge/org_connection/${encodeURIComponent(orgConnectionId)}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        this.logger.warn(
          `Fasten getConnectionStatus ${orgConnectionId}: ${res.status}`,
        );
        return null;
      }
      const json = (await res.json()) as {
        success?: boolean;
        data?: FastenConnectionStatus;
      };
      return json?.data ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Fasten getConnectionStatus failed: ${msg}`);
      return null;
    }
  }

  async requestEhiExport(
    orgConnectionId: string,
  ): Promise<FastenEhiExportResponse | null> {
    if (!this.authHeader) return null;
    const url = `${this.baseUrl}/bridge/fhir/ehi-export`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ org_connection_id: orgConnectionId }),
      });
      if (!res.ok) {
        this.logger.warn(
          `Fasten requestEhiExport ${orgConnectionId}: ${res.status}`,
        );
        return null;
      }
      const json = (await res.json()) as {
        success?: boolean;
        data?: FastenEhiExportResponse;
      };
      return json?.data ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Fasten requestEhiExport failed: ${msg}`);
      return null;
    }
  }
}
