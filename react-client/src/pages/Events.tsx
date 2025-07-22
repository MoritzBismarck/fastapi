// Create a new unified Events.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import EventsHeader from '../components/EventsHeader';
import CreateEventForm from '../components/CreateEventForm';
import { Event } from '../types';
import { getEvents, getLikedEvents, likeEvent, unlikeEvent } from '../api/eventsApi';

interface EventsProps {
  initialCreating?: boolean;
}

const Events: React.FC<EventsProps> = ({ initialCreating = false }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [noMoreEvents, setNoMoreEvents] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(initialCreating);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isLikedView = location.pathname.includes('/liked');
  
  const getCurrentEvent = (): Event | null =>
    events.length > 0 ? events[currentEventIndex] : null;

  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Choose which API to call based on the current view
      const data = isLikedView ? 
        await getLikedEvents() : 
        await getEvents();
        
      if (data.length === 0) {
        setNoMoreEvents(true);
      } else {
        setEvents(data);
        setCurrentEventIndex(0);
        setNoMoreEvents(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred while loading events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeEvent = async () => {
    const current = getCurrentEvent();
    if (!current) return;
    try {
      await likeEvent(current.id);
      moveToNextEvent();
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred while liking the event');
    }
  };

  const handleUnlikeEvent = async (eventId: number) => {
    try {
      await unlikeEvent(eventId);
      // Remove the event from the list in Liked view
      if (isLikedView) {
        setEvents(events.filter(event => event.id !== eventId));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred while unliking the event');
    }
  };

  const handleSkipEvent = () => {
    moveToNextEvent();
  };

  const moveToNextEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(i => i + 1);
    } else {
      fetchEvents();
    }
  };

  const toggleEventCreation = () => {
    setIsCreatingEvent(!isCreatingEvent);
  };

  const handleEventCreated = () => {
    setIsCreatingEvent(false);
    fetchEvents();
  };

  // Fetch events when the view changes or on mount
  useEffect(() => {
    fetchEvents();
  }, [isLikedView]);

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />

      <EventsHeader
        isCreating={isCreatingEvent}
        onToggleCreate={toggleEventCreation}
      />

      {isCreatingEvent ? (
        <CreateEventForm onEventCreated={handleEventCreated} onCancel={toggleEventCreation} />
      ) : isLoading ? (
        <div className="p-4 border border-gray-300 text-center">
          Loading events...
        </div>
      ) : noMoreEvents || events.length === 0 ? (
        <div className="border border-gray-300 p-4 text-center">
          <p className="mb-4">
            {isLikedView 
              ? "You haven't liked any events yet." 
              : "No more events to show right now."}
          </p>
          {isLikedView ? (
            <button
              onClick={() => navigate('/events')}
              className="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300"
            >
              Discover Events
            </button>
          ) : (
            <button
              onClick={fetchEvents}
              className="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300"
            >
              Refresh
            </button>
          )}
        </div>
      ) : isLikedView ? (
        // Display for Liked Events view
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
      ) : (
        // Display for All Events view (swipe cards)
        getCurrentEvent() && (
          <EventCard
            event={getCurrentEvent()!}
            onLike={handleLikeEvent}
            onSkip={handleSkipEvent}
          />
        )
      )}
    </div>
  );
};

export default Events;