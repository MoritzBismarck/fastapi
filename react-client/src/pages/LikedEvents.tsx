import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import EventsHeader from '../components/EventsHeader';
import FriendsLikedButton from '../components/FriendsLikedButton';
import { Event } from '../types';
import { getLikedEvents, unlikeEvent } from '../api/eventsApi';

interface CreatorInfo {
  id: number;
  username: string;
  profile_picture?: string;
}

interface EventWithCreator extends Event {
  creator?: CreatorInfo;
}

const LikedEvents: React.FC = () => {
  const [events, setEvents] = useState<EventWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  const navigate = useNavigate();
  
  // Fetch liked events
  const fetchLikedEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const data = await getLikedEvents();
      
      // Sort by start_date chronologically (most recent first)
      data.sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      
      setEvents(data);
    } catch (error) {
      console.error('Error fetching liked events:', error);
      setErrorMessage('An error occurred while loading liked events');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle unliking an event
  const handleUnlikeEvent = async (eventId: number) => {
    try {
      await unlikeEvent(eventId);
      
      // Remove the event from the list
      setEvents(events.filter(event => event.id !== eventId));
      setSelectedEventId(null); // Close event card if it's open
    } catch (error) {
      console.error('Error unliking event:', error);
      setErrorMessage('An error occurred while unliking the event');
    }
  };
  
  // Fetch liked events on mount
  useEffect(() => {
    fetchLikedEvents();
  }, []);

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return timeString ? `${formatted} • ${timeString}` : formatted;
  };

  const handleEventClick = (eventId: number) => {
    setSelectedEventId(eventId);
  };

  const closeEventCard = () => {
    setSelectedEventId(null);
  };

  const selectedEvent = events.find(event => event.id === selectedEventId);

  if (isLoading) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <EventsHeader />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading liked events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <EventsHeader />
        <div className="border border-gray-300 rounded p-6 text-center">
          <p className="mb-4">You haven't liked any events yet.</p>
          <button 
            onClick={() => navigate('/events')}
            className="border border-gray-500 bg-gray-200 px-4 py-2 rounded inline-block hover:bg-gray-300"
          >
            Discover Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      <EventsHeader />
      
      {errorMessage && (
        <div className="border border-red-500 p-4 mb-6 text-red-700 bg-red-100 rounded">
          {errorMessage}
        </div>
      )}

      {/* Event List */}
      <div className="border border-gray-300 rounded overflow-hidden bg-white">
        {events.map((event, index) => (
          <div 
            key={event.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              index !== events.length - 1 ? 'border-b border-gray-200' : ''
            }`}
            onClick={() => handleEventClick(event.id)}
          >
            <div className="flex items-start space-x-4">
              {/* Creator Profile Picture */}
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 flex-shrink-0">
                {event.creator?.profile_picture ? (
                  <img 
                    src={event.creator.profile_picture} 
                    alt={event.creator.username || 'Creator'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {event.creator?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              {/* Event Details */}
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-lg mb-1 truncate">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {formatDate(event.start_date, event.start_time)}
                </p>
                {event.creator && (
                  <p className="text-xs text-gray-500">
                    Created by {event.creator.username}
                  </p>
                )}
              </div>
              
              {/* Event Image */}
              <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded border border-gray-300">
                <img 
                  src={event.image_url || '/api/placeholder/80/80'} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Friends Liked Button */}
              <div className="flex-shrink-0">
                {event.liked_by_friends && event.liked_by_friends.length > 0 && (
                  <FriendsLikedButton
                    friends={event.liked_by_friends}
                    onUserClick={(user) => {
                      // Handle user click if needed
                      console.log('User clicked:', user);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Card Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            {/* Close button */}
            <button
              onClick={closeEventCard}
              className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 z-10"
            >
              ×
            </button>
            
            <EventCard
              event={selectedEvent}
              showActionButtons={false}
            />
            
            {/* Unlike button */}
            <div className="mt-4 text-center">
              <button
                onClick={() => handleUnlikeEvent(selectedEvent.id)}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Unlike Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikedEvents;