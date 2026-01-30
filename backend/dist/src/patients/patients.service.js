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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PatientsService = class PatientsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPatient(createDto, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        if (requestingUserRole !== 'administrator') {
            throw new common_1.ForbiddenException('Only administrators can create patient records');
        }
        const user = await this.prisma.user.findFirst({
            where: { id: createDto.userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existingPatient = await this.prisma.patient.findFirst({
            where: { userId: createDto.userId, deletedAt: null },
        });
        if (existingPatient) {
            throw new common_1.BadRequestException('Patient record already exists for this user');
        }
        const patient = await this.prisma.patient.create({
            data: {
                userId: createDto.userId,
                dateOfBirth: createDto.dateOfBirth ?? '',
                medicalRecordNumber: createDto.medicalRecordNumber ?? '',
                phone: createDto.phone ?? null,
                addressStreet: createDto.addressStreet ?? null,
                addressCity: createDto.addressCity ?? null,
                addressState: createDto.addressState ?? null,
                addressZipCode: createDto.addressZipCode ?? null,
                emergencyContactName: createDto.emergencyContactName ?? createDto.emergencyContact ?? null,
                emergencyContactRelationship: createDto.emergencyContactRelationship ?? null,
                emergencyContactPhone: createDto.emergencyContactPhone ?? null,
                assignedProviderIds: createDto.assignedProviderIds ?? [],
            },
        });
        await this.prisma.patientHistory.create({
            data: {
                patientId: patient.id,
                action: 'create',
                changedBy: requestingUserId,
                newValues: {
                    userId: patient.userId,
                    dateOfBirth: patient.dateOfBirth,
                    medicalRecordNumber: patient.medicalRecordNumber,
                },
                ipAddress,
                userAgent,
            },
        });
        const withUser = await this.prisma.patient.findFirst({
            where: { id: patient.id },
            include: { user: true },
        });
        return withUser ? this.toPatientResponse(withUser) : patient;
    }
    async getPatient(patientId, requestingUserId, requestingUserRole) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, deletedAt: null },
            include: {
                user: true,
                instructions: {
                    where: { deletedAt: null },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        if (requestingUserRole === 'patient') {
            if (patient.userId !== requestingUserId) {
                throw new common_1.ForbiddenException('You can only access your own patient data');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only access patients assigned to you');
            }
        }
        return this.toPatientResponse(patient);
    }
    toPatientResponse(patient) {
        const { user: u, ...rest } = patient;
        return {
            ...rest,
            firstName: u?.firstName ?? '',
            lastName: u?.lastName ?? '',
            email: u?.email ?? '',
            address: patient.addressStreet || patient.addressCity
                ? {
                    street: patient.addressStreet ?? '',
                    city: patient.addressCity ?? '',
                    state: patient.addressState ?? '',
                    zipCode: patient.addressZipCode ?? '',
                }
                : undefined,
            emergencyContact: patient.emergencyContactName || patient.emergencyContactPhone
                ? {
                    name: patient.emergencyContactName ?? '',
                    relationship: patient.emergencyContactRelationship ?? '',
                    phone: patient.emergencyContactPhone ?? '',
                }
                : undefined,
            createdAt: patient.createdAt?.toISOString?.() ?? patient.createdAt,
            updatedAt: patient.updatedAt?.toISOString?.() ?? patient.updatedAt,
        };
    }
    async getPatients(requestingUserId, requestingUserRole) {
        if (requestingUserRole === 'patient') {
            const user = await this.prisma.user.findFirst({
                where: { id: requestingUserId, deletedAt: null },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const patient = await this.prisma.patient.findFirst({
                where: { userId: requestingUserId, deletedAt: null },
                include: { user: true },
            });
            return patient ? [this.toPatientResponse(patient)] : [];
        }
        else if (requestingUserRole === 'provider') {
            const list = await this.prisma.patient.findMany({
                where: {
                    assignedProviderIds: { has: requestingUserId },
                    deletedAt: null,
                },
                include: {
                    user: true,
                    instructions: {
                        where: { deletedAt: null },
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            return list.map((p) => this.toPatientResponse(p));
        }
        else if (requestingUserRole === 'administrator') {
            const list = await this.prisma.patient.findMany({
                where: { deletedAt: null },
                include: {
                    user: true,
                    instructions: {
                        where: { deletedAt: null },
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            return list.map((p) => this.toPatientResponse(p));
        }
        return [];
    }
    async updatePatient(patientId, updateDto, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, deletedAt: null },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        if (requestingUserRole === 'patient') {
            const user = await this.prisma.user.findFirst({
                where: { id: requestingUserId, deletedAt: null },
            });
            if (user && patient.userId !== requestingUserId) {
                throw new common_1.ForbiddenException('You can only update your own patient data');
            }
        }
        else if (requestingUserRole === 'provider') {
            if (!patient.assignedProviderIds.includes(requestingUserId)) {
                throw new common_1.ForbiddenException('You can only update patients assigned to you');
            }
        }
        const oldValues = {
            dateOfBirth: patient.dateOfBirth,
            medicalRecordNumber: patient.medicalRecordNumber,
            emergencyContactName: patient.emergencyContactName,
        };
        const data = {};
        if (updateDto.dateOfBirth != null)
            data.dateOfBirth = updateDto.dateOfBirth;
        if (updateDto.medicalRecordNumber != null)
            data.medicalRecordNumber = updateDto.medicalRecordNumber;
        if (updateDto.phone != null)
            data.phone = updateDto.phone;
        if (updateDto.addressStreet != null)
            data.addressStreet = updateDto.addressStreet;
        if (updateDto.addressCity != null)
            data.addressCity = updateDto.addressCity;
        if (updateDto.addressState != null)
            data.addressState = updateDto.addressState;
        if (updateDto.addressZipCode != null)
            data.addressZipCode = updateDto.addressZipCode;
        if (updateDto.emergencyContact != null)
            data.emergencyContactName = updateDto.emergencyContact;
        if (updateDto.emergencyContactName != null)
            data.emergencyContactName = updateDto.emergencyContactName;
        if (updateDto.emergencyContactRelationship != null)
            data.emergencyContactRelationship =
                updateDto.emergencyContactRelationship;
        if (updateDto.emergencyContactPhone != null)
            data.emergencyContactPhone = updateDto.emergencyContactPhone;
        if (updateDto.assignedProviderIds != null)
            data.assignedProviderIds = updateDto.assignedProviderIds;
        await this.prisma.patient.update({
            where: { id: patientId },
            data,
        });
        const updatedPatient = await this.prisma.patient.findFirst({
            where: { id: patientId },
            include: { user: true },
        });
        await this.prisma.patientHistory.create({
            data: {
                patientId: patient.id,
                action: 'update',
                changedBy: requestingUserId,
                oldValues,
                newValues: updatedPatient
                    ? {
                        dateOfBirth: updatedPatient.dateOfBirth,
                        medicalRecordNumber: updatedPatient.medicalRecordNumber,
                        emergencyContactName: updatedPatient.emergencyContactName,
                    }
                    : {},
                ipAddress,
                userAgent,
            },
        });
        return updatedPatient
            ? this.toPatientResponse(updatedPatient)
            : null;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map