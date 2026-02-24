/**
 * Handles Fasten Connect webhook events: EHI export success/failure.
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FastenConnectService } from './fasten-connect.service';
import { FastenEhiIngestService } from './fasten-ehi-ingest.service';
import type {
  FastenWebhookPayload,
  FastenEhiExportSuccessData,
  FastenEhiExportFailedData,
} from './dto/fasten-webhook.dto';

@Injectable()
export class FastenWebhookService {
  private readonly logger = new Logger(FastenWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private fasten: FastenConnectService,
    private ingest: FastenEhiIngestService,
    private config: ConfigService,
  ) {}

  async handle(payload: FastenWebhookPayload, signatureOrSecret?: string): Promise<void> {
    const secret = this.config.get<string>('FASTEN_WEBHOOK_SECRET')?.trim();
    if (secret) {
      if (!signatureOrSecret?.trim()) {
        this.logger.warn('Webhook rejected: FASTEN_WEBHOOK_SECRET is set but no signature/secret header received');
        throw new UnauthorizedException('Webhook authentication required');
      }
      if (signatureOrSecret.trim() !== secret) {
        this.logger.warn('Webhook rejected: signature/secret does not match FASTEN_WEBHOOK_SECRET');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const { type, data } = payload;
    if (type === 'patient.ehi_export_success') {
      await this.handleExportSuccess(data as FastenEhiExportSuccessData);
    } else if (type === 'patient.ehi_export_failed') {
      await this.handleExportFailed(data as FastenEhiExportFailedData);
    } else {
      this.logger.log(`Unhandled webhook type: ${type}`);
    }
  }

  private async handleExportSuccess(data: FastenEhiExportSuccessData): Promise<void> {
    const orgConnectionId = data.org_connection_id ?? (data as { org_connection_id?: string }).org_connection_id;
    if (!orgConnectionId) {
      this.logger.warn(
        'EHI export_success missing org_connection_id. Keys in data: ' + Object.keys(data || {}).join(', '),
      );
      return;
    }
    this.logger.log(`EHI export_success: org_connection_id=${orgConnectionId} task_id=${data.task_id}`);
    const connections = await this.prisma.patientHealthConnection.findMany({
      where: { orgConnectionId },
    });
    if (connections.length === 0) {
      this.logger.warn(
        `No connection found for org_connection_id=${orgConnectionId}. ` +
          'Ensure this connection was added by your app (same backend/DB) and that the ID matches.',
      );
      return;
    }
    const downloadLinks = data.download_links;
    if (!downloadLinks?.length) {
      this.logger.warn(`EHI export_success missing download_links for ${orgConnectionId}`);
      await this.prisma.patientHealthConnection.updateMany({
        where: { orgConnectionId },
        data: {
          lastExportTaskId: data.task_id,
          lastExportFailureReason: 'No download links in webhook',
        },
      });
      return;
    }
    const url = downloadLinks[0].url;
    let ndjson: string;
    try {
      ndjson = await this.fasten.downloadExportFile(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`EHI download failed for ${orgConnectionId}: ${msg}`);
      await this.prisma.patientHealthConnection.updateMany({
        where: { orgConnectionId },
        data: {
          lastExportTaskId: data.task_id,
          lastExportFailureReason: msg.slice(0, 500),
        },
      });
      return;
    }
    const updatePayload = {
      lastSyncedAt: new Date(),
      lastExportTaskId: data.task_id,
      lastExportFailureReason: null as string | null,
    };
    for (const connection of connections) {
      try {
        const counts = await this.ingest.ingestNdjson(ndjson, connection.id, connection.patientId);
        this.logger.log(
          `EHI ingest done: connection=${connection.id} patient=${connection.patientId} observations=${counts.observations} medications=${counts.medications} conditions=${counts.conditions} encounters=${counts.encounters}`,
        );
        await this.prisma.patientHealthConnection.update({
          where: { id: connection.id },
          data: updatePayload,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`EHI ingest failed for connection=${connection.id}: ${msg}`);
        await this.prisma.patientHealthConnection.update({
          where: { id: connection.id },
          data: {
            lastExportTaskId: data.task_id,
            lastExportFailureReason: msg.slice(0, 500),
          },
        });
      }
    }
  }

  private async handleExportFailed(data: FastenEhiExportFailedData): Promise<void> {
    const orgConnectionId = data.org_connection_id ?? (data as { org_connection_id?: string }).org_connection_id;
    if (!orgConnectionId) {
      this.logger.warn('EHI export_failed missing org_connection_id');
      return;
    }
    const reason = data.failure_reason ?? 'unknown';
    this.logger.warn(`EHI export failed: org_connection_id=${orgConnectionId} reason=${reason}`);
    await this.prisma.patientHealthConnection.updateMany({
      where: { orgConnectionId },
      data: {
        lastExportTaskId: data.task_id,
        lastExportFailureReason: reason,
      },
    });
  }
}
