import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedplumService } from '../medplum/medplum.service';
import { PatientsService } from '../patients/patients.service';
import { AuthService } from '../auth/auth.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { ReportGeneratorService } from '../reports/report-generator.service';
import { redactPHIFromString } from '../common/redact-phi';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD_LENGTH = 16;
const TEMPORARY_PASSWORD_VALID_DAYS = 1;

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
    permissions: ['admin:users', 'admin:roles', 'admin:system', 'admin:audit', 'admin:reports'],
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
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private medplumService: MedplumService,
    private patientsService: PatientsService,
    private authService: AuthService,
    private encryption: EncryptionService,
    private reportGenerator: ReportGeneratorService,
  ) {}

  private getPermissionsForRole(role: string): string[] {
    const def = ROLE_DEFINITIONS.find((r) => r.id === role);
    return def?.permissions ?? [];
  }

  private async getAdminDisplay(adminUserId: string): Promise<{ userEmail: string; userName: string }> {
    const admin = await this.prisma.user.findFirst({
      where: { id: adminUserId, deletedAt: null },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!admin) return { userEmail: '(unknown)', userName: 'Admin' };
    const view = this.encryption.decryptedView(admin, ['email', 'firstName', 'lastName']);
    return {
      userEmail: view.email,
      userName: [view.firstName, view.lastName].filter(Boolean).join(' ') || view.email,
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
    deletedAt?: Date | null;
  }) {
    const view = this.encryption.decryptedView(user, ['email', 'firstName', 'lastName']);
    const deletedAt = user.deletedAt;
    return {
      id: user.id,
      email: view.email,
      firstName: view.firstName,
      lastName: view.lastName,
      role: user.role,
      permissions: this.getPermissionsForRole(user.role),
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      status: deletedAt == null ? 'active' : 'inactive',
      deletedAt: deletedAt?.toISOString() ?? null,
    };
  }

  // ---------- Users ----------
  /**
   * List all users (active and inactive). Inactive users include status: 'inactive' and deletedAt
   * so the UI can show a "Deleted/Inactive" badge and a Restore action.
   */
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        deletedAt: true,
      },
      orderBy: [{ deletedAt: 'asc' }, { createdAt: 'desc' }],
    });
    return users.map((u) => this.toUserResponse(u));
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        deletedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toUserResponse(user);
  }

  /**
   * Get patient record by user ID (admin only). Used for assign-providers UI.
   */
  async getPatientByUserId(userId: string) {
    return this.patientsService.getPatientByUserId(userId, 'administrator');
  }

  async createUser(dto: CreateUserDto, adminUserId: string, ipAddress?: string, userAgent?: string) {
    if (dto.role === 'administrator') {
      throw new BadRequestException('Creating Administrator users is disabled');
    }
    const email = dto.email.toLowerCase().trim();
    const emailHash = this.encryption.hashEmailForLookup(email);
    const existingByHash = emailHash ? await this.prisma.user.findFirst({ where: { emailHash } }) : null;
    const existing = existingByHash ?? (await this.prisma.user.findFirst({ where: { email } }));
    if (existing) {
      if (!existing.deletedAt) {
        throw new ConflictException('A user with this email already exists');
      }
      // Never auto-restore. Admin must manually restore via POST /admin/users/:id/restore.
      // Return code + id so frontend can show "Would you like to restore?" and call restore endpoint.
      throw new ConflictException({
        code: 'USER_INACTIVE',
        message: 'User already exists in inactive state. Would you like to restore this user?',
        inactiveUserId: existing.id,
      });
    }
    // Invitation flow: always generate a temporary password (valid up to 1 day)
    const rawPassword = randomBytes(DEFAULT_PASSWORD_LENGTH).toString('hex');
    const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    const temporaryPasswordExpiresAt = new Date(Date.now() + TEMPORARY_PASSWORD_VALID_DAYS * 24 * 60 * 60 * 1000);

    const createData = {
      emailHash,
      passwordHash,
      role: dto.role,
      mustChangePassword: true,
      temporaryPasswordExpiresAt,
      ...this.encryption.encryptFields({ email, firstName: dto.firstName.trim(), lastName: dto.lastName.trim() }, [
        'email',
        'firstName',
        'lastName',
      ]),
    };

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: createData as never,
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
        const patientEnc = this.encryption.encryptFields(
          {
            dateOfBirth: '1900-01-01',
            medicalRecordNumber: `MRN-${created.id.slice(0, 8).toUpperCase()}`,
          },
          ['dateOfBirth', 'medicalRecordNumber'],
        ) as { dateOfBirth: string; medicalRecordNumber: string };
        await tx.patient.create({
          data: {
            userId: created.id,
            dateOfBirth: patientEnc.dateOfBirth,
            medicalRecordNumber: patientEnc.medicalRecordNumber,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'create',
          resourceType: 'user',
          resourceId: created.id,
          ipAddress: ipAddress ?? '',
          userAgent: userAgent ?? '',
          status: 'success',
          details: { role: created.role },
        },
      });
      return created;
    });

    void this.authService.sendInvitationEmail(email, dto.firstName.trim(), rawPassword).catch(() => {});

    if (dto.role === 'patient' && this.medplumService.isConnected()) {
      this.syncPatientToMedplum({
        id: user.id,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
        this.logger.warn(`Medplum Patient create failed for user ${user.id}: ${msg}`);
      });
    }

    const createUserAddr = redactPHIFromString(email);
    this.logger.log(`Audit log written: create user ${user.id} (${createUserAddr})`);

    return this.toUserResponse(user);
  }

  /**
   * Create or update a minimal FHIR Patient in Medplum for a ClearCare user (patient).
   * Uses identifier https://clearcare.local/user|userId for uniqueness; updates if already present.
   */
  private async syncPatientToMedplum(user: { id: string; firstName: string; lastName: string }): Promise<void> {
    const namePayload = [
      {
        use: 'official',
        family: user.lastName,
        given: [user.firstName].filter(Boolean),
      },
    ];
    const identifierPayload = [
      {
        system: 'https://clearcare.local/user',
        value: user.id,
      },
    ];
    const existing = await this.medplumService.findPatientByClearCareUserId(user.id);
    if (existing) {
      await this.medplumService.updatePatient({
        ...existing,
        name: namePayload,
        identifier: identifierPayload,
      });
      return;
    }
    await this.medplumService.createPatient({
      name: namePayload,
      identifier: identifierPayload,
    });
  }

  async updateUser(id: string, dto: UpdateUserDto, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'administrator' && dto.role && dto.role !== 'administrator') {
      throw new ForbiddenException('Cannot change administrator role');
    }

    const updateData: Record<string, unknown> = {
      ...this.encryption.encryptFields(
        {
          firstName: dto.firstName !== undefined ? dto.firstName.trim() : undefined,
          lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,
          email: dto.email !== undefined ? dto.email.toLowerCase().trim() : undefined,
        },
        ['firstName', 'lastName', 'email'],
      ),
    };
    if (dto.email !== undefined) {
      updateData.emailHash = this.encryption.hashEmailForLookup(dto.email.toLowerCase().trim());
    }
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
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
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'write',
          resourceType: 'user',
          resourceId: id,
          ipAddress: ipAddress ?? '',
          userAgent: userAgent ?? '',
          status: 'success',
          details: { updatedFields: Object.keys(updateData) },
        },
      });
      return u;
    });

    return this.toUserResponse(updated);
  }

  async deleteUser(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'administrator') {
      throw new ForbiddenException('Cannot delete administrator user');
    }

    const deletedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { deletedAt },
      });
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'delete',
          resourceType: 'user',
          resourceId: id,
          ipAddress: ipAddress ?? '',
          userAgent: userAgent ?? '',
          status: 'success',
        },
      });
      const patient = await tx.patient.findFirst({
        where: { userId: id, deletedAt: null },
        select: { id: true },
      });
      if (patient) {
        await tx.patient.update({
          where: { id: patient.id },
          data: { deletedAt },
        });
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'delete',
            resourceType: 'patient',
            resourceId: patient.id,
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            status: 'success',
          },
        });
      }
    });

    const deletedUserAddr = redactPHIFromString(this.encryption.decryptedView(user, ['email']).email);
    this.logger.log(`Audit log written: delete user ${id} (${deletedUserAddr})`);
  }

  /**
   * Restore a soft-deleted user (and linked patient if any).
   * HIPAA: Admin only; audit logged.
   */
  async restoreUser(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        deletedAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.deletedAt) {
      throw new BadRequestException('User is not inactive; nothing to restore');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { deletedAt: null },
      });
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'restore',
          resourceType: 'user',
          resourceId: id,
          ipAddress: ipAddress ?? '',
          userAgent: userAgent ?? '',
          status: 'success',
        },
      });
      const patient = await tx.patient.findFirst({
        where: { userId: id },
        select: { id: true, deletedAt: true },
      });
      if (patient?.deletedAt) {
        await tx.patient.update({
          where: { id: patient.id },
          data: { deletedAt: null },
        });
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'restore',
            resourceType: 'patient',
            resourceId: patient.id,
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            status: 'success',
          },
        });
      }
    });

    const restoredUserAddr = redactPHIFromString(this.encryption.decryptedView(user, ['email']).email);
    this.logger.log(`Audit log written: restore user ${id} (${restoredUserAddr})`);

    const userView = this.encryption.decryptedView(user, ['email', 'firstName']);
    const restoredAddr = redactPHIFromString(userView.email);
    void this.authService
      .sendRestoreNotificationEmail(userView.email, userView.firstName ?? 'User')
      .catch((err: unknown) =>
        this.logger.warn(
          `Restore notification failed for ${restoredAddr}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );

    const restored = await this.prisma.user.findUnique({
      where: { id },
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
    return this.toUserResponse(restored!);
  }

  // ---------- Roles (static) ----------
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
    throw new ForbiddenException('System roles cannot be created; only predefined roles are supported.');
  }

  updateRoleStub() {
    throw new ForbiddenException('System roles cannot be modified.');
  }

  deleteRoleStub() {
    throw new ForbiddenException('System roles cannot be deleted.');
  }

  // ---------- Audit logs ----------
  /** Returns total count of audit log rows (for verifying DB vs UI). */
  async getAuditLogsCount(): Promise<number> {
    return this.prisma.auditLog.count();
  }

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
      if (filters.startDate) (where.timestamp as Record<string, Date>).gte = new Date(filters.startDate);
      if (filters.endDate) (where.timestamp as Record<string, Date>).lte = new Date(filters.endDate);
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
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const resourceUserIds = [
      ...new Set(
        items.filter((l) => l.resourceType === 'user' && l.resourceId != null).map((l) => l.resourceId as string),
      ),
    ];
    const resourceUsers =
      resourceUserIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: resourceUserIds } },
            select: { id: true, email: true },
          })
        : [];
    const resourceNameByUserId = new Map(
      resourceUsers.map((u) => [u.id, this.encryption.decryptedView(u, ['email']).email]),
    );

    return {
      data: items.map((log) => {
        const userView =
          log.user != null ? this.encryption.decryptedView(log.user, ['email', 'firstName', 'lastName']) : null;
        const userEmail = userView != null ? userView.email : '(deleted user)';
        const userName =
          userView != null
            ? `${userView.firstName ?? ''} ${userView.lastName ?? ''}`.trim() || userEmail || log.userId
            : '(deleted user)';
        const resourceName =
          log.resourceType === 'user' && log.resourceId != null
            ? (resourceNameByUserId.get(log.resourceId) ?? null)
            : null;
        return {
          id: log.id,
          userId: log.userId,
          userEmail,
          userName,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          resourceName,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp.toISOString(),
          status: log.status,
          details: log.details as Record<string, unknown> | undefined,
        };
      }),
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

  // ---------- Reports ----------
  async getReports(): Promise<Array<Record<string, unknown>>> {
    const list = await this.prisma.generatedReport.findMany({
      where: { scope: 'admin' },
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

  async getReportById(reportId: string): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.generatedReport.findFirst({
      where: { id: reportId, scope: 'admin' },
    });
    if (!row) return null;
    return row.payload as Record<string, unknown>;
  }

  private async persistReport(
    report: Record<string, unknown>,
    scope: 'admin' | 'provider',
    providerId?: string,
  ): Promise<string> {
    const dateRange = report.dateRange as { start: string; end: string };
    const row = await this.prisma.generatedReport.create({
      data: {
        type: (report.type as string) ?? 'compliance',
        title: (report.title as string) ?? 'Report',
        description: (report.description as string) ?? null,
        generatedBy: (report.generatedBy as string) ?? '',
        dateRangeStart: new Date(dateRange?.start ?? Date.now()),
        dateRangeEnd: new Date(dateRange?.end ?? Date.now()),
        format: (report.format as string) ?? 'json',
        scope,
        providerId: providerId ?? null,
        payload: report as object,
      },
    });
    return row.id;
  }

  async generateReport(
    config: {
      type: string;
      dateRange: { start: string; end: string };
      format: string;
    },
    adminUserId: string,
  ): Promise<Record<string, unknown>> {
    const { type, dateRange, format } = config;
    const startDate = dateRange.start.includes('T') ? dateRange.start : `${dateRange.start}T00:00:00.000Z`;
    const endDate = dateRange.end.includes('T') ? dateRange.end : `${dateRange.end}T23:59:59.999Z`;
    const dateRangeEod = { start: startDate, end: endDate };

    if (type === 'compliance') {
      const report = await this.reportGenerator.generateComplianceReport({
        scope: 'admin',
        dateRange: dateRangeEod,
        format,
        generatedBy: adminUserId,
      });
      const reportObj = report as unknown as Record<string, unknown>;
      reportObj.id = await this.persistReport(reportObj, 'admin');
      return reportObj;
    }

    if (type === 'users') {
      const users = await this.getUsers();
      const data = users.map((u) => ({
        'User ID': u.id,
        Name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
        Email: u.email,
        Role: u.role,
        'Created At': u.createdAt,
        'Last Login': u.lastLoginAt ?? '-',
        Status: u.status ?? 'active',
      }));
      const report = {
        id: `report-${Date.now()}`,
        type: 'users',
        title: 'User Activity Report',
        description: `Generated report for ${dateRange.start} to ${dateRange.end}`,
        generatedAt: new Date().toISOString(),
        generatedBy: adminUserId,
        dateRange,
        data: { rows: data },
        format,
      };
      report.id = await this.persistReport(report, 'admin');
      return report;
    }

    if (type === 'audit') {
      const result = await this.getAuditLogs({
        startDate,
        endDate,
        page: 1,
        limit: 5000,
      });
      const data = (result.data as Array<Record<string, unknown>>).map((log) => ({
        Timestamp: log.timestamp,
        User: log.userName,
        Email: log.userEmail,
        Action: log.action,
        'Resource Type': log.resourceType,
        'Resource Name': log.resourceName ?? '-',
        'IP Address': log.ipAddress,
        Status: log.status,
        Details: log.details ? JSON.stringify(log.details) : '-',
      }));
      const report = {
        id: `report-${Date.now()}`,
        type: 'audit',
        title: 'Audit Report',
        description: `Generated report for ${dateRange.start} to ${dateRange.end}`,
        generatedAt: new Date().toISOString(),
        generatedBy: adminUserId,
        dateRange,
        data: { rows: data },
        format,
      };
      report.id = await this.persistReport(report, 'admin');
      return report;
    }

    if (type === 'system') {
      const [userCount, auditResult] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.getAuditLogs({
          startDate,
          endDate,
          page: 1,
          limit: 10000,
        }),
      ]);
      const logs = auditResult.data as Array<{ status?: string }>;
      const successCount = logs.filter((l) => l.status === 'success').length;
      const failureCount = logs.filter((l) => l.status === 'failure').length;
      const report = {
        id: `report-${Date.now()}`,
        type: 'system',
        title: 'System Report',
        description: `Generated report for ${dateRange.start} to ${dateRange.end}`,
        generatedAt: new Date().toISOString(),
        generatedBy: adminUserId,
        dateRange,
        data: {
          totalUsers: userCount,
          totalAuditLogs: auditResult.total,
          successfulActions: successCount,
          failedActions: failureCount,
          dateRange: `${dateRange.start} to ${dateRange.end}`,
        },
        format,
      };
      report.id = await this.persistReport(report, 'admin');
      return report;
    }

    const report = {
      id: `report-${Date.now()}`,
      type,
      title: `${type} Report`,
      description: `Generated report for ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      generatedBy: adminUserId,
      dateRange,
      data: {},
      format,
    };
    report.id = await this.persistReport(report, 'admin');
    return report;
  }
}
