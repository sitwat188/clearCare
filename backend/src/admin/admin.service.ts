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
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private medplumService: MedplumService,
    private patientsService: PatientsService,
    private authService: AuthService,
    private encryption: EncryptionService,
  ) {}

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
    deletedAt?: Date | null;
  }) {
    const deletedAt = user.deletedAt;
    return {
      id: user.id,
      email: this.encryption.decrypt(user.email),
      firstName: this.encryption.decrypt(user.firstName),
      lastName: this.encryption.decrypt(user.lastName),
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
    const emailHash = this.encryption.hashEmailForLookup(email);
    const existingByHash = emailHash
      ? await this.prisma.user.findFirst({ where: { emailHash } })
      : null;
    const existing =
      existingByHash ??
      (await this.prisma.user.findFirst({ where: { email } }));
    if (existing) {
      if (!existing.deletedAt) {
        throw new ConflictException('A user with this email already exists');
      }
      // Never auto-restore. Admin must manually restore via POST /admin/users/:id/restore.
      // Return code + id so frontend can show "Would you like to restore?" and call restore endpoint.
      throw new ConflictException({
        code: 'USER_INACTIVE',
        message:
          'User already exists in inactive state. Would you like to restore this user?',
        inactiveUserId: existing.id,
      });
    }
    // Invitation flow: always generate a temporary password (valid up to 1 day)
    const rawPassword = randomBytes(DEFAULT_PASSWORD_LENGTH).toString('hex');
    const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    const temporaryPasswordExpiresAt = new Date(
      Date.now() + TEMPORARY_PASSWORD_VALID_DAYS * 24 * 60 * 60 * 1000,
    );

    const createData = {
      emailHash,
      email: this.encryption.encrypt(email),
      passwordHash,
      firstName: this.encryption.encrypt(dto.firstName.trim()),
      lastName: this.encryption.encrypt(dto.lastName.trim()),
      role: dto.role,
      mustChangePassword: true,
      temporaryPasswordExpiresAt,
    };
    const user = await this.prisma.user.create({
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

    void this.authService
      .sendInvitationEmail(email, dto.firstName.trim(), rawPassword)
      .catch(() => {});

    if (dto.role === 'patient') {
      await this.prisma.patient.create({
        data: {
          userId: user.id,
          dateOfBirth: this.encryption.encrypt('1900-01-01'),
          medicalRecordNumber: this.encryption.encrypt(
            `MRN-${user.id.slice(0, 8).toUpperCase()}`,
          ),
        },
      });
      // Sync to Medplum FHIR when configured (non-blocking; failures are logged only)
      if (this.medplumService.isConnected()) {
        this.syncPatientToMedplum({
          id: user.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
        }).catch((err) => {
          this.logger.warn(
            `Medplum Patient create failed for user ${user.id}: ${err?.message ?? err}`,
          );
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'create',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: ipAddress ?? '',
        userAgent: userAgent ?? '',
        status: 'success',
        details: { role: user.role },
      },
    });
    const createUserAddr = redactPHIFromString(email);
    this.logger.log(`Audit log written: create user ${user.id} (${createUserAddr})`);

    return this.toUserResponse(user);
  }

  /**
   * Create or update a minimal FHIR Patient in Medplum for a ClearCare user (patient).
   * Uses identifier https://clearcare.local/user|userId for uniqueness; updates if already present.
   */
  private async syncPatientToMedplum(user: {
    id: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
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
    const existing = await this.medplumService.findPatientByClearCareUserId(
      user.id,
    );
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
      updateData.firstName = this.encryption.encrypt(dto.firstName.trim());
    if (dto.lastName !== undefined)
      updateData.lastName = this.encryption.encrypt(dto.lastName.trim());
    if (dto.email !== undefined) {
      const normalized = dto.email.toLowerCase().trim();
      updateData.emailHash = this.encryption.hashEmailForLookup(normalized);
      updateData.email = this.encryption.encrypt(normalized);
    }
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

    await this.prisma.auditLog.create({
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

    const deletedAt = new Date();
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt },
    });

    await this.prisma.auditLog.create({
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
    const deletedUserAddr = redactPHIFromString(
      this.encryption.decrypt(user.email),
    );
    this.logger.log(`Audit log written: delete user ${id} (${deletedUserAddr})`);

    // HIPAA: Soft-delete linked Patient so PHI is excluded from all reads
    const patient = await this.prisma.patient.findFirst({
      where: { userId: id, deletedAt: null },
      select: { id: true },
    });
    if (patient) {
      await this.prisma.patient.update({
        where: { id: patient.id },
        data: { deletedAt },
      });
      await this.prisma.auditLog.create({
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
      this.logger.log(
        `Audit log written: cascade soft-delete patient ${patient.id} (user ${id})`,
      );
    }
  }

  /**
   * Restore a soft-deleted user (and linked patient if any).
   * HIPAA: Admin only; audit logged.
   */
  async restoreUser(
    id: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
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

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });

    await this.prisma.auditLog.create({
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
    const restoredUserAddr = redactPHIFromString(
      this.encryption.decrypt(user.email),
    );
    this.logger.log(
      `Audit log written: restore user ${id} (${restoredUserAddr})`,
    );

    const patient = await this.prisma.patient.findFirst({
      where: { userId: id },
      select: { id: true, deletedAt: true },
    });
    if (patient?.deletedAt) {
      await this.prisma.patient.update({
        where: { id: patient.id },
        data: { deletedAt: null },
      });
      await this.prisma.auditLog.create({
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
      this.logger.log(
        `Audit log written: restore patient ${patient.id} (user ${id})`,
      );
    }

    const decryptedEmail = this.encryption.decrypt(user.email);
    const decryptedFirstName =
      this.encryption.decrypt(user.firstName) ?? 'User';
    const restoredAddr = redactPHIFromString(decryptedEmail);
    void this.authService
      .sendRestoreNotificationEmail(decryptedEmail, decryptedFirstName)
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
        items
          .filter((l) => l.resourceType === 'user' && l.resourceId != null)
          .map((l) => l.resourceId as string),
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
      resourceUsers.map((u) => [u.id, this.encryption.decrypt(u.email)]),
    );

    return {
      data: items.map((log) => {
        const userEmail =
          log.user != null
            ? this.encryption.decrypt(log.user.email)
            : '(deleted user)';
        const userName =
          log.user != null
            ? `${this.encryption.decrypt(log.user.firstName) ?? ''} ${this.encryption.decrypt(log.user.lastName) ?? ''}`.trim() ||
              userEmail ||
              log.userId
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
