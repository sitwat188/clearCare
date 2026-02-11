import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplianceDto } from './dto/create-compliance.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateMedicationAdherenceDto } from './dto/update-medication-adherence.dto';
import { UpdateLifestyleComplianceDto } from './dto/update-lifestyle-compliance.dto';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create compliance record
   * HIPAA: Automatically created when instruction is assigned, or manually by providers
   */
  async createComplianceRecord(
    createDto: CreateComplianceDto,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    // Verify instruction exists
    const instruction = await this.prisma.careInstruction.findFirst({
      where: { id: createDto.instructionId, deletedAt: null },
      include: {
        patient: { include: { patientProviders: { select: { providerId: true } } } },
      },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    const providerIds = instruction.patient.patientProviders?.map((pp) => pp.providerId) ?? [];

    if (requestingUserRole === 'patient') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      if (!patient || instruction.patientId !== patient.id) {
        throw new ForbiddenException(
          'You can only create compliance records for your own instructions',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (!providerIds.includes(requestingUserId)) {
        throw new ForbiddenException(
          'You can only create compliance records for assigned patients',
        );
      }
    }

    const existing = await this.prisma.complianceRecord.findFirst({
      where: {
        instructionId: createDto.instructionId,
        type: createDto.type,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Compliance record already exists for this instruction',
      );
    }

    const compliance = await this.prisma.complianceRecord.create({
      data: {
        instructionId: createDto.instructionId,
        type: createDto.type,
        status: createDto.status || 'not-started',
        overallPercentage: createDto.overallPercentage || 0,
        medicationAdherence: createDto.medicationCompliance || null,
        lifestyleCompliance: createDto.lifestyleCompliance || null,
        appointmentCompliance: createDto.appointmentCompliance || null,
        lastUpdatedBy: requestingUserId,
      },
    });

    return compliance;
  }

  /**
   * Get compliance records
   * HIPAA: Row-level access control
   */
  async getComplianceRecords(
    requestingUserId: string,
    requestingUserRole: string,
    filters?: { instructionId?: string; patientId?: string; type?: string },
  ) {
    if (requestingUserRole === 'patient') {
      // Patients see only their own compliance records
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });

      if (!patient) {
        return [];
      }

      const where: any = {
        instruction: { patientId: patient.id },
      };
      if (filters?.instructionId) where.instructionId = filters.instructionId;
      if (filters?.type) where.type = filters.type;

      return this.prisma.complianceRecord.findMany({
        where,
        include: {
          instruction: {
            select: { id: true, title: true, type: true, status: true, patientId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (requestingUserRole === 'provider') {
      const where: any = {
        instruction: {
          patient: {
            patientProviders: { some: { providerId: requestingUserId } },
          },
        },
      };
      if (filters?.patientId) {
        (where.instruction as any).patientId = filters.patientId;
      }
      if (filters?.instructionId) where.instructionId = filters.instructionId;
      if (filters?.type) where.type = filters.type;

      return this.prisma.complianceRecord.findMany({
        where,
        include: {
          instruction: {
            select: { id: true, title: true, type: true, status: true, patientId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (requestingUserRole === 'administrator') {
      const where: any = {};
      if (filters?.patientId) {
        where.instruction = { patientId: filters.patientId };
      }
      if (filters?.instructionId) where.instructionId = filters.instructionId;
      if (filters?.type) where.type = filters.type;

      return this.prisma.complianceRecord.findMany({
        where,
        include: {
          instruction: {
            select: { id: true, title: true, type: true, status: true, patientId: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return [];
  }

  /**
   * Get compliance record by ID
   * HIPAA: Row-level access control
   */
  async getComplianceRecord(
    recordId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const record = await this.prisma.complianceRecord.findFirst({
      where: { id: recordId },
      include: {
        instruction: {
          include: {
            patient: { include: { patientProviders: { select: { providerId: true } } } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Compliance record not found');
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      if (!patient || record.instruction.patientId !== patient.id) {
        throw new ForbiddenException(
          'You can only access your own compliance records',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (
        !record.instruction.patient.patientProviders?.some(
          (pp) => pp.providerId === requestingUserId,
        )
      ) {
        throw new ForbiddenException(
          'You can only access compliance records for assigned patients',
        );
      }
    }

    return record;
  }

  /**
   * Update compliance record
   * HIPAA: Row-level access control
   */
  async updateComplianceRecord(
    recordId: string,
    updateDto: UpdateComplianceDto,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const record = await this.prisma.complianceRecord.findFirst({
      where: { id: recordId },
      include: {
        instruction: {
          include: {
            patient: { include: { patientProviders: { select: { providerId: true } } } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Compliance record not found');
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      if (!patient || record.instruction.patientId !== patient.id) {
        throw new ForbiddenException(
          'You can only update your own compliance records',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (
        !record.instruction.patient.patientProviders?.some(
          (pp) => pp.providerId === requestingUserId,
        )
      ) {
        throw new ForbiddenException(
          'You can only update compliance records for assigned patients',
        );
      }
    }

    // Update compliance record
    const updated = await this.prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        ...(updateDto.status && { status: updateDto.status }),
        ...(updateDto.overallPercentage !== undefined && {
          overallPercentage: updateDto.overallPercentage,
        }),
        ...(updateDto.medicationCompliance && {
          medicationAdherence: updateDto.medicationCompliance,
        }),
        ...(updateDto.lifestyleCompliance && {
          lifestyleCompliance: updateDto.lifestyleCompliance,
        }),
        ...(updateDto.appointmentCompliance && {
          appointmentCompliance: updateDto.appointmentCompliance,
        }),
        lastUpdatedBy: requestingUserId,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Update medication adherence
   * HIPAA: Patients can update their own, providers can update for assigned patients
   */
  async updateMedicationAdherence(
    recordId: string,
    updateDto: UpdateMedicationAdherenceDto,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const record = await this.prisma.complianceRecord.findFirst({
      where: { id: recordId },
      include: {
        instruction: {
          include: {
            patient: { include: { patientProviders: { select: { providerId: true } } } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Compliance record not found');
    }

    if (record.type !== 'medication') {
      throw new BadRequestException(
        'This record is not a medication compliance record',
      );
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      if (!patient || record.instruction.patientId !== patient.id) {
        throw new ForbiddenException(
          'You can only update your own medication adherence',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (
        !record.instruction.patient.patientProviders?.some(
          (pp) => pp.providerId === requestingUserId,
        )
      ) {
        throw new ForbiddenException(
          'You can only update medication adherence for assigned patients',
        );
      }
    }

    // Get existing medication adherence data
    const existingAdherence = (record.medicationAdherence as any) || {
      schedule: [],
      overallProgress: 0,
    };

    // Update or add dose entry
    const schedule = existingAdherence.schedule || [];
    const existingIndex = schedule.findIndex(
      (entry: any) =>
        entry.date === updateDto.date && entry.time === updateDto.time,
    );

    if (existingIndex >= 0) {
      // Update existing entry
      schedule[existingIndex] = {
        ...schedule[existingIndex],
        status: updateDto.status || schedule[existingIndex].status,
        reason: updateDto.reason || schedule[existingIndex].reason,
      };
    } else {
      // Add new entry
      schedule.push({
        date: updateDto.date,
        time: updateDto.time || '',
        status: updateDto.status || 'pending',
        reason: updateDto.reason || '',
      });
    }

    // Calculate overall progress
    const takenCount = schedule.filter(
      (entry: any) => entry.status === 'taken',
    ).length;
    const overallProgress =
      schedule.length > 0 ? (takenCount / schedule.length) * 100 : 0;

    // Determine status based on progress
    let status = record.status;
    if (overallProgress === 100) {
      status = 'compliant';
    } else if (overallProgress >= 80) {
      status = 'partial';
    } else if (overallProgress > 0) {
      status = 'partial';
    } else {
      status = 'non-compliant';
    }

    // Update compliance record
    const updated = await this.prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        medicationAdherence: {
          schedule,
          overallProgress:
            updateDto.progress !== undefined
              ? updateDto.progress
              : overallProgress,
        },
        overallPercentage:
          updateDto.progress !== undefined
            ? updateDto.progress
            : overallProgress,
        status,
        lastUpdatedBy: requestingUserId,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Update lifestyle compliance
   * HIPAA: Patients can update their own, providers can update for assigned patients
   */
  async updateLifestyleCompliance(
    recordId: string,
    updateDto: UpdateLifestyleComplianceDto,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const record = await this.prisma.complianceRecord.findFirst({
      where: { id: recordId },
      include: {
        instruction: {
          include: {
            patient: { include: { patientProviders: { select: { providerId: true } } } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Compliance record not found');
    }

    if (record.type !== 'lifestyle') {
      throw new BadRequestException(
        'This record is not a lifestyle compliance record',
      );
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      if (!patient || record.instruction.patientId !== patient.id) {
        throw new ForbiddenException(
          'You can only update your own lifestyle compliance',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (
        !record.instruction.patient.patientProviders?.some(
          (pp) => pp.providerId === requestingUserId,
        )
      ) {
        throw new ForbiddenException(
          'You can only update lifestyle compliance for assigned patients',
        );
      }
    }

    // Get existing lifestyle compliance data
    const existingCompliance = (record.lifestyleCompliance as any) || {
      checkIns: [],
      progress: 0,
    };

    // Add new check-in
    const checkIns = existingCompliance.checkIns || [];
    checkIns.push({
      date: updateDto.date,
      completed:
        updateDto.completed !== undefined ? updateDto.completed : false,
      notes: updateDto.notes || '',
      metrics: updateDto.metrics || {},
      progress: updateDto.progress || 0,
    });

    // Calculate overall progress
    const completedCount = checkIns.filter(
      (entry: any) => entry.completed,
    ).length;
    const overallProgress =
      checkIns.length > 0 ? (completedCount / checkIns.length) * 100 : 0;

    // Determine status based on progress
    let status = record.status;
    if (overallProgress === 100) {
      status = 'compliant';
    } else if (overallProgress >= 80) {
      status = 'partial';
    } else if (overallProgress > 0) {
      status = 'partial';
    } else {
      status = 'non-compliant';
    }

    // Update compliance record
    const updated = await this.prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        lifestyleCompliance: {
          checkIns,
          progress:
            updateDto.progress !== undefined
              ? updateDto.progress
              : overallProgress,
        },
        overallPercentage:
          updateDto.progress !== undefined
            ? updateDto.progress
            : overallProgress,
        status,
        lastUpdatedBy: requestingUserId,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get compliance metrics/statistics
   * HIPAA: Row-level access control
   * Returns shape expected by frontend: patientId, overallScore, medicationAdherence, lifestyleCompliance, trends, etc.
   */
  async getComplianceMetrics(
    requestingUserId: string,
    requestingUserRole: string,
    filters?: { patientId?: string; instructionId?: string },
  ) {
    const records = await this.getComplianceRecords(
      requestingUserId,
      requestingUserRole,
      filters,
    );

    let patientId: string | undefined;
    if (requestingUserRole === 'patient') {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      patientId = patient?.id;
    } else if (records.length > 0) {
      patientId =
        filters?.patientId || (records[0] as any).instruction?.patientId;
    }

    const compliantCount = records.filter((r) => r.status === 'compliant').length;
    const medicationRecords = records.filter((r) => r.type === 'medication');
    const lifestyleRecords = records.filter((r) => r.type === 'lifestyle');
    const appointmentRecords = records.filter((r) => r.type === 'appointment');

    const avgPct =
      records.length > 0
        ? records.reduce((sum, r) => sum + r.overallPercentage, 0) / records.length
        : 0;
    const medicationPct =
      medicationRecords.length > 0
        ? medicationRecords.reduce((s, r) => s + r.overallPercentage, 0) /
          medicationRecords.length
        : 0;
    const lifestylePct =
      lifestyleRecords.length > 0
        ? lifestyleRecords.reduce((s, r) => s + r.overallPercentage, 0) /
          lifestyleRecords.length
        : 0;
    const appointmentPct =
      appointmentRecords.length > 0
        ? appointmentRecords.reduce((s, r) => s + r.overallPercentage, 0) /
          appointmentRecords.length
        : 0;

    // Build a simple trend from compliance records (by updatedAt date)
    const byDate = new Map<string, number[]>();
    for (const r of records) {
      const dateStr = (r.updatedAt as Date).toISOString?.().slice(0, 10) || '';
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(r.overallPercentage);
    }
    const trends = Array.from(byDate.entries())
      .map(([date, pcts]) => ({
        date,
        score: pcts.reduce((a, b) => a + b, 0) / pcts.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    return {
      patientId: patientId || '',
      overallScore: Math.round(avgPct),
      medicationAdherence: Math.round(medicationPct),
      lifestyleCompliance: Math.round(lifestylePct),
      appointmentCompliance: Math.round(appointmentPct),
      activeInstructions: records.length,
      compliantInstructions: compliantCount,
      trends,
    };
  }
}
