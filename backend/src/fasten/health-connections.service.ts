import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FastenConnectService } from './fasten-connect.service';
import type { FastenConnectionStatus } from './fasten-connect.service';

@Injectable()
export class HealthConnectionsService {
  private readonly logger = new Logger(HealthConnectionsService.name);

  constructor(
    private prisma: PrismaService,
    private fasten: FastenConnectService,
    private config: ConfigService,
  ) {}

  /**
   * URL to start Fasten Connect flow (redirect_uri = frontend callback). Returns null if not configured.
   */
  getConnectUrl(): { url: string | null } {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL')?.replace(/\/+$/, '') ||
      'http://localhost:5173';
    const callbackPath = '/patient/health-connections/callback';
    const redirectUri = `${frontendUrl}${callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`}`;
    const url = this.fasten.getConnectUrl(redirectUri);
    return { url };
  }

  /**
   * Resolve patient record for the current user (must be role patient).
   */
  async getPatientForCurrentUser(userId: string, role: string) {
    if (role !== 'patient') {
      throw new ForbiddenException(
        'Only patients can access their health connections',
      );
    }
    const patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundException('Patient record not found');
    }
    return patient;
  }

  /**
   * Ensure requesting user can access the given patient (provider: assigned, admin: yes, patient: self).
   */
  async ensureCanAccessPatient(
    patientId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      include: {
        patientProviders: { select: { providerId: true } },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (requestingUserRole === 'patient') {
      if (patient.userId !== requestingUserId) {
        throw new ForbiddenException(
          'You can only access your own health connections',
        );
      }
    } else if (requestingUserRole === 'provider') {
      const providerIds =
        patient.patientProviders?.map((p) => p.providerId) ?? [];
      if (!providerIds.includes(requestingUserId)) {
        throw new ForbiddenException(
          'You can only access health connections of assigned patients',
        );
      }
    }
    return patient;
  }

  /**
   * Add a health connection for the current user's patient (after Stitch redirect).
   */
  async addConnection(
    userId: string,
    role: string,
    orgConnectionId: string,
    sourceName?: string,
  ) {
    const patient = await this.getPatientForCurrentUser(userId, role);
    const trimmed = orgConnectionId.trim();
    if (!trimmed) {
      throw new BadRequestException('orgConnectionId is required');
    }
    const existing = await this.prisma.patientHealthConnection.findUnique({
      where: { orgConnectionId: trimmed },
    });
    if (existing) {
      if (existing.patientId !== patient.id) {
        throw new BadRequestException(
          'This connection is already linked to another patient',
        );
      }
      // Even if we already have the connection saved, trigger export again.
      // Fasten's bulk export endpoint is idempotent per org_connection_id.
      const response = this.toConnectionResponse(existing);
      if (!this.fasten.isConfigured()) {
        this.logger.warn(
          `Fasten not configured; skipping EHI export for orgConnectionId=${trimmed}`,
        );
        return response;
      }
      try {
        const result = await this.fasten.requestEhiExport(trimmed);
        if (result) {
          return {
            ...response,
            ehiExport: { taskId: result.task_id, status: result.status },
          };
        }
        this.logger.warn(
          `EHI export request returned null: patient=${patient.id} orgConnectionId=${trimmed}`,
        );
      } catch (err) {
        this.logger.warn(
          `EHI export request failed (connection already saved): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return response;
    }
    const connection = await this.prisma.patientHealthConnection.create({
      data: {
        patientId: patient.id,
        orgConnectionId: trimmed,
        sourceName: sourceName?.trim() || null,
      },
    });
    this.logger.log(
      `Health connection added: patient=${patient.id} orgConnectionId=${trimmed}`,
    );

    // Trigger bulk (EHI) export immediately after connect so records are requested right away.
    let ehiExport: { taskId: string; status: string } | undefined;
    if (!this.fasten.isConfigured()) {
      this.logger.warn(
        `Fasten not configured; skipping EHI export for orgConnectionId=${trimmed}`,
      );
    } else {
      try {
        const result = await this.fasten.requestEhiExport(trimmed);
        if (result) {
          ehiExport = { taskId: result.task_id, status: result.status };
          this.logger.log(
            `EHI export requested: patient=${patient.id} orgConnectionId=${trimmed} taskId=${result.task_id}`,
          );
        } else {
          this.logger.warn(
            `EHI export request returned null: patient=${patient.id} orgConnectionId=${trimmed}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `EHI export request failed (connection still saved): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      ...this.toConnectionResponse(connection),
      ...(ehiExport && { ehiExport }),
    };
  }

  /**
   * List health connections for the current user's patient.
   */
  async listMyConnections(userId: string, role: string) {
    const patient = await this.getPatientForCurrentUser(userId, role);
    const connections = await this.prisma.patientHealthConnection.findMany({
      where: { patientId: patient.id },
      orderBy: { connectedAt: 'desc' },
    });
    return connections.map((c) => this.toConnectionResponse(c));
  }

  /**
   * List health connections for a patient (provider or admin).
   */
  async listConnectionsForPatient(
    patientId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    await this.ensureCanAccessPatient(
      patientId,
      requestingUserId,
      requestingUserRole,
    );
    const connections = await this.prisma.patientHealthConnection.findMany({
      where: { patientId },
      orderBy: { connectedAt: 'desc' },
    });
    return connections.map((c) => this.toConnectionResponse(c));
  }

  /**
   * Remove a health connection for the current user's patient.
   */
  async removeConnection(
    userId: string,
    role: string,
    orgConnectionId: string,
  ) {
    const patient = await this.getPatientForCurrentUser(userId, role);
    const connection = await this.prisma.patientHealthConnection.findFirst({
      where: { patientId: patient.id, orgConnectionId: orgConnectionId.trim() },
    });
    if (!connection) {
      throw new NotFoundException('Connection not found');
    }
    await this.prisma.patientHealthConnection.delete({
      where: { id: connection.id },
    });
    this.logger.log(
      `Health connection removed: patient=${patient.id} orgConnectionId=${orgConnectionId}`,
    );
    return { success: true };
  }

  /**
   * Get status of a connection from Fasten (for a patient the user can access).
   */
  async getConnectionStatus(
    orgConnectionId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ): Promise<FastenConnectionStatus | null> {
    const connection = await this.prisma.patientHealthConnection.findUnique({
      where: { orgConnectionId: orgConnectionId.trim() },
      include: { patient: true },
    });
    if (!connection) throw new NotFoundException('Connection not found');
    await this.ensureCanAccessPatient(
      connection.patientId,
      requestingUserId,
      requestingUserRole,
    );
    return this.fasten.getConnectionStatus(connection.orgConnectionId);
  }

  /**
   * Request EHI export for a connection (async; results via webhook).
   */
  async requestEhiExport(
    orgConnectionId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    if (!this.fasten.isConfigured()) {
      throw new BadRequestException('Health connections are not configured');
    }
    const connection = await this.prisma.patientHealthConnection.findUnique({
      where: { orgConnectionId: orgConnectionId.trim() },
    });
    if (!connection) throw new NotFoundException('Connection not found');
    await this.ensureCanAccessPatient(
      connection.patientId,
      requestingUserId,
      requestingUserRole,
    );
    return this.fasten.requestEhiExport(connection.orgConnectionId);
  }

  private toConnectionResponse(row: {
    id: string;
    patientId: string;
    orgConnectionId: string;
    sourceName: string | null;
    connectedAt: Date;
    lastSyncedAt: Date | null;
  }) {
    return {
      id: row.id,
      orgConnectionId: row.orgConnectionId,
      sourceName: row.sourceName ?? undefined,
      connectedAt: row.connectedAt.toISOString(),
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? undefined,
    };
  }
}
