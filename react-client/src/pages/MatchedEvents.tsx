// Update in react-client/src/pages/MatchedEvents.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventsHeader from '../components/EventsHeader';
import { Event, User } from '../types';
import { getMatchedEvents, rsvpToEvent, getEventRSVPs, cancelRSVP, unlikeEvent } from '../api/eventsApi';

interface MatchedEvent extends Event {
  creator?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  liked_by_friends?: User[];
  liked_by_current_user?: boolean;
  going_users?: User[];
  current_user_rsvp?: {
    status: 'GOING' | 'CANCELLED';
    responded_at: string;
  };
}

const MatchedEvents: React.FC = () => {
  const [events, setEvents] = useState<MatchedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [showLikersModal, setShowLikersModal] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const navigate = useNavigate();
  
  // Fetch matched events
  const fetchMatchedEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const data = await getMatchedEvents();
      
      // For each event, fetch additional RSVP data for the UI
      const eventsWithRSVPs = await Promise.all(
        data.map(async (event) => {
          try {
            const rsvps = await getEventRSVPs(event.id);
            const going_users = rsvps.filter(rsvp => rsvp.rsvp_status === 'GOING');
            
            return {
              ...event,
              going_users
              // current_user_rsvp is now included directly from the backend API
            };
          } catch (error) {
            console.error(`Error fetching RSVPs for event ${event.id}:`, error);
            return {
              ...event,
              going_users: []
            };
          }
        })
      );
      
      setEvents(eventsWithRSVPs);
    } catch (error) {
      console.error('Error fetching matched events:', error);
      setErrorMessage('An error occurred while loading matched events');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date and time for display
  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (timeString) {
      return `${dateFormatted} at ${timeString}`;
    }
    return `${dateFormatted} (All day)`;
  };
  
  // Toggle event expansion
  const toggleEventExpansion = (eventId: number) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };
  
  // Show likers modal
  const showLikers = (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowLikersModal(eventId);
  };
  
  // Close likers modal
  const closeLikersModal = () => {
    setShowLikersModal(null);
  };
  
  // Handle RSVP (Going only, since Interested is removed)
  const handleRSVP = async (eventId: number, status: 'GOING', event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(eventId);
    
    try {
      await rsvpToEvent(eventId, status);
      await fetchMatchedEvents();
      setErrorMessage('');
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      setErrorMessage('Error submitting RSVP. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Handle Cancel RSVP (goes back to LIKED state)
  const handleCancelRSVP = async (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(eventId);
    
    try {
      await cancelRSVP(eventId);
      await fetchMatchedEvents();
      setErrorMessage('');
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      setErrorMessage('Error canceling RSVP. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Handle Unlike Event (removes from matches completely)
  const handleUnlike = async (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(eventId);
    
    try {
      await unlikeEvent(eventId);
      // Remove this event from the matches list since we unliked it
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setErrorMessage('');
    } catch (error) {
      console.error('Error unliking event:', error);
      setErrorMessage('Error unliking event. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Get the current status for an event
  const getEventStatus = (event: MatchedEvent): 'LIKED' | 'GOING' => {
    if (event.current_user_rsvp && event.current_user_rsvp.status === 'GOING') {
      return 'GOING';
    }
    return 'LIKED';  // Default to LIKED (since they matched, they must have liked it)
  };
  
  // Render action buttons based on current status
  const renderActionButtons = (event: MatchedEvent) => {
    const status = getEventStatus(event);
    const isLoading = actionLoading === event.id;
    
    if (isLoading) {
      return (
        <div className="flex space-x-2">
          <div className="bg-gray-400 text-white px-4 py-2 rounded">
            Loading...
          </div>
        </div>
      );
    }
    
    switch (status) {
      case 'LIKED':
        return (
          <div className="flex space-x-2">
            <button
              onClick={(e) => handleRSVP(event.id, 'GOING', e)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Going 🎉
            </button>
            <button
              onClick={(e) => handleUnlike(event.id, e)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Unlike
            </button>
          </div>
        );
        
      case 'GOING':
        return (
          <div className="flex space-x-2">
            <button
              onClick={(e) => handleCancelRSVP(event.id, e)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel RSVP
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Get status badge
  const getStatusBadge = (event: MatchedEvent) => {
    const status = getEventStatus(event);
    
    switch (status) {
      case 'LIKED':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Liked</span>;
      case 'GOING':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Going</span>;
      default:
        return null;
    }
  };
  
  // Get all people who liked the event
  const getPeopleLiked = (event: MatchedEvent): User[] => {
    const people: User[] = [];
    
    if (event.creator && event.visibility === 'PRIVATE') {
      people.push({
        id: event.creator.id,
        username: event.creator.username,
        email: '',
        profile_picture: event.creator.profile_picture
      });
    }
    
    if (event.liked_by_friends) {
      people.push(...event.liked_by_friends);
    }
    
    return people;
  };
  
  // Get people who are going
  const getPeopleGoing = (event: MatchedEvent): User[] => {
    return event.going_users || [];
  };
  
  useEffect(() => {
    fetchMatchedEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <EventsHeader />
        <div className="text-center p-8">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      <EventsHeader />
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      {events.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-gray-600">No matches yet!</p>
          <p className="text-sm text-gray-500">Start swiping on events to find matches.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Your Event Matches ({events.length})</h2>
          
          {events.map((event) => {
            const isExpanded = expandedEventId === event.id;
            const peopleLiked = getPeopleLiked(event);
            const peopleGoing = getPeopleGoing(event);
            
            return (
              <div key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Event Header - Clickable */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        {getStatusBadge(event)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDateTime(event.start_date, event.start_time)}
                      </p>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {event.location}
                      </p>
                      
                      {/* People who liked and are going */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <button 
                          onClick={(e) => showLikers(event.id, e)}
                          className="hover:text-blue-600"
                        >
                          👥 {peopleLiked.length} liked
                        </button>
                        <span>🎉 {peopleGoing.length} going</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-700">{event.description}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mb-4">
                      {renderActionButtons(event)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
                  {/* Likers Modal */}
      {showLikersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">People who liked this event</h3>
              <button
                onClick={closeLikersModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {(() => {
                const event = events.find(e => e.id === showLikersModal);
                const peopleLiked = event ? getPeopleLiked(event) : [];
                
                return peopleLiked.length > 0 ? (
                  peopleLiked.map((person) => (
                    <div key={person.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {person.profile_picture ? (
                          <img 
                            src={person.profile_picture} 
                            alt={person.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {person.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm">{person.username}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No one has liked this event yet.</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchedEvents;