import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  getReports(providerId: string) {
    void providerId; // Reserved for future use
    // Return empty list; in future could persist generated reports
    return [];
  }

  async generateReport(
    providerId: string,
    config: {
      type: string;
      dateRange: { start: string; end: string };
      format: string;
    },
  ) {
    const start = new Date(config.dateRange.start);
    const end = new Date(config.dateRange.end);

    const patients = await this.prisma.patient.findMany({
      where: {
        patientProviders: { some: { providerId } },
        deletedAt: null,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const instructions = await this.prisma.careInstruction.findMany({
      where: {
        providerId,
        deletedAt: null,
        assignedDate: { gte: start, lte: end },
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    const complianceRecords = await this.prisma.complianceRecord.findMany({
      where: {
        instruction: {
          patient: {
            patientProviders: { some: { providerId } },
          },
        },
        updatedAt: { gte: start, lte: end },
      },
      include: {
        instruction: {
          select: { title: true, type: true },
          include: {
            patient: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const byPatient = new Map<string, { instructions: number; acknowledged: number; complianceAvg: number }>();
    for (const p of patients) {
      byPatient.set(p.id, {
        instructions: 0,
        acknowledged: 0,
        complianceAvg: 0,
      });
    }
    for (const i of instructions) {
      const entry = byPatient.get(i.patientId);
      if (entry) {
        entry.instructions += 1;
        if (i.acknowledgedDate) entry.acknowledged += 1;
      }
    }
    let totalCompliance = 0;
    let complianceCount = 0;
    for (const c of complianceRecords) {
      totalCompliance += c.overallPercentage;
      complianceCount += 1;
    }
    const avgCompliance = complianceCount > 0 ? totalCompliance / complianceCount : 0;

    const summary = {
      dateRange: config.dateRange,
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
      type: config.type,
      title: `${config.type} Report`,
      description: `Report for ${config.dateRange.start} to ${config.dateRange.end}`,
      generatedAt: new Date().toISOString(),
      generatedBy: providerId,
      dateRange: config.dateRange,
      data: summary,
      format: config.format,
    };
  }
}
