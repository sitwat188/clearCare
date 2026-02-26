import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportGeneratorService } from '../reports/report-generator.service';

/** Shape of a row from GeneratedReport for type-safe mapping. */
interface ReportRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  generatedAt: Date;
  generatedBy: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  format: string;
  payload?: unknown;
}

/** Typed delegate for GeneratedReport to satisfy strict lint when PrismaClient types are stale. */
type GeneratedReportDelegate = {
  findMany(args: { where: object; orderBy: object; take: number }): Promise<ReportRow[]>;
  findFirst(args: { where: object }): Promise<ReportRow | null>;
  create(args: { data: object }): Promise<ReportRow>;
};

@Injectable()
export class ReportsService {
  constructor(
    private reportGenerator: ReportGeneratorService,
    private prisma: PrismaService,
  ) {}

  private get reports(): GeneratedReportDelegate {
    return (this.prisma as unknown as { generatedReport: GeneratedReportDelegate }).generatedReport;
  }

  async getReports(providerId: string): Promise<Array<Record<string, unknown>>> {
    const list = await this.reports.findMany({
      where: { scope: 'provider', providerId },
      orderBy: { generatedAt: 'desc' },
      take: 100,
    });
    return list.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description ?? undefined,
      generatedAt: r.generatedAt.toISOString(),
      generatedBy: r.generatedBy,
      dateRange: {
        start: r.dateRangeStart.toISOString(),
        end: r.dateRangeEnd.toISOString(),
      },
      format: r.format,
    }));
  }

  async getReportById(reportId: string, providerId: string): Promise<Record<string, unknown> | null> {
    const row = await this.reports.findFirst({
      where: { id: reportId, scope: 'provider', providerId },
    });
    if (!row) return null;
    return row.payload as Record<string, unknown>;
  }

  async generateReport(
    providerId: string,
    config: {
      type: string;
      dateRange: { start: string; end: string };
      format: string;
    },
  ) {
    const params = {
      providerId,
      dateRange: config.dateRange,
      format: config.format,
      generatedBy: providerId,
    };
    let report: Record<string, unknown>;
    if (config.type === 'instructions') {
      report = (await this.reportGenerator.generateInstructionsReport(params)) as unknown as Record<string, unknown>;
    } else if (config.type === 'acknowledgments') {
      report = (await this.reportGenerator.generateAcknowledgmentsReport(params)) as unknown as Record<string, unknown>;
    } else {
      report = (await this.reportGenerator.generateComplianceReport({
        scope: 'provider',
        ...params,
      })) as unknown as Record<string, unknown>;
    }
    const dateRange = report.dateRange as { start: string; end: string };
    const row = await this.reports.create({
      data: {
        type: (report.type as string) ?? 'compliance',
        title: (report.title as string) ?? 'Report',
        description: (report.description as string) ?? null,
        generatedBy: (report.generatedBy as string) ?? '',
        dateRangeStart: new Date(dateRange?.start ?? Date.now()),
        dateRangeEnd: new Date(dateRange?.end ?? Date.now()),
        format: (report.format as string) ?? 'json',
        scope: 'provider',
        providerId,
        payload: report as object,
      },
    });
    report.id = row.id;
    return report;
  }
}
