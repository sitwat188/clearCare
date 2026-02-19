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

const healthDataInclude = {
  connection: { select: { sourceName: true, orgConnectionId: true } },
} as const;

/** Row shape for health data queries (matches Prisma payload when models are generated). */
interface HealthDataObservationRow {
  id: string;
  connectionId: string;
  code: string | null;
  display: string | null;
  category: string | null;
  value: string | null;
  unit: string | null;
  effectiveAt: Date | null;
  connection?: { sourceName: string | null; orgConnectionId: string } | null;
}
interface HealthDataMedicationRow {
  id: string;
  connectionId: string;
  name: string | null;
  dosage: string | null;
  status: string | null;
  prescribedAt: Date | null;
  rawResource: unknown;
  connection?: { sourceName: string | null; orgConnectionId: string } | null;
}
interface HealthDataConditionRow {
  id: string;
  connectionId: string;
  code: string | null;
  display: string | null;
  clinicalStatus: string | null;
  onsetAt: Date | null;
  connection?: { sourceName: string | null; orgConnectionId: string } | null;
}
interface HealthDataEncounterRow {
  id: string;
  connectionId: string;
  type: string | null;
  reasonText: string | null;
  serviceType: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  connection?: { sourceName: string | null; orgConnectionId: string } | null;
}

/** Prisma delegate subset used for health data queries (avoids unresolved-type lint on this.prisma). */
interface HealthDataPrismaDelegates {
  patientHealthObservation: {
    findMany: (args: object) => Promise<HealthDataObservationRow[]>;
  };
  patientHealthMedication: {
    findMany: (args: object) => Promise<HealthDataMedicationRow[]>;
  };
  patientHealthCondition: {
    findMany: (args: object) => Promise<HealthDataConditionRow[]>;
  };
  patientHealthEncounter: {
    findMany: (args: object) => Promise<HealthDataEncounterRow[]>;
  };
}

@Injectable()
export class HealthConnectionsService {
  private readonly logger = new Logger(HealthConnectionsService.name);

  constructor(
    private prisma: PrismaService,
    private fasten: FastenConnectService,
    private config: ConfigService,
  ) {}

