import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification for a user (e.g. provider_assigned, instruction_assigned).
   */
  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        priority: params.priority ?? 'medium',
        actionUrl: params.actionUrl ?? undefined,
        actionLabel: params.actionLabel ?? undefined,
        metadata: (params.metadata ?? undefined) as object | undefined,
      },
    });
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own notifications',
      );
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId },
      data: { read: true },
    });
    return { success: true };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
    return { success: true };
  }
}
