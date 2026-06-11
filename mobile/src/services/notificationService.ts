import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  user: string;
  link?: string;
  createdAt?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  };
}

export const notificationService = {
  /**
   * Fetch notifications for the current user
   * Supports pagination
   */
  getNotifications: async (page: number = 1, limit: number = 20): Promise<NotificationResponse> => {
    try {
      const res = await apiFetch(
        `${API_URL}/notifications?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );
      
      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Fetch only unread notifications
   */
  getUnreadNotifications: async (): Promise<NotificationResponse> => {
    try {
      const res = await apiFetch(
        `${API_URL}/notifications?read=false&limit=50`,
        { method: 'GET' }
      );
      
      if (!res.ok) {
        throw new Error(`Failed to fetch unread notifications: ${res.status}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string): Promise<Notification> => {
    try {
      const res = await apiFetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ read: true })
        }
      );
      
      if (!res.ok) {
        throw new Error(`Failed to mark notification as read: ${res.status}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    try {
      const res = await apiFetch(
        `${API_URL}/notifications/mark-all-read`,
        {
          method: 'PUT'
        }
      );
      
      if (!res.ok) {
        throw new Error(`Failed to mark all as read: ${res.status}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<{ message: string }> => {
    try {
      const res = await apiFetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: 'DELETE'
        }
      );
      
      if (!res.ok) {
        throw new Error(`Failed to delete notification: ${res.status}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};