  /**
   * URL to start Fasten Connect flow. redirect_uri must match exactly what is registered in the Fasten Connect Portal.
   * Use FASTEN_REDIRECT_URI to set the exact callback URL, or we build from FRONTEND_URL + /patient/health-connections/callback.
   */
  getConnectUrl(): { url: string | null } {
    const explicit = this.config.get<string>('FASTEN_REDIRECT_URI')?.trim();
    const redirectUri = explicit
      ? explicit.replace(/\/+$/, '')
      : (() => {
          const frontendUrl =
            this.config.get<string>('FRONTEND_URL')?.replace(/\/+$/, '') ||
            'http://localhost:5173';
          const callbackPath = '/patient/health-connections/callback';
          return `${frontendUrl}${callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`}`;
        })();
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
      where: {
        patientId_orgConnectionId: {
          patientId: patient.id,
          orgConnectionId: trimmed,
        },
      },
    });
    if (existing) {
      // Same patient already has this connection; idempotent, trigger export again.
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
   * Get status of a connection from Fasten. For "me" pass no patientId; for provider pass the patientId from the URL.
   */
  async getConnectionStatus(
    orgConnectionId: string,
    requestingUserId: string,
    requestingUserRole: string,
    patientId?: string,
  ): Promise<FastenConnectionStatus | null> {
    const trimmed = orgConnectionId.trim();
    const connection = patientId
      ? await this.prisma.patientHealthConnection.findFirst({
          where: { patientId, orgConnectionId: trimmed },
          include: { patient: true },
        })
      : await this.getPatientForCurrentUser(
          requestingUserId,
          requestingUserRole,
        ).then((patient) =>
          this.prisma.patientHealthConnection.findFirst({
            where: { patientId: patient.id, orgConnectionId: trimmed },
            include: { patient: true },
          }),
        );
    if (!connection) throw new NotFoundException('Connection not found');
    await this.ensureCanAccessPatient(
      connection.patientId,
      requestingUserId,
      requestingUserRole,
    );
    return this.fasten.getConnectionStatus(connection.orgConnectionId);
  }

  /**
   * Get imported health data (observations, medications, conditions, encounters) for the current user's patient.
   */
  async getMyHealthData(userId: string, role: string) {
    const patient = await this.getPatientForCurrentUser(userId, role);
    return this.getHealthDataByPatientId(patient.id);
  }

  /**
   * Get imported health data for a patient (provider or admin). Ensures access.
   */
  async getHealthDataForPatient(
    patientId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    await this.ensureCanAccessPatient(
      patientId,
      requestingUserId,
      requestingUserRole,
    );
    return this.getHealthDataByPatientId(patientId);
  }

  /**
   * Get medication display name from DB name or from stored FHIR rawResource when name was not parsed at ingest.
   */
  private medicationDisplayName(
    name: string | null,
    rawResource: unknown,
  ): string | undefined {
    if (name?.trim()) return name;
    const r = rawResource as
      | {
          medicationCodeableConcept?: {
            text?: string;
            coding?: Array<{ display?: string }>;
          };
          medicationReference?: { display?: string };
        }
      | undefined;
    const mc = r?.medicationCodeableConcept;
    const ref = r?.medicationReference;
    return (
      mc?.text?.trim() ??
      mc?.coding?.[0]?.display?.trim() ??
      ref?.display?.trim() ??
      undefined
    );
  }

  private async getHealthDataByPatientId(patientId: string) {
    const db = this.prisma as unknown as HealthDataPrismaDelegates;
    const [observations, medications, conditions, encounters] =
      await Promise.all([
        db.patientHealthObservation.findMany({
          where: { patientId },
          orderBy: { effectiveAt: 'desc' },
          take: 200,
          include: healthDataInclude,
        }),
        db.patientHealthMedication.findMany({
          where: { patientId },
          orderBy: { prescribedAt: 'desc' },
          take: 200,
          include: healthDataInclude,
        }),
        db.patientHealthCondition.findMany({
          where: { patientId },
          orderBy: { onsetAt: 'desc' },
          take: 200,
          include: healthDataInclude,
        }),
        db.patientHealthEncounter.findMany({
          where: { patientId },
          orderBy: { periodStart: 'desc' },
          take: 200,
          include: healthDataInclude,
        }),
      ]);
    return {
      observations: observations.map((o) => ({
        id: o.id,
        connectionId: o.connectionId,
        sourceName: o.connection?.sourceName ?? undefined,
        code: o.code ?? undefined,
        display: o.display ?? undefined,
        category: o.category ?? undefined,
        value: o.value ?? undefined,
        unit: o.unit ?? undefined,
        effectiveAt: o.effectiveAt?.toISOString() ?? undefined,
      })),
      medications: medications.map((m) => ({
        id: m.id,
        connectionId: m.connectionId,
        sourceName: m.connection?.sourceName ?? undefined,
        name: this.medicationDisplayName(m.name, m.rawResource),
        dosage: m.dosage ?? undefined,
        status: m.status ?? undefined,
        prescribedAt: m.prescribedAt?.toISOString() ?? undefined,
      })),
      conditions: conditions.map((c) => ({
        id: c.id,
        connectionId: c.connectionId,
        sourceName: c.connection?.sourceName ?? undefined,
        code: c.code ?? undefined,
        display: c.display ?? undefined,
        clinicalStatus: c.clinicalStatus ?? undefined,
        onsetAt: c.onsetAt?.toISOString() ?? undefined,
      })),
      encounters: encounters.map((e) => ({
        id: e.id,
        connectionId: e.connectionId,
        sourceName: e.connection?.sourceName ?? undefined,
        type: e.type ?? undefined,
        reasonText: e.reasonText ?? undefined,
        serviceType: e.serviceType ?? undefined,
        periodStart: e.periodStart?.toISOString() ?? undefined,
        periodEnd: e.periodEnd?.toISOString() ?? undefined,
      })),
    };
  }

  /**
   * Request EHI export for a connection (async; results via webhook). For "me" pass no patientId; for provider pass patientId from URL.
   */
  async requestEhiExport(
    orgConnectionId: string,
    requestingUserId: string,
    requestingUserRole: string,
    patientId?: string,
  ) {
    if (!this.fasten.isConfigured()) {
      throw new BadRequestException('Health connections are not configured');
    }
    const trimmed = orgConnectionId.trim();
    const connection = patientId
      ? await this.prisma.patientHealthConnection.findFirst({
          where: { patientId, orgConnectionId: trimmed },
        })
      : await this.getPatientForCurrentUser(
          requestingUserId,
          requestingUserRole,
        ).then((patient) =>
          this.prisma.patientHealthConnection.findFirst({
            where: { patientId: patient.id, orgConnectionId: trimmed },
          }),
        );
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
    lastExportTaskId?: string | null;
    lastExportFailureReason?: string | null;
  }) {
    return {
      id: row.id,
      orgConnectionId: row.orgConnectionId,
      sourceName: row.sourceName ?? undefined,
      connectedAt: row.connectedAt.toISOString(),
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? undefined,
      lastExportTaskId: row.lastExportTaskId ?? undefined,
      lastExportFailureReason: row.lastExportFailureReason ?? undefined,
    };
  }
}
