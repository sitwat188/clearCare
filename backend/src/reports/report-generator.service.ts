import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';

export interface ReportDateRange {
  start: string;
  end: string;
}

export interface GenerateComplianceReportParams {
  scope: 'provider' | 'admin';
  providerId?: string;
  dateRange: ReportDateRange;
  format: string;
  generatedBy: string;
}

export interface ComplianceReportData {
  dateRange: ReportDateRange;
  totalPatients: number;
  totalInstructions: number;
  acknowledgedInstructions: number;
  complianceRecordsCount: number;
  averageCompliancePercent: number;
  byPatient: Array<{
    patientId: string;
    instructions: number;
    acknowledged: number;
    complianceAvg: number;
  }>;
}

export interface GeneratedReportPayload {
  id: string;
  type: string;
  title: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  dateRange: ReportDateRange;
  data: ComplianceReportData | Record<string, unknown>;
  format: string;
}

export interface GenerateInstructionsReportParams {
  providerId: string;
  dateRange: ReportDateRange;
  format: string;
  generatedBy: string;
}

export interface GenerateAcknowledgmentsReportParams {
  providerId: string;
  dateRange: ReportDateRange;
  format: string;
  generatedBy: string;
}

/**
 * Shared report generator. Used by provider ReportsService and admin AdminService
 * for compliance reports so logic is not duplicated.
 */
