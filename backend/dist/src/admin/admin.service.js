"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD_LENGTH = 16;
const ROLE_DEFINITIONS = [
    {
        id: 'patient',
        name: 'Patient',
        description: 'Can view own instructions, compliance, and profile',
        permissions: [
            'read:own-instructions',
            'write:own-acknowledgment',
            'read:own-compliance',
            'read:own-profile',
            'write:own-profile',
        ],
        isSystemRole: true,
    },
    {
        id: 'provider',
        name: 'Provider',
        description: 'Can manage patients, instructions, and compliance',
        permissions: [
            'read:patients',
            'read:instructions',
            'write:instructions',
            'read:compliance',
            'read:reports',
            'write:templates',
        ],
        isSystemRole: true,
    },
    {
        id: 'administrator',
        name: 'Administrator',
        description: 'Full system administration',
        permissions: [
            'admin:users',
            'admin:roles',
            'admin:system',
            'admin:audit',
            'admin:reports',
        ],
        isSystemRole: true,
    },
];
const DEFAULT_SYSTEM_SETTINGS = {
    sessionTimeout: 30,
    passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
    },
    notificationSettings: {
        emailEnabled: true,
        smsEnabled: false,
        defaultNotificationTypes: ['instruction_assigned', 'compliance_reminder'],
    },
    dataRetention: {
        auditLogsDays: 2555,
        complianceRecordsDays: 2555,
        archivedInstructionsDays: 2555,
    },
    featureFlags: {},
};
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPermissionsForRole(role) {
        const def = ROLE_DEFINITIONS.find((r) => r.id === role);
        return def?.permissions ?? [];
    }
    async getAdminDisplay(adminUserId) {
        const admin = await this.prisma.user.findFirst({
            where: { id: adminUserId, deletedAt: null },
            select: { email: true, firstName: true, lastName: true },
        });
        if (!admin)
            return { userEmail: '(unknown)', userName: 'Admin' };
        return {
            userEmail: admin.email,
            userName: [admin.firstName, admin.lastName].filter(Boolean).join(' ') ||
                admin.email,
        };
    }
    toUserResponse(user) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions: this.getPermissionsForRole(user.role),
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        };
    }
    async getUsers() {
        const users = await this.prisma.user.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users.map((u) => this.toUserResponse(u));
    }
    async getUser(id) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.toUserResponse(user);
    }
    async createUser(dto, adminUserId, ipAddress, userAgent) {
        if (dto.role === 'administrator') {
            throw new common_1.BadRequestException('Creating Administrator users is disabled');
        }
        const email = dto.email.toLowerCase().trim();
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing && !existing.deletedAt) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const rawPassword = dto.password ?? (0, crypto_1.randomBytes)(DEFAULT_PASSWORD_LENGTH).toString('hex');
        const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                role: dto.role,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        if (dto.role === 'patient') {
            await this.prisma.patient.create({
                data: {
                    userId: user.id,
                    dateOfBirth: '1900-01-01',
                    medicalRecordNumber: `MRN-${user.id.slice(0, 8).toUpperCase()}`,
                    assignedProviderIds: [],
                },
            });
        }
        const adminDisplay = await this.getAdminDisplay(adminUserId);
        await this.prisma.auditLog.create({
            data: {
                userId: adminUserId,
                userEmail: adminDisplay.userEmail,
                userName: adminDisplay.userName,
                action: 'create',
                resourceType: 'user',
                resourceId: user.id,
                resourceName: user.email,
                ipAddress: ipAddress ?? '',
                userAgent: userAgent ?? '',
                status: 'success',
                details: { role: user.role },
            },
        });
        return this.toUserResponse(user);
    }
    async updateUser(id, dto, adminUserId, ipAddress, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === 'administrator' &&
            dto.role &&
            dto.role !== 'administrator') {
            throw new common_1.ForbiddenException('Cannot change administrator role');
        }
        const updateData = {};
        if (dto.firstName !== undefined)
            updateData.firstName = dto.firstName.trim();
        if (dto.lastName !== undefined)
            updateData.lastName = dto.lastName.trim();
        if (dto.email !== undefined)
            updateData.email = dto.email.toLowerCase().trim();
        if (dto.role !== undefined)
            updateData.role = dto.role;
        if (dto.password !== undefined) {
            updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        const adminDisplay = await this.getAdminDisplay(adminUserId);
        await this.prisma.auditLog.create({
            data: {
                userId: adminUserId,
                userEmail: adminDisplay.userEmail,
                userName: adminDisplay.userName,
                action: 'write',
                resourceType: 'user',
                resourceId: id,
                resourceName: updated.email,
                ipAddress: ipAddress ?? '',
                userAgent: userAgent ?? '',
                status: 'success',
                details: { updatedFields: Object.keys(updateData) },
            },
        });
        return this.toUserResponse(updated);
    }
    async deleteUser(id, adminUserId, ipAddress, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === 'administrator') {
            throw new common_1.ForbiddenException('Cannot delete administrator user');
        }
        await this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        const adminDisplay = await this.getAdminDisplay(adminUserId);
        await this.prisma.auditLog.create({
            data: {
                userId: adminUserId,
                userEmail: adminDisplay.userEmail,
                userName: adminDisplay.userName,
                action: 'delete',
                resourceType: 'user',
                resourceId: id,
                resourceName: user.email,
                ipAddress: ipAddress ?? '',
                userAgent: userAgent ?? '',
                status: 'success',
            },
        });
    }
    async getRoles() {
        const userCounts = await this.prisma.user.groupBy({
            by: ['role'],
            where: { deletedAt: null },
            _count: { id: true },
        });
        const countByRole = Object.fromEntries(userCounts.map((r) => [r.role, r._count.id]));
        return ROLE_DEFINITIONS.map((r) => ({
            ...r,
            userCount: countByRole[r.id] ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));
    }
    async getRole(id) {
        const def = ROLE_DEFINITIONS.find((r) => r.id === id);
        if (!def)
            throw new common_1.NotFoundException('Role not found');
        const count = await this.prisma.user.count({
            where: { role: id, deletedAt: null },
        });
        return {
            ...def,
            userCount: count,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    createRoleStub() {
        throw new common_1.ForbiddenException('System roles cannot be created; only predefined roles are supported.');
    }
    updateRoleStub() {
        throw new common_1.ForbiddenException('System roles cannot be modified.');
    }
    deleteRoleStub() {
        throw new common_1.ForbiddenException('System roles cannot be deleted.');
    }
    async getAuditLogs(filters) {
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action)
            where.action = filters.action;
        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate)
                where.timestamp.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.timestamp.lte = new Date(filters.endDate);
        }
        const page = Math.max(1, filters.page ?? 1);
        const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            data: items.map((log) => ({
                id: log.id,
                userId: log.userId,
                userEmail: log.userEmail,
                userName: log.userName,
                action: log.action,
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                resourceName: log.resourceName,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                timestamp: log.timestamp.toISOString(),
                status: log.status,
                details: log.details,
            })),
            total,
            page,
            limit,
        };
    }
    systemSettings = { ...DEFAULT_SYSTEM_SETTINGS };
    getSystemSettings() {
        return this.systemSettings;
    }
    updateSystemSettings(updates) {
        this.systemSettings = {
            ...this.systemSettings,
            ...updates,
            passwordPolicy: {
                ...this.systemSettings.passwordPolicy,
                ...(updates.passwordPolicy ?? {}),
            },
            notificationSettings: {
                ...this.systemSettings.notificationSettings,
                ...(updates.notificationSettings ?? {}),
            },
            dataRetention: {
                ...this.systemSettings.dataRetention,
                ...(updates.dataRetention ?? {}),
            },
            featureFlags: {
                ...this.systemSettings.featureFlags,
                ...(updates.featureFlags ?? {}),
            },
        };
        return this.systemSettings;
    }
    async getReports() {
        return [];
    }
    async generateReport(config, adminUserId) {
        const report = {
            id: `report-${Date.now()}`,
            type: config.type,
            title: `${config.type} Report`,
            description: `Generated report for ${config.dateRange.start} to ${config.dateRange.end}`,
            generatedAt: new Date().toISOString(),
            generatedBy: adminUserId,
            dateRange: config.dateRange,
            data: {},
            format: config.format,
        };
        return report;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map