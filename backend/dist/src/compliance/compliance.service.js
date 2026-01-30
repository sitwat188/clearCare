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
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ComplianceService = class ComplianceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createComplianceRecord(createDto, requestingUserId, requestingUserRole) {
        const instruction = await this.prisma.careInstruction.findFirst({
            where: { id: createDto.instructionId, deletedAt: null },
            include: {
                patient: true,
            },
        });
        if (!instruction) {
            throw new common_1.NotFoundException('Instruction not found');
        }
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient || instruction.patientId !== patient.id) {
                throw new common_1.ForbiddenException('You can only create compliance records for your own instructions');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!instruction.patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only create compliance records for assigned patients');
            }
        }
        const existing = await this.prisma.complianceRecord.findFirst({
            where: {
                instructionId: createDto.instructionId,
                patientId: instruction.patientId,
                type: createDto.type,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Compliance record already exists for this instruction');
        }
        const compliance = await this.prisma.complianceRecord.create({
            data: {
                instructionId: createDto.instructionId,
                patientId: instruction.patientId,
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
    async getComplianceRecords(requestingUserId, requestingUserRole, filters) {
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient) {
                return [];
            }
            const where = {
                patientId: patient.id,
            };
            if (filters?.instructionId) {
                where.instructionId = filters.instructionId;
            }
            if (filters?.type) {
                where.type = filters.type;
            }
            return this.prisma.complianceRecord.findMany({
                where,
                include: {
                    instruction: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            status: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        else if (requestingUserRole === 'provider') {
            const where = {
                patient: {
                    assignedProviderIds: { has: requestingUserId },
                },
            };
            if (filters?.patientId) {
                where.patientId = filters.patientId;
            }
            if (filters?.instructionId) {
                where.instructionId = filters.instructionId;
            }
            if (filters?.type) {
                where.type = filters.type;
            }
            return this.prisma.complianceRecord.findMany({
                where,
                include: {
                    instruction: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            status: true,
                        },
                    },
                    patient: {
                        select: {
                            id: true,
                            userId: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        else if (requestingUserRole === 'administrator') {
            const where = {};
            if (filters?.patientId) {
                where.patientId = filters.patientId;
            }
            if (filters?.instructionId) {
                where.instructionId = filters.instructionId;
            }
            if (filters?.type) {
                where.type = filters.type;
            }
            return this.prisma.complianceRecord.findMany({
                where,
                include: {
                    instruction: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            status: true,
                        },
                    },
                    patient: {
                        select: {
                            id: true,
                            userId: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        return [];
    }
    async getComplianceRecord(recordId, requestingUserId, requestingUserRole) {
        const record = await this.prisma.complianceRecord.findFirst({
            where: { id: recordId },
            include: {
                instruction: {
                    include: {
                        patient: true,
                    },
                },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException('Compliance record not found');
        }
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient || record.patientId !== patient.id) {
                throw new common_1.ForbiddenException('You can only access your own compliance records');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!record.instruction.patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only access compliance records for assigned patients');
            }
        }
        return record;
    }
    async updateComplianceRecord(recordId, updateDto, requestingUserId, requestingUserRole) {
        const record = await this.prisma.complianceRecord.findFirst({
            where: { id: recordId },
            include: {
                instruction: {
                    include: {
                        patient: true,
                    },
                },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException('Compliance record not found');
        }
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient || record.patientId !== patient.id) {
                throw new common_1.ForbiddenException('You can only update your own compliance records');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!record.instruction.patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only update compliance records for assigned patients');
            }
        }
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
    async updateMedicationAdherence(recordId, updateDto, requestingUserId, requestingUserRole) {
        const record = await this.prisma.complianceRecord.findFirst({
            where: { id: recordId },
            include: {
                instruction: {
                    include: {
                        patient: true,
                    },
                },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException('Compliance record not found');
        }
        if (record.type !== 'medication') {
            throw new common_1.BadRequestException('This record is not a medication compliance record');
        }
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient || record.patientId !== patient.id) {
                throw new common_1.ForbiddenException('You can only update your own medication adherence');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!record.instruction.patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only update medication adherence for assigned patients');
            }
        }
        const existingAdherence = record.medicationAdherence || {
            schedule: [],
            overallProgress: 0,
        };
        const schedule = existingAdherence.schedule || [];
        const existingIndex = schedule.findIndex((entry) => entry.date === updateDto.date && entry.time === updateDto.time);
        if (existingIndex >= 0) {
            schedule[existingIndex] = {
                ...schedule[existingIndex],
                status: updateDto.status || schedule[existingIndex].status,
                reason: updateDto.reason || schedule[existingIndex].reason,
            };
        }
        else {
            schedule.push({
                date: updateDto.date,
                time: updateDto.time || '',
                status: updateDto.status || 'pending',
                reason: updateDto.reason || '',
            });
        }
        const takenCount = schedule.filter((entry) => entry.status === 'taken').length;
        const overallProgress = schedule.length > 0 ? (takenCount / schedule.length) * 100 : 0;
        let status = record.status;
        if (overallProgress === 100) {
            status = 'compliant';
        }
        else if (overallProgress >= 80) {
            status = 'partial';
        }
        else if (overallProgress > 0) {
            status = 'partial';
        }
        else {
            status = 'non-compliant';
        }
        const updated = await this.prisma.complianceRecord.update({
            where: { id: recordId },
            data: {
                medicationAdherence: {
                    schedule,
                    overallProgress: updateDto.progress !== undefined
                        ? updateDto.progress
                        : overallProgress,
                },
                overallPercentage: updateDto.progress !== undefined
                    ? updateDto.progress
                    : overallProgress,
                status,
                lastUpdatedBy: requestingUserId,
                updatedAt: new Date(),
            },
        });
        return updated;
    }
    async updateLifestyleCompliance(recordId, updateDto, requestingUserId, requestingUserRole) {
        const record = await this.prisma.complianceRecord.findFirst({
            where: { id: recordId },
            include: {
                instruction: {
                    include: {
                        patient: true,
                    },
                },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException('Compliance record not found');
        }
        if (record.type !== 'lifestyle') {
            throw new common_1.BadRequestException('This record is not a lifestyle compliance record');
        }
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            if (!patient || record.patientId !== patient.id) {
                throw new common_1.ForbiddenException('You can only update your own lifestyle compliance');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!record.instruction.patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only update lifestyle compliance for assigned patients');
            }
        }
        const existingCompliance = record.lifestyleCompliance || {
            checkIns: [],
            progress: 0,
        };
        const checkIns = existingCompliance.checkIns || [];
        checkIns.push({
            date: updateDto.date,
            completed: updateDto.completed !== undefined ? updateDto.completed : false,
            notes: updateDto.notes || '',
            metrics: updateDto.metrics || {},
            progress: updateDto.progress || 0,
        });
        const completedCount = checkIns.filter((entry) => entry.completed).length;
        const overallProgress = checkIns.length > 0 ? (completedCount / checkIns.length) * 100 : 0;
        let status = record.status;
        if (overallProgress === 100) {
            status = 'compliant';
        }
        else if (overallProgress >= 80) {
            status = 'partial';
        }
        else if (overallProgress > 0) {
            status = 'partial';
        }
        else {
            status = 'non-compliant';
        }
        const updated = await this.prisma.complianceRecord.update({
            where: { id: recordId },
            data: {
                lifestyleCompliance: {
                    checkIns,
                    progress: updateDto.progress !== undefined
                        ? updateDto.progress
                        : overallProgress,
                },
                overallPercentage: updateDto.progress !== undefined
                    ? updateDto.progress
                    : overallProgress,
                status,
                lastUpdatedBy: requestingUserId,
                updatedAt: new Date(),
            },
        });
        return updated;
    }
    async getComplianceMetrics(requestingUserId, requestingUserRole, filters) {
        const records = await this.getComplianceRecords(requestingUserId, requestingUserRole, filters);
        let patientId;
        if (requestingUserRole === 'patient') {
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
            });
            patientId = patient?.id;
        }
        else if (records.length > 0) {
            patientId = filters?.patientId || records[0].patientId;
        }
        const compliantCount = records.filter((r) => r.status === 'compliant').length;
        const medicationRecords = records.filter((r) => r.type === 'medication');
        const lifestyleRecords = records.filter((r) => r.type === 'lifestyle');
        const appointmentRecords = records.filter((r) => r.type === 'appointment');
        const avgPct = records.length > 0
            ? records.reduce((sum, r) => sum + r.overallPercentage, 0) / records.length
            : 0;
        const medicationPct = medicationRecords.length > 0
            ? medicationRecords.reduce((s, r) => s + r.overallPercentage, 0) /
                medicationRecords.length
            : 0;
        const lifestylePct = lifestyleRecords.length > 0
            ? lifestyleRecords.reduce((s, r) => s + r.overallPercentage, 0) /
                lifestyleRecords.length
            : 0;
        const appointmentPct = appointmentRecords.length > 0
            ? appointmentRecords.reduce((s, r) => s + r.overallPercentage, 0) /
                appointmentRecords.length
            : 0;
        const byDate = new Map();
        for (const r of records) {
            const dateStr = r.updatedAt.toISOString?.().slice(0, 10) || '';
            if (!byDate.has(dateStr))
                byDate.set(dateStr, []);
            byDate.get(dateStr).push(r.overallPercentage);
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
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map