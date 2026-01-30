import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
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
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    markAsRead(id: string, userId: string): Promise<{
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
    deleteNotification(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
