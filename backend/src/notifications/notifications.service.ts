import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  /**
   * Create a notification for a user (e.g. provider_assigned, instruction_assigned).
   * Title and message are encrypted at rest (may contain PHI).
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
        title: this.encryption.encrypt(params.title),
        message: this.encryption.encrypt(params.message),
        priority: params.priority ?? 'medium',
        actionUrl: params.actionUrl ?? undefined,
        actionLabel: params.actionLabel ?? undefined,
        metadata: (params.metadata ?? undefined) as object | undefined,
      },
    });
  }

  /**
   * Get all notifications for the current user (title and message decrypted).
   */
  async getNotifications(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((n) => ({
      ...n,
      title: this.encryption.decrypt(n.title),
      message: this.encryption.decrypt(n.message),
    }));
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
      throw new ForbiddenException('You can only update your own notifications');
    }
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return {
      ...updated,
      title: this.encryption.decrypt(updated.title),
      message: this.encryption.decrypt(updated.message),
    };
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
      throw new ForbiddenException('You can only delete your own notifications');
    }
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
    return { success: true };
  }
}
