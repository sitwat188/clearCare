import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructionDto } from './dto/create-instruction.dto';
import { UpdateInstructionDto } from './dto/update-instruction.dto';
import { AcknowledgeInstructionDto } from './dto/acknowledge-instruction.dto';

@Injectable()
export class InstructionsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  /** Decrypt instruction content for API response (backward compatible with plaintext). */
  private decryptInstruction<
    T extends {
      content?: string | null;
      medicationDetails?: unknown;
      lifestyleDetails?: unknown;
      followUpDetails?: unknown;
      warningDetails?: unknown;
    },
  >(instruction: T): T {
    if (!instruction) return instruction;
    const out = { ...instruction } as T;
    if (instruction.content) {
      (out as { content: string }).content = this.encryption.decrypt(
        instruction.content,
      );
    }
    const jsonFields = [
      'medicationDetails',
      'lifestyleDetails',
      'followUpDetails',
      'warningDetails',
    ] as const;
    for (const key of jsonFields) {
      const val = instruction[key];
      const dec = this.decryptJsonDetails(val);
      if (dec !== undefined) (out as Record<string, unknown>)[key] = dec;
    }
    return out;
  }

  /** Encrypt a JSON-serializable object for storage (PHI in instruction details). */
  private encryptJsonDetails(
    val: object | null | undefined,
  ): Record<string, string> | null {
    if (val == null) return null;
    try {
      const json = JSON.stringify(val);
      return { _encrypted: this.encryption.encrypt(json) };
    } catch {
      return null;
    }
  }

  /** Decrypt stored JSON details (backward compatible with plain JSON). */
  private decryptJsonDetails(val: unknown): object | null | undefined {
    if (val == null) return val as null | undefined;
    if (
      typeof val === 'object' &&
      val !== null &&
      '_encrypted' in val &&
      typeof (val as { _encrypted: string })._encrypted === 'string'
    ) {
      try {
        const dec = this.encryption.decrypt(
          (val as { _encrypted: string })._encrypted,
        );
        return dec ? (JSON.parse(dec) as object) : null;
      } catch {
        return null;
      }
    }
    return val as object;
  }

  /**
   * Create a new care instruction
   * HIPAA: Only providers can create instructions for their assigned patients
   */
  async createInstruction(
    createDto: CreateInstructionDto,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // HIPAA: Only providers can create instructions
    if (requestingUserRole !== 'provider') {
      throw new ForbiddenException(
        'Only providers can create care instructions',
      );
    }

    // Verify patient exists and is assigned to provider
    const patient = await this.prisma.patient.findFirst({
      where: { id: createDto.patientId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // HIPAA: Provider can only create instructions for assigned patients
    if (!patient.assignedProviderIds.includes(requestingUserId)) {
      throw new ForbiddenException(
        'You can only create instructions for patients assigned to you',
      );
    }

    // Get provider and patient user info
    const provider = await this.prisma.user.findFirst({
      where: { id: requestingUserId, deletedAt: null },
    });

    const patientUser = await this.prisma.user.findFirst({
      where: { id: patient.userId, deletedAt: null },
    });

    if (!provider || !patientUser) {
      throw new NotFoundException('Provider or patient user not found');
    }

    // Create instruction (encrypt content at rest)
    const instruction = await this.prisma.careInstruction.create({
      data: {
        providerId: requestingUserId,
        providerName: `${provider.firstName} ${provider.lastName}`,
        patientId: createDto.patientId,
        patientName: `${patientUser.firstName} ${patientUser.lastName}`,
        title: createDto.title,
        type: createDto.type,
        priority: createDto.priority || 'medium',
        content: this.encryption.encrypt(createDto.content),
        medicationDetails: this.encryptJsonDetails(createDto.medicationDetails ?? undefined) as object | null,
        lifestyleDetails: this.encryptJsonDetails(createDto.lifestyleDetails ?? undefined) as object | null,
        followUpDetails: this.encryptJsonDetails(createDto.followUpDetails ?? undefined) as object | null,
        warningDetails: this.encryptJsonDetails(createDto.warningDetails ?? undefined) as object | null,
        assignedDate: createDto.assignedDate
          ? new Date(createDto.assignedDate)
          : new Date(),
        acknowledgmentDeadline: createDto.acknowledgmentDeadline
          ? new Date(createDto.acknowledgmentDeadline)
          : null,
        expirationDate: createDto.expirationDate
          ? new Date(createDto.expirationDate)
          : null,
        complianceTrackingEnabled: createDto.complianceTrackingEnabled || false,
        lifestyleTrackingEnabled: createDto.lifestyleTrackingEnabled || false,
        status: 'active',
        version: 1,
      },
    });

    // Create history entry
    await this.prisma.instructionHistory.create({
      data: {
        instructionId: instruction.id,
        action: 'create',
        changedBy: requestingUserId,
        newValues: {
          title: instruction.title,
          type: instruction.type,
          patientId: instruction.patientId,
        },
        ipAddress,
        userAgent,
      },
    });

    return this.decryptInstruction(instruction);
  }

  /**
   * Get instruction by ID
   * HIPAA: Row-level access control
   */
  async getInstruction(
    instructionId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const instruction = await this.prisma.careInstruction.findFirst({
      where: { id: instructionId, deletedAt: null },
      include: {
        acknowledgments: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        patient: {
          select: {
            id: true,
            userId: true,
            assignedProviderIds: true,
          },
        },
      },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      // Patients can only access their own instructions
      const user = await this.prisma.user.findFirst({
        where: { id: requestingUserId, deletedAt: null },
      });
      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });
      if (!patient || instruction.patientId !== patient.id) {
        throw new ForbiddenException(
          'You can only access your own instructions',
        );
      }
    } else if (requestingUserRole === 'provider') {
      // Providers can only access instructions for assigned patients
      if (
        instruction.patient.assignedProviderIds &&
        !instruction.patient.assignedProviderIds.includes(requestingUserId)
      ) {
        throw new ForbiddenException(
          'You can only access instructions for patients assigned to you',
        );
      }
    }
    // Administrators can access all instructions

    return this.decryptInstruction(instruction);
  }

  /**
   * Get all instructions (with access control)
   * HIPAA: Row-level access control
   */
  async getInstructions(
    requestingUserId: string,
    requestingUserRole: string,
    filters?: { patientId?: string; status?: string; type?: string },
  ) {
    if (requestingUserRole === 'patient') {
      // Patients see only their own instructions
      let patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
      });

      // If user has no Patient record (e.g. registered but seed not run), create one so seed can attach instructions later
      if (!patient) {
        const user = await this.prisma.user.findFirst({
          where: { id: requestingUserId, deletedAt: null },
        });
        if (!user) return [];
        patient = await this.prisma.patient.create({
          data: {
            userId: user.id,
            dateOfBirth: '',
            medicalRecordNumber: `TEMP-${user.id.slice(0, 8)}`,
            assignedProviderIds: [],
          },
        });
      }

      const where: any = {
        patientId: patient.id,
        deletedAt: null,
      };

      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.type) {
        where.type = filters.type;
      }

      const list = await this.prisma.careInstruction.findMany({
        where,
        include: {
          acknowledgments: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return list.map((i) => this.decryptInstruction(i));
    } else if (requestingUserRole === 'provider') {
      // Providers see instructions for assigned patients
      const where: any = {
        deletedAt: null,
        patient: {
          assignedProviderIds: { has: requestingUserId },
        },
      };

      if (filters?.patientId) {
        where.patientId = filters.patientId;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.type) {
        where.type = filters.type;
      }

      const list = await this.prisma.careInstruction.findMany({
        where,
        include: {
          acknowledgments: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
          patient: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return list.map((i) => this.decryptInstruction(i));
    } else if (requestingUserRole === 'administrator') {
      // Administrators see all instructions
      const where: any = {
        deletedAt: null,
      };

      if (filters?.patientId) {
        where.patientId = filters.patientId;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.type) {
        where.type = filters.type;
      }

      const list = await this.prisma.careInstruction.findMany({
        where,
        include: {
          acknowledgments: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
          patient: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return list.map((i) => this.decryptInstruction(i));
    }

    return [];
  }

  /**
   * Update instruction
   * HIPAA: Only providers can update instructions for their assigned patients
   */
  async updateInstruction(
    instructionId: string,
    updateDto: UpdateInstructionDto,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const instruction = await this.prisma.careInstruction.findFirst({
      where: { id: instructionId, deletedAt: null },
      include: {
        patient: true,
      },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    // HIPAA: Only providers can update instructions
    if (requestingUserRole !== 'provider') {
      throw new ForbiddenException('Only providers can update instructions');
    }

    // HIPAA: Provider can only update instructions for assigned patients
    if (!instruction.patient.assignedProviderIds.includes(requestingUserId)) {
      throw new ForbiddenException(
        'You can only update instructions for patients assigned to you',
      );
    }

    // Get old values for history
    const oldValues = {
      title: instruction.title,
      type: instruction.type,
      status: instruction.status,
      content: instruction.content,
    };

    // Update instruction
    const updatedInstruction = await this.prisma.careInstruction.update({
      where: { id: instructionId },
      data: {
        ...(updateDto.title && { title: updateDto.title }),
        ...(updateDto.type && { type: updateDto.type }),
        ...(updateDto.priority && { priority: updateDto.priority }),
        ...(updateDto.content && {
          content: this.encryption.encrypt(updateDto.content),
        }),
        ...(updateDto.medicationDetails && {
          medicationDetails: this.encryptJsonDetails(updateDto.medicationDetails) as object,
        }),
        ...(updateDto.lifestyleDetails && {
          lifestyleDetails: this.encryptJsonDetails(updateDto.lifestyleDetails) as object,
        }),
        ...(updateDto.followUpDetails && {
          followUpDetails: this.encryptJsonDetails(updateDto.followUpDetails) as object,
        }),
        ...(updateDto.warningDetails && {
          warningDetails: this.encryptJsonDetails(updateDto.warningDetails) as object,
        }),
        ...(updateDto.assignedDate && {
          assignedDate: new Date(updateDto.assignedDate),
        }),
        ...(updateDto.acknowledgmentDeadline && {
          acknowledgmentDeadline: new Date(updateDto.acknowledgmentDeadline),
        }),
        ...(updateDto.expirationDate && {
          expirationDate: new Date(updateDto.expirationDate),
        }),
        ...(updateDto.status && { status: updateDto.status }),
        ...(updateDto.complianceTrackingEnabled !== undefined && {
          complianceTrackingEnabled: updateDto.complianceTrackingEnabled,
        }),
        ...(updateDto.lifestyleTrackingEnabled !== undefined && {
          lifestyleTrackingEnabled: updateDto.lifestyleTrackingEnabled,
        }),
        version: instruction.version + 1,
        updatedAt: new Date(),
      },
    });

    // Create history entry
    await this.prisma.instructionHistory.create({
      data: {
        instructionId: instruction.id,
        action: 'update',
        changedBy: requestingUserId,
        oldValues,
        newValues: {
          title: updatedInstruction.title,
          type: updatedInstruction.type,
          status: updatedInstruction.status,
        },
        ipAddress,
        userAgent,
      },
    });

    return this.decryptInstruction(updatedInstruction);
  }

  /**
   * Delete instruction (soft delete)
   * HIPAA: Only providers can delete instructions for their assigned patients
   */
  async deleteInstruction(
    instructionId: string,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const instruction = await this.prisma.careInstruction.findFirst({
      where: { id: instructionId, deletedAt: null },
      include: {
        patient: true,
      },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    // HIPAA: Only providers can delete instructions
    if (requestingUserRole !== 'provider') {
      throw new ForbiddenException('Only providers can delete instructions');
    }

    // HIPAA: Provider can only delete instructions for assigned patients
    if (!instruction.patient.assignedProviderIds.includes(requestingUserId)) {
      throw new ForbiddenException(
        'You can only delete instructions for patients assigned to you',
      );
    }

    // Soft delete
    await this.prisma.careInstruction.update({
      where: { id: instructionId },
      data: { deletedAt: new Date() },
    });

    // Create history entry
    await this.prisma.instructionHistory.create({
      data: {
        instructionId: instruction.id,
        action: 'delete',
        changedBy: requestingUserId,
        oldValues: {
          title: instruction.title,
          status: instruction.status,
        },
        ipAddress,
        userAgent,
      },
    });

    return { message: 'Instruction deleted successfully' };
  }

  /**
   * Acknowledge instruction
   * HIPAA: Patients can only acknowledge their own instructions
   */
  async acknowledgeInstruction(
    instructionId: string,
    acknowledgeDto: AcknowledgeInstructionDto,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // HIPAA: Only patients can acknowledge instructions
    if (requestingUserRole !== 'patient') {
      throw new ForbiddenException(
        'Only patients can acknowledge instructions',
      );
    }

    const instruction = await this.prisma.careInstruction.findFirst({
      where: { id: instructionId, deletedAt: null },
      include: {
        patient: true,
      },
    });

    if (!instruction) {
      throw new NotFoundException('Instruction not found');
    }

    // HIPAA: Patient can only acknowledge their own instructions
    const patient = await this.prisma.patient.findFirst({
      where: { userId: requestingUserId, deletedAt: null },
    });

    if (!patient || instruction.patientId !== patient.id) {
      throw new ForbiddenException(
        'You can only acknowledge your own instructions',
      );
    }

    // Create acknowledgment
    await this.prisma.acknowledgment.create({
      data: {
        instructionId: instruction.id,
        patientId: patient.id,
        acknowledgmentType: acknowledgeDto.acknowledgmentType,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
      },
    });

    // Update instruction status if all acknowledgments are complete
    const acknowledgments = await this.prisma.acknowledgment.findMany({
      where: { instructionId: instruction.id },
    });

    const hasReceipt = acknowledgments.some(
      (a) => a.acknowledgmentType === 'receipt',
    );
    const hasUnderstanding = acknowledgments.some(
      (a) => a.acknowledgmentType === 'understanding',
    );
    const hasCommitment = acknowledgments.some(
      (a) => a.acknowledgmentType === 'commitment',
    );

    let newStatus = instruction.status;
    if (
      hasReceipt &&
      hasUnderstanding &&
      hasCommitment &&
      instruction.status === 'active'
    ) {
      newStatus = 'acknowledged';
    }

    // Update instruction
    const updatedInstruction = await this.prisma.careInstruction.update({
      where: { id: instructionId },
      data: {
        status: newStatus,
        acknowledgedDate:
          hasReceipt && hasUnderstanding && hasCommitment
            ? new Date()
            : instruction.acknowledgedDate,
        updatedAt: new Date(),
      },
    });

    // Create history entry
    await this.prisma.instructionHistory.create({
      data: {
        instructionId: instruction.id,
        action: 'acknowledge',
        changedBy: requestingUserId,
        newValues: {
          acknowledgmentType: acknowledgeDto.acknowledgmentType,
          status: newStatus,
        },
        ipAddress,
        userAgent,
      },
    });

    return this.decryptInstruction(updatedInstruction);
  }
}
