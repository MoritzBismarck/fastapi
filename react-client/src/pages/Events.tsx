import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { getEvents, likeEvent } from '../api/eventsApi';

const Events: React.FC = () => {
  // State for events
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [noMoreEvents, setNoMoreEvents] = useState(false);
  
  const navigate = useNavigate();
  
  // Function to get the current event
  const getCurrentEvent = (): Event | null => {
    return events.length > 0 ? events[currentEventIndex] : null;
  };
  
  // Fetch events from the API
  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const data = await getEvents();
      
      if (data.length === 0) {
        setNoMoreEvents(true);
      } else {
        setEvents(data);
        setCurrentEventIndex(0);
        setNoMoreEvents(false);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage('An error occurred while loading events');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle liking an event
  const handleLikeEvent = async () => {
    const currentEvent = getCurrentEvent();
    if (!currentEvent) return;
    
    try {
      await likeEvent(currentEvent.id);
      
      // Move to the next event
      moveToNextEvent();
    } catch (error) {
      console.error('Error liking event:', error);
      setErrorMessage('An error occurred while liking the event');
    }
  };
  
  // Function to handle skipping an event
  const handleSkipEvent = () => {
    moveToNextEvent();
  };
  
  // Function to move to the next event
  const moveToNextEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    } else {
      // We've reached the end of our current batch
      // Load more events
      fetchEvents();
    }
  };
  
  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-4">Events</h1>
        <div className="w-full flex justify-center items-center py-4">
          <button 
            onClick={() => navigate('/events/liked')}
            className="text-blue-700 underline hover:text-blue-900"
          >
            View My Liked Events
          </button>
          <span className="mx-4 select-none text-gray-400">|</span>
          <button 
            onClick={() => navigate('/events/create')}
            className="text-blue-700 underline hover:text-blue-900"
          >
            Create New Event
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
          {errorMessage}
        </div>
      )}
      
      {isLoading ? (
        <div className="p-4 border border-gray-300 text-center">
          Loading events...
        </div>
      ) : noMoreEvents ? (
        <div className="border border-gray-300 p-4 text-center">
          <p className="mb-4">No more events to show right now.</p>
          <button 
            onClick={fetchEvents}
            className="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>
      ) : getCurrentEvent() ? (
        <EventCard 
          event={getCurrentEvent()!}
          onLike={handleLikeEvent}
          onSkip={handleSkipEvent}
        />
      ) : (
        <div className="border border-gray-300 p-4 text-center">
          <p>No events found.</p>
        </div>
      )}
    </div>
  );
};

export default Events;