/**
 * Notification service
 * Handles notification-related API calls
 */

import { apiEndpoints } from './apiEndpoints';
import type { Notification } from '../types/notification.types';

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const response = await apiEndpoints.notifications.getNotifications();
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch notifications');
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (userId: string, notificationId: string): Promise<void> => {
    try {
      await apiEndpoints.notifications.markAsRead(notificationId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      await apiEndpoints.notifications.markAllAsRead();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (userId: string, notificationId: string): Promise<void> => {
    try {
      await apiEndpoints.notifications.deleteNotification(notificationId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete notification');
    }
  },
};
