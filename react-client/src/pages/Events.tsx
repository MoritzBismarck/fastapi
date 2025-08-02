// Updated Events.tsx - Viewport-based layout for tinder view
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

  useEffect(() => {
    fetchEvents();
  }, [isLikedView]);

  return (
    // Main container that takes full viewport height
    <div className="font-mono h-screen flex flex-col overflow-hidden">
      {/* Header - fixed height */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Events Header - fixed height */}
      <div className="flex-shrink-0">
        <EventsHeader
          isCreating={isCreatingEvent}
          onToggleCreate={toggleEventCreation}
        />
      </div>

      {/* Main content area - flexible height that fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
        {isCreatingEvent ? (
          <div className="flex-1 overflow-y-auto">
            <CreateEventForm onEventCreated={handleEventCreated} onCancel={toggleEventCreation} />
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="p-4 border border-gray-300 text-center">
              Loading events...
            </div>
          </div>
        ) : noMoreEvents || events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
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
          </div>
        ) : isLikedView ? (
          // Liked Events view - scrollable list
          <div className="flex-1 overflow-y-auto">
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
          </div>
        ) : (
          // Tinder view - single card that fits viewport
          <div className="flex-1 flex items-center justify-center min-h-0">
            {getCurrentEvent() && (
              <div className="w-full max-w-md h-full flex items-center justify-center">
                <EventCard
                  event={getCurrentEvent()!}
                  onLike={handleLikeEvent}
                  onSkip={handleSkipEvent}
                  fitToViewport={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;