import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    createUser(dto: CreateUserDto, adminUserId: string, req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        createdAt: string;
        lastLoginAt: string | null;
    }>;
    updateUser(id: string, dto: UpdateUserDto, adminUserId: string, req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        createdAt: string;
        lastLoginAt: string | null;
    }>;
    deleteUser(id: string, adminUserId: string, req: any): Promise<void>;
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
    createRole(): void;
    updateRole(): void;
    deleteRole(): void;
    getAuditLogs(userId?: string, action?: string, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<{
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
    getSystemSettings(): Promise<{
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
    }>;
    updateSystemSettings(updates: Record<string, unknown>): Promise<{
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
    }>;
    getReports(): Promise<never[]>;
    generateReport(reportConfig: {
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
