import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types';
import { getNotifications, markNotificationAsRead } from '../api/notificationsApi';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Load notifications initially
  useEffect(() => {
    fetchNotifications();
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};