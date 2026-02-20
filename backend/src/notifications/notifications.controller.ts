import { Controller, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

/**
 * Notifications API for the current user (patient, provider, admin).
 * GET /api/v1/notifications, PUT :id/read, PUT read-all, DELETE :id
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getNotifications(userId);
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.deleteNotification(id, userId);
  }
}
