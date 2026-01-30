import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD_LENGTH = 16;

// Static role definitions (no Role table in schema)
const ROLE_DEFINITIONS: Array<{
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
}> = [
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
  featureFlags: {} as Record<string, boolean>,
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private getPermissionsForRole(role: string): string[] {
    const def = ROLE_DEFINITIONS.find((r) => r.id === role);
    return def?.permissions ?? [];
  }

  private async getAdminDisplay(
    adminUserId: string,
  ): Promise<{ userEmail: string; userName: string }> {
    const admin = await this.prisma.user.findFirst({
      where: { id: adminUserId, deletedAt: null },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!admin) return { userEmail: '(unknown)', userName: 'Admin' };
    return {
      userEmail: admin.email,
      userName:
        [admin.firstName, admin.lastName].filter(Boolean).join(' ') ||
        admin.email,
    };
  }

  private toUserResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  }) {
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

  // ---------- Users ----------
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

  async getUser(id: string) {
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
    if (!user) throw new NotFoundException('User not found');
    return this.toUserResponse(user);
  }

  async createUser(
    dto: CreateUserDto,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (dto.role === 'administrator') {
      throw new BadRequestException('Creating Administrator users is disabled');
    }
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('A user with this email already exists');
    }
    const rawPassword =
      dto.password ?? randomBytes(DEFAULT_PASSWORD_LENGTH).toString('hex');
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

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (
      user.role === 'administrator' &&
      dto.role &&
      dto.role !== 'administrator'
    ) {
      throw new ForbiddenException('Cannot change administrator role');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.firstName !== undefined)
      updateData.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName.trim();
    if (dto.email !== undefined)
      updateData.email = dto.email.toLowerCase().trim();
    if (dto.role !== undefined) updateData.role = dto.role;
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

  async deleteUser(
    id: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'administrator') {
      throw new ForbiddenException('Cannot delete administrator user');
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

  // ---------- Roles (static) ----------
  async getRoles() {
    const userCounts = await this.prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: { id: true },
    });
    const countByRole = Object.fromEntries(
      userCounts.map((r) => [r.role, r._count.id]),
    );

    return ROLE_DEFINITIONS.map((r) => ({
      ...r,
      userCount: countByRole[r.id] ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  async getRole(id: string) {
    const def = ROLE_DEFINITIONS.find((r) => r.id === id);
    if (!def) throw new NotFoundException('Role not found');
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
    throw new ForbiddenException(
      'System roles cannot be created; only predefined roles are supported.',
    );
  }

  updateRoleStub() {
    throw new ForbiddenException('System roles cannot be modified.');
  }

  deleteRoleStub() {
    throw new ForbiddenException('System roles cannot be deleted.');
  }

  // ---------- Audit logs ----------
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate)
        (where.timestamp as Record<string, Date>).gte = new Date(
          filters.startDate,
        );
      if (filters.endDate)
        (where.timestamp as Record<string, Date>).lte = new Date(
          filters.endDate,
        );
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
        details: log.details as Record<string, unknown> | undefined,
      })),
      total,
      page,
      limit,
    };
  }

  // ---------- Settings (in-memory defaults; no DB table) ----------
  private systemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

  getSystemSettings() {
    return this.systemSettings;
  }

  updateSystemSettings(updates: Partial<typeof DEFAULT_SYSTEM_SETTINGS>) {
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

  // ---------- Reports (stub) ----------
  async getReports() {
    return [];
  }

  async generateReport(
    config: {
      type: string;
      dateRange: { start: string; end: string };
      format: string;
    },
    adminUserId: string,
  ) {
    const report = {
      id: `report-${Date.now()}`,
      type: config.type as 'compliance' | 'users' | 'audit' | 'system',
      title: `${config.type} Report`,
      description: `Generated report for ${config.dateRange.start} to ${config.dateRange.end}`,
      generatedAt: new Date().toISOString(),
      generatedBy: adminUserId,
      dateRange: config.dateRange,
      data: {},
      format: config.format as 'pdf' | 'csv' | 'json',
    };
    return report;
  }
}
