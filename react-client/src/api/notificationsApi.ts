import { get, post } from './client';
import { Notification } from '../types';

// Get all notifications for current user
export const getNotifications = async (
  limit: number = 20,
  skip: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  const query = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    unread_only: unreadOnly.toString()
  });
  
  return get<Notification[]>(`/notifications?${query}`);
};

// Mark notification as read
export const markNotificationAsRead = async (id: number): Promise<Notification> => {
  // Using POST instead of PATCH since patch is not available
  return post<Notification>(`/notifications/${id}/read`, {});
};