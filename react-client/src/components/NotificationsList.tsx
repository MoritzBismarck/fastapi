import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';

const NotificationsList: React.FC = () => {
  const { notifications, unreadCount, isLoading, error, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // If today, just show time
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Extract event ID from notification content if present
  const extractEventId = (content: string): number | null => {
    // This regex looks for patterns like "event 'ABC' (123)" or similar and extracts the ID
    const match = content.match(/event.*?\((\d+)\)/i);
    return match ? parseInt(match[1], 10) : null;
  };
  
  // Handle click on notification
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Extract event ID if present in the notification content
    const eventId = extractEventId(notification.content);
    
    // Navigate to the event if ID was found
    if (eventId) {
      navigate(`/events/${eventId}`);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  if (isLoading && notifications.length === 0) {
    return <div className="p-3 text-center text-gray-500">Loading notifications...</div>;
  }
  
  if (error) {
    return <div className="p-3 text-center text-red-500">{error}</div>;
  }
  
  if (notifications.length === 0) {
    return <div className="p-3 text-center text-gray-500">No notifications yet.</div>;
  }
  
  // Determine how many notifications to show
  const displayNotifications = expanded ? notifications : notifications.slice(0, 5);
  
  return (
    <div className="w-full border border-black p-1 bg-[#c0c0c0]">
      <div className="font-bold mb-2 uppercase tracking-wide bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
        <span>Notifications {unreadCount > 0 && `(${unreadCount} new)`}</span>
        {notifications.length > 5 && (
          <button 
            onClick={toggleExpanded}
            className="text-white hover:underline text-xs"
          >
            {expanded ? "Show Less" : "Show All"}
          </button>
        )}
      </div>
      
      <ul className={expanded ? "max-h-96 overflow-y-auto" : "max-h-60 overflow-y-auto"}>
        {displayNotifications.map(notification => (
          <li 
            key={notification.id}
            className={`border-b border-gray-300 last:border-b-0 cursor-pointer hover:bg-gray-200 ${!notification.is_read ? 'bg-[#ffffcc]' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="p-2">
              <div className="text-sm">{notification.content}</div>
              <div className="text-xs text-gray-600 mt-1 font-mono">
                {formatDate(notification.created_at)}
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {!expanded && notifications.length > 5 && (
        <div className="text-center p-1 border-t border-gray-300">
          <button 
            className="text-blue-700 underline text-sm hover:text-blue-900"
            onClick={toggleExpanded}
          >
            See all notifications ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;