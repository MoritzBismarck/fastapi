// react-client/src/pages/EventChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Event, User } from '../types';
import { get, post } from '../api/client';
import { getStoredToken } from '../utils/tokenStorage';

interface ChatMessage {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  sent_at: string;
}

interface EventWithParticipants extends Event {
  match_participants: User[];
  creator?: User;
}

const EventChat: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<EventWithParticipants | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = useRef<number | null>(null);
  
  // Get current user ID from token
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId.current = payload.user_id;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Fetch event and chat data
  useEffect(() => {
    if (!eventId) return;
    
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch event details with participants
        const eventData = await get<EventWithParticipants>(`/events/${eventId}/chat-info`);
        setEvent(eventData);
        
        // Fetch existing messages
        const messagesData = await get<ChatMessage[]>(`/events/${eventId}/messages`);
        setMessages(messagesData);
        
      } catch (err) {
        console.error('Error fetching event chat data:', err);
        setError('Failed to load event chat. You may not have access to this event.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Refresh messages function
  const refreshMessages = async () => {
    if (!eventId) return;
    
    try {
      setIsRefreshing(true);
      const messagesData = await get<ChatMessage[]>(`/events/${eventId}/messages`);
      setMessages(messagesData);
    } catch (err) {
      console.error('Error refreshing messages:', err);
      setError('Failed to refresh messages.');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Send the message to backend
      const response = await post(`/events/${eventId}/messages`, {
        content: newMessage.trim()
      });

      // Type assertion for response
      const typedResponse = response as ChatMessage;
      
      // Clear input
      setNewMessage('');
      
      // Immediately add the message to local state using the new backend response format
      const sentMessage: ChatMessage = {
        id: typedResponse.id,
        content: typedResponse.content,
        sent_at: typedResponse.sent_at,
        sender: typedResponse.sender
      };
      
      setMessages(prev => [...prev, sentMessage]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Format date for display
  const formatEventDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    if (timeString) {
      return `${dateStr} at ${timeString}`;
    }
    
    return dateStr;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="mb-4">{error || 'Event not found'}</p>
            <button 
              onClick={() => navigate('/events')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        {/* Event Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          {/* Back to Matches Button and Refresh */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/events/matches')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span className="text-2xl">←</span>
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={refreshMessages}
                disabled={isRefreshing}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
              >
                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh</span>
              </button>
              {/* <span className="text-sm text-gray-500">
                {event.match_participants?.length || 0} participants
              </span> */}
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            {/* Event Cover Photo */}
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {event.cover_photo_url ? (
                <img 
                  src={event.cover_photo_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  📅
                </div>
              )}
            </div>
            
            {/* Event Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold mb-1">{event.title}</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📍 {event.location}</p>
                <p>🗓 {formatEventDate(event.start_date, event.start_time)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 bg-white overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-2">🎉 Welcome to the event chat!</p>
                  <p className="text-sm">Start the conversation about "{event.title}"</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={`message-${message.id}-${message.sent_at}`} className="flex items-start space-x-3">
                    {/* Profile Picture */}
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      {message.sender.profile_picture ? (
                        <img 
                          src={message.sender.profile_picture} 
                          alt={message.sender.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {message.sender.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{message.sender.username}</span>
                        <span className="text-xs text-gray-500">{formatTime(message.sent_at)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventChat;