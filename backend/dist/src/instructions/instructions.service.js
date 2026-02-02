"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionsService = void 0;
const common_1 = require("@nestjs/common");
const encryption_service_1 = require("../common/encryption/encryption.service");
const prisma_service_1 = require("../prisma/prisma.service");
let InstructionsService = class InstructionsService {
    prisma;
    encryption;
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    decryptInstruction(instruction) {
        if (!instruction?.content)
            return instruction;
        return {
            ...instruction,
            content: this.encryption.decrypt(instruction.content),
        };
    }
    async createInstruction(createDto, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        if (requestingUserRole !== 'provider') {
            throw new common_1.ForbiddenException('Only providers can create care instructions');
        }
        const patient = await this.prisma.patient.findFirst({
            where: { id: createDto.patientId, deletedAt: null },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        if (!patient.assignedProviderIds.includes(requestingUserId)) {
            throw new common_1.ForbiddenException('You can only create instructions for patients assigned to you');
        }
        const provider = await this.prisma.user.findFirst({
            where: { id: requestingUserId, deletedAt: null },
        });
        const patientUser = await this.prisma.user.findFirst({
            where: { id: patient.userId, deletedAt: null },
        });
        if (!provider || !patientUser) {
            throw new common_1.NotFoundException('Provider or patient user not found');
        }
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
                medicationDetails: createDto.medicationDetails || null,
                lifestyleDetails: createDto.lifestyleDetails || null,
                followUpDetails: createDto.followUpDetails || null,
                warningDetails: createDto.warningDetails || null,
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
    async getInstruction(instructionId, requestingUserId, requestingUserRole) {
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
            throw new common_1.NotFoundException('Instruction not found');
        }
        if (requestingUserRole === 'patient') {
            const user = await this.prisma.user.findFirst({
                where: { id: requestingUserId, deletedAt: null },
            });
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient || instruction.patientId !== patient.id) {
                throw new common_1.ForbiddenException('You can only access your own instructions');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (instruction.patient.assignedProviderIds &&
                !instruction.patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only access instructions for patients assigned to you');
            }
        }
        return this.decryptInstruction(instruction);
    }
    async getInstructions(requestingUserId, requestingUserRole, filters) {
        if (requestingUserRole === 'patient') {
            let patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient) {
                const user = await this.prisma.user.findFirst({
                    where: { id: requestingUserId, deletedAt: null },
                });
                if (!user)
                    return [];
                patient = await this.prisma.patient.create({
                    data: {
                        userId: user.id,
                        dateOfBirth: '',
                        medicalRecordNumber: `TEMP-${user.id.slice(0, 8)}`,
                        assignedProviderIds: [],
                    },
                });
            }
            const where = {
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
        }
        else if (requestingUserRole === 'provider') {
            const where = {
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
        }
        else if (requestingUserRole === 'administrator') {
            const where = {
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
    async updateInstruction(instructionId, updateDto, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        const instruction = await this.prisma.careInstruction.findFirst({
            where: { id: instructionId, deletedAt: null },
            include: {
                patient: true,
            },
        });
        if (!instruction) {
            throw new common_1.NotFoundException('Instruction not found');
        }
        if (requestingUserRole !== 'provider') {
            throw new common_1.ForbiddenException('Only providers can update instructions');
        }
        if (!instruction.patient.assignedProviderIds.includes(requestingUserId)) {
            throw new common_1.ForbiddenException('You can only update instructions for patients assigned to you');
        }
        const oldValues = {
            title: instruction.title,
            type: instruction.type,
            status: instruction.status,
            content: instruction.content,
        };
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
                    medicationDetails: updateDto.medicationDetails,
                }),
                ...(updateDto.lifestyleDetails && {
                    lifestyleDetails: updateDto.lifestyleDetails,
                }),
                ...(updateDto.followUpDetails && {
                    followUpDetails: updateDto.followUpDetails,
                }),
                ...(updateDto.warningDetails && {
                    warningDetails: updateDto.warningDetails,
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
    async deleteInstruction(instructionId, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        const instruction = await this.prisma.careInstruction.findFirst({
            where: { id: instructionId, deletedAt: null },
            include: {
                patient: true,
            },
        });
        if (!instruction) {
            throw new common_1.NotFoundException('Instruction not found');
        }
        if (requestingUserRole !== 'provider') {
            throw new common_1.ForbiddenException('Only providers can delete instructions');
        }
        if (!instruction.patient.assignedProviderIds.includes(requestingUserId)) {
            throw new common_1.ForbiddenException('You can only delete instructions for patients assigned to you');
        }
        await this.prisma.careInstruction.update({
            where: { id: instructionId },
            data: { deletedAt: new Date() },
        });
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
    async acknowledgeInstruction(instructionId, acknowledgeDto, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        if (requestingUserRole !== 'patient') {
            throw new common_1.ForbiddenException('Only patients can acknowledge instructions');
        }
        const instruction = await this.prisma.careInstruction.findFirst({
            where: { id: instructionId, deletedAt: null },
            include: {
                patient: true,
            },
        });
        if (!instruction) {
            throw new common_1.NotFoundException('Instruction not found');
        }
        const patient = await this.prisma.patient.findFirst({
            where: { userId: requestingUserId, deletedAt: null },
        });
        if (!patient || instruction.patientId !== patient.id) {
            throw new common_1.ForbiddenException('You can only acknowledge your own instructions');
        }
        await this.prisma.acknowledgment.create({
            data: {
                instructionId: instruction.id,
                patientId: patient.id,
                acknowledgmentType: acknowledgeDto.acknowledgmentType,
                ipAddress: ipAddress || '',
                userAgent: userAgent || '',
            },
        });
        const acknowledgments = await this.prisma.acknowledgment.findMany({
            where: { instructionId: instruction.id },
        });
        const hasReceipt = acknowledgments.some((a) => a.acknowledgmentType === 'receipt');
        const hasUnderstanding = acknowledgments.some((a) => a.acknowledgmentType === 'understanding');
        const hasCommitment = acknowledgments.some((a) => a.acknowledgmentType === 'commitment');
        let newStatus = instruction.status;
        if (hasReceipt &&
            hasUnderstanding &&
            hasCommitment &&
            instruction.status === 'active') {
            newStatus = 'acknowledged';
        }
        const updatedInstruction = await this.prisma.careInstruction.update({
            where: { id: instructionId },
            data: {
                status: newStatus,
                acknowledgedDate: hasReceipt && hasUnderstanding && hasCommitment
                    ? new Date()
                    : instruction.acknowledgedDate,
                updatedAt: new Date(),
            },
        });
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
};
exports.InstructionsService = InstructionsService;
exports.InstructionsService = InstructionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], InstructionsService);
//# sourceMappingURL=instructions.service.js.map