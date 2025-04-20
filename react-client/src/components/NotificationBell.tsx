import React, { useState, useEffect, useRef } from 'react';

interface Notification {
  id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // If it's today, just show the time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's within the last week, show the day and time
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    if (date > lastWeek) {
      return date.toLocaleDateString(undefined, { weekday: 'short' }) + 
              ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, show the full date
    return date.toLocaleDateString();
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to load notifications');
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_id: id
        })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  // Toggle notification panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Handle click outside to close the panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        notificationPanelRef.current && 
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="relative">
      <button 
        className="text-blue-700 hover:text-blue-900 underline"
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="text-red-500 font-bold ml-1">({unreadCount})</span>
        )}
      </button>
      
      {isOpen && (
        <div 
          ref={notificationPanelRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200"
        >
          <div className="p-3 bg-gray-100 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet.
              </div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li 
                    key={notification.id}
                    className={`border-b border-gray-100 last:border-b-0 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="p-3 w-full text-left hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="text-sm">{notification.content}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.created_at)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;