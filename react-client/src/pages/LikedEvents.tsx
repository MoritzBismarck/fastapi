import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { getLikedEvents, unlikeEvent } from '../api/eventsApi';
import EventsHeader from '../components/EventsHeader'

const LikedEvents: React.FC = () => {
  // State for liked events
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  
  // Fetch liked events
  const fetchLikedEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const data = await getLikedEvents();
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
    } catch (error) {
      console.error('Error unliking event:', error);
      setErrorMessage('An error occurred while unliking the event');
    }
  };
  
  // Fetch liked events on mount
  useEffect(() => {
    fetchLikedEvents();
  }, []);

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <EventsHeader
        // no creation toggle in this view, so just omit onToggleCreate
      />
      
      {errorMessage && (
        <div className="border border-red-500 p-4 mb-6 text-red-700 bg-red-100 rounded">
          {errorMessage}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading liked events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="border border-gray-300 rounded p-6 text-center">
          <p className="mb-4">You haven't liked any events yet.</p>
          <button 
            onClick={() => navigate('/events')}
            className="border border-gray-500 bg-gray-200 px-4 py-2 rounded inline-block hover:bg-gray-300"
          >
            Discover Events
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(event => (
            <div key={event.id} className="relative">
              <EventCard 
                event={event}
                showActionButtons={false}
              />
              <div className="mt-2 text-center">
                <button
                  onClick={() => handleUnlikeEvent(event.id)}
                  className="text-red-600 text-sm hover:text-red-800 underline"
                >
                  Unlike Event
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedEvents;