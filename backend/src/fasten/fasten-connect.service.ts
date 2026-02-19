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
    const rawBase =
      this.getEnvValue('FASTEN_BASE_URL')?.replace(/\/+$/, '') ||
      DEFAULT_BASE_URL;
    // Accept either ".../v1" or "..." and normalize to include "/v1"
    this.baseUrl = rawBase.match(/\/v\d+$/) ? rawBase : `${rawBase}/v1`;
    this.initAuth();
  }

  /**
   * Read env var from ConfigService, but also tolerate accidental whitespace in .env keys
   * (e.g. "  FASTEN_PUBLIC_ID=...") by searching process.env for a trimmed key match.
   */
  private getEnvValue(name: string): string | undefined {
    const direct = this.config.get<string>(name);
    if (direct != null) return direct;
    const key = Object.keys(process.env).find((k) => k.trim() === name);
    if (!key) return undefined;
    return process.env[key];
  }

  private initAuth(): void {
    const publicId = this.getEnvValue('FASTEN_PUBLIC_ID')?.trim();
    const privateKey = this.getEnvValue('FASTEN_PRIVATE_KEY')?.trim();
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

  /**
   * Build URL to start Fasten Connect flow. User is redirected here; after auth, Fasten redirects back to redirectUri with org_connection_id.
   * Requires FASTEN_PUBLIC_ID and optional catalog ids (FASTEN_DEFAULT_ENDPOINT_ID, FASTEN_DEFAULT_BRAND_ID, FASTEN_DEFAULT_PORTAL_ID).
   */
  getConnectUrl(redirectUri: string): string | null {
    const publicId = this.getEnvValue('FASTEN_PUBLIC_ID')?.trim();
    if (!publicId) return null;
    const endpointId = this.getEnvValue('FASTEN_DEFAULT_ENDPOINT_ID')?.trim();
    const brandId = this.getEnvValue('FASTEN_DEFAULT_BRAND_ID')?.trim();
    const portalId = this.getEnvValue('FASTEN_DEFAULT_PORTAL_ID')?.trim();
    const params = new URLSearchParams({
      public_id: publicId,
      redirect_uri: redirectUri,
    });
    if (endpointId) params.set('endpoint_id', endpointId);
    if (brandId) params.set('brand_id', brandId);
    if (portalId) params.set('portal_id', portalId);
    return `${this.baseUrl}/bridge/connect?${params.toString()}`;
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
    if (!this.authHeader) {
      this.logger.warn(
        'Fasten requestEhiExport skipped: missing FASTEN_PUBLIC_ID/FASTEN_PRIVATE_KEY',
      );
      return null;
    }
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

  /**
   * Download EHI export file from Fasten (URL from webhook download_links).
   * Uses same Basic auth as other API calls.
   */
  async downloadExportFile(downloadUrl: string): Promise<string> {
    if (!this.authHeader) {
      throw new Error('Fasten not configured');
    }
    const res = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/fhir+ndjson, application/ndjson, application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }
    return res.text();
  }
}
