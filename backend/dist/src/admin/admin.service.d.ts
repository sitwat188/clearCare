import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
declare const DEFAULT_SYSTEM_SETTINGS: {
    sessionTimeout: number;
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        expirationDays: number;
    };
    notificationSettings: {
        emailEnabled: boolean;
        smsEnabled: boolean;
        defaultNotificationTypes: string[];
    };
    dataRetention: {
        auditLogsDays: number;
        complianceRecordsDays: number;
        archivedInstructionsDays: number;
    };
    featureFlags: Record<string, boolean>;
};
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    private getPermissionsForRole;
    private getAdminDisplay;
    private toUserResponse;
    getUsers(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        createdAt: string;
        lastLoginAt: string | null;
    }[]>;
    getUser(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        createdAt: string;
        lastLoginAt: string | null;
    }>;
    createUser(dto: CreateUserDto, adminUserId: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        createdAt: string;
        lastLoginAt: string | null;
    }>;
    updateUser(id: string, dto: UpdateUserDto, adminUserId: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        createdAt: string;
        lastLoginAt: string | null;
    }>;
    deleteUser(id: string, adminUserId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    getRoles(): Promise<{
        userCount: number;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        permissions: string[];
        isSystemRole: boolean;
    }[]>;
    getRole(id: string): Promise<{
        userCount: number;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        permissions: string[];
        isSystemRole: boolean;
    }>;
    createRoleStub(): void;
    updateRoleStub(): void;
    deleteRoleStub(): void;
    getAuditLogs(filters: {
        userId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            userId: string;
            userEmail: string;
            userName: string;
            action: string;
            resourceType: string;
            resourceId: string | null;
            resourceName: string | null;
            ipAddress: string;
            userAgent: string;
            timestamp: string;
            status: string;
            details: Record<string, unknown> | undefined;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    private systemSettings;
    getSystemSettings(): {
        sessionTimeout: number;
        passwordPolicy: {
            minLength: number;
            requireUppercase: boolean;
            requireLowercase: boolean;
            requireNumbers: boolean;
            requireSpecialChars: boolean;
            expirationDays: number;
        };
        notificationSettings: {
            emailEnabled: boolean;
            smsEnabled: boolean;
            defaultNotificationTypes: string[];
        };
        dataRetention: {
            auditLogsDays: number;
            complianceRecordsDays: number;
            archivedInstructionsDays: number;
        };
        featureFlags: Record<string, boolean>;
    };
    updateSystemSettings(updates: Partial<typeof DEFAULT_SYSTEM_SETTINGS>): {
        sessionTimeout: number;
        passwordPolicy: {
            minLength: number;
            requireUppercase: boolean;
            requireLowercase: boolean;
            requireNumbers: boolean;
            requireSpecialChars: boolean;
            expirationDays: number;
        };
        notificationSettings: {
            emailEnabled: boolean;
            smsEnabled: boolean;
            defaultNotificationTypes: string[];
        };
        dataRetention: {
            auditLogsDays: number;
            complianceRecordsDays: number;
            archivedInstructionsDays: number;
        };
        featureFlags: Record<string, boolean>;
    };
    getReports(): Promise<never[]>;
    generateReport(config: {
        type: string;
        dateRange: {
            start: string;
            end: string;
        };
        format: string;
    }, adminUserId: string): Promise<{
        id: string;
        type: "compliance" | "users" | "audit" | "system";
        title: string;
        description: string;
        generatedAt: string;
        generatedBy: string;
        dateRange: {
            start: string;
            end: string;
        };
        data: {};
        format: "pdf" | "csv" | "json";
    }>;
}
export {};