@Injectable()
export class ReportGeneratorService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  /**
   * Generate a compliance report for the given scope (provider = assigned patients only, admin = all).
   */
  async generateComplianceReport(params: GenerateComplianceReportParams): Promise<GeneratedReportPayload> {
    const { scope, providerId, dateRange, format, generatedBy } = params;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    const patientWhere =
      scope === 'provider' && providerId
        ? {
            patientProviders: { some: { providerId } },
            deletedAt: null,
          }
        : { deletedAt: null };

    const patients = await this.prisma.patient.findMany({
      where: patientWhere,
      select: { id: true },
    });

    const instructionsWhere =
      scope === 'provider' && providerId
        ? {
            providerId,
            deletedAt: null,
            assignedDate: { gte: start, lte: end },
          }
        : {
            deletedAt: null,
            assignedDate: { gte: start, lte: end },
          };

    const instructions = await this.prisma.careInstruction.findMany({
      where: instructionsWhere,
      select: {
        id: true,
        patientId: true,
        acknowledgedDate: true,
      },
    });

    const complianceWhere =
      scope === 'provider' && providerId
        ? {
            instruction: {
              patient: {
                patientProviders: { some: { providerId } },
              },
            },
            updatedAt: { gte: start, lte: end },
          }
        : {
            updatedAt: { gte: start, lte: end },
          };

    const complianceRecords = await this.prisma.complianceRecord.findMany({
      where: complianceWhere,
      select: { overallPercentage: true },
    });

    const byPatient = new Map<string, { instructions: number; acknowledged: number; complianceAvg: number }>();
    for (const p of patients) {
      byPatient.set(p.id, { instructions: 0, acknowledged: 0, complianceAvg: 0 });
    }
    for (const i of instructions) {
      const entry = byPatient.get(i.patientId);
      if (entry) {
        entry.instructions += 1;
        if (i.acknowledgedDate) entry.acknowledged += 1;
      }
    }
    const totalCompliance = complianceRecords.reduce((sum, c) => sum + c.overallPercentage, 0);
    const complianceCount = complianceRecords.length;
    const avgCompliance = complianceCount > 0 ? totalCompliance / complianceCount : 0;

    const data: ComplianceReportData = {
      dateRange,
      totalPatients: patients.length,
      totalInstructions: instructions.length,
      acknowledgedInstructions: instructions.filter((i) => i.acknowledgedDate).length,
      complianceRecordsCount: complianceRecords.length,
      averageCompliancePercent: Math.round(avgCompliance * 10) / 10,
      byPatient: Array.from(byPatient.entries()).map(([patientId, stats]) => ({
        patientId,
        ...stats,
      })),
    };

    return {
      id: `report-${Date.now()}`,
      type: 'compliance',
      title: 'Compliance Report',
      description: `Report for ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      generatedBy,
      dateRange,
      data,
      format,
    };
  }

  /**
   * Generate an instructions report for a provider (assigned patients, instructions in date range).
   */
  async generateInstructionsReport(params: GenerateInstructionsReportParams): Promise<GeneratedReportPayload> {
    const { providerId, dateRange, format, generatedBy } = params;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    const instructions = await this.prisma.careInstruction.findMany({
      where: {
        providerId,
        deletedAt: null,
        assignedDate: { gte: start, lte: end },
      },
      select: {
        id: true,
        title: true,
        patientId: true,
        type: true,
        status: true,
        priority: true,
        assignedDate: true,
        acknowledgedDate: true,
      },
    });

    const patientIds = [...new Set(instructions.map((i) => i.patientId))];
    const patients =
      patientIds.length > 0
        ? await this.prisma.patient.findMany({
            where: { id: { in: patientIds } },
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          })
        : [];
    const patientNames = new Map(
      patients.map((p) => {
        const userView = p.user != null ? this.encryption.decryptedView(p.user, ['firstName', 'lastName']) : null;
        const first = userView?.firstName ?? '';
        const last = userView?.lastName ?? '';
        return [p.id, `${first} ${last}`.trim() || p.id];
      }),
    );

    const rows = instructions.map((i) => ({
      'Instruction ID': i.id,
      Title: i.title,
      Patient: patientNames.get(i.patientId) ?? i.patientId,
      Type: i.type,
      Status: i.status,
      Priority: i.priority,
      'Assigned Date': i.assignedDate.toISOString().slice(0, 10),
      Acknowledged: i.acknowledgedDate ? 'Yes' : 'No',
    }));

    return {
      id: `report-${Date.now()}`,
      type: 'instructions',
      title: 'Instructions Report',
      description: `Report for ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      generatedBy,
      dateRange,
      data: { rows },
      format,
    };
  }

  /**
   * Generate an acknowledgments report for a provider (only acknowledged instructions in date range).
   */
  async generateAcknowledgmentsReport(params: GenerateAcknowledgmentsReportParams): Promise<GeneratedReportPayload> {
    const { providerId, dateRange, format, generatedBy } = params;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    const instructions = await this.prisma.careInstruction.findMany({
      where: {
        providerId,
        deletedAt: null,
        acknowledgedDate: { not: null, gte: start, lte: end },
      },
      select: {
        id: true,
        title: true,
        patientId: true,
        type: true,
        acknowledgedDate: true,
      },
    });

    const patientIds = [...new Set(instructions.map((i) => i.patientId))];
    const patients =
      patientIds.length > 0
        ? await this.prisma.patient.findMany({
            where: { id: { in: patientIds } },
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          })
        : [];
    const patientNames = new Map(
      patients.map((p) => {
        const userView = p.user != null ? this.encryption.decryptedView(p.user, ['firstName', 'lastName']) : null;
        const first = userView?.firstName ?? '';
        const last = userView?.lastName ?? '';
        return [p.id, `${first} ${last}`.trim() || p.id];
      }),
    );

    const rows = instructions.map((i) => ({
      'Instruction ID': i.id,
      Title: i.title,
      Patient: patientNames.get(i.patientId) ?? i.patientId,
      Type: i.type,
      'Acknowledged Date': i.acknowledgedDate!.toISOString(),
      Status: 'acknowledged',
    }));

    return {
      id: `report-${Date.now()}`,
      type: 'acknowledgments',
      title: 'Acknowledgments Report',
      description: `Report for ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      generatedBy,
      dateRange,
      data: { rows },
      format,
    };
  }
}
