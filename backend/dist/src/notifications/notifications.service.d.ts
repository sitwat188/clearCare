import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        priority: string;
        actionUrl: string | null;
        actionLabel: string | null;
        message: string;
        read: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    markAsRead(notificationId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        priority: string;
        actionUrl: string | null;
        actionLabel: string | null;
        message: string;
        read: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    deleteNotification(notificationId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
