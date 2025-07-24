// Updated react-client/src/pages/MatchedEvents.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventsHeader from '../components/EventsHeader';
import { User } from '../types';
import { getMatchedEvents, getUserOwnEvents, rsvpToEvent, getEventRSVPs, cancelRSVP, unlikeEvent, deleteEvent } from '../api/eventsApi';

interface MatchedEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  cover_photo_url?: string;
  guest_limit?: number;
  rsvp_close_time?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  creator_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  last_edited_at?: string;
  interested_count: number;
  going_count: number;
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
  // Flag to identify if this is the user's own event
  is_own_event?: boolean;
}

interface AttendeeWithStatus extends User {
  status: 'LIKED' | 'GOING';
}

const MatchedEvents: React.FC = () => {
  const [events, setEvents] = useState<MatchedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showOwnEvents, setShowOwnEvents] = useState(false);
  
  const navigate = useNavigate();
  
  // Fetch both matched events and user's own events
  const fetchAllEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Always fetch matched events
      const matchedData = await getMatchedEvents();
      
      // Mark matched events
      const matchedEventsWithFlag = matchedData.map(event => ({
        ...event,
        is_own_event: false
      }));
      
      let combinedEvents = [...matchedEventsWithFlag];
      
      // If checkbox is checked, also fetch user's own events
      if (showOwnEvents) {
        const ownData = await getUserOwnEvents();
        
        // Mark own events and filter out any that might already be in matches
        const ownEventsWithFlag = ownData
          .filter(event => !matchedEventsWithFlag.find(matched => matched.id === event.id))
          .map(event => ({
            ...event,
            is_own_event: true
          }));
        
        combinedEvents = [...matchedEventsWithFlag, ...ownEventsWithFlag];
      }
      
      // For each event, fetch additional RSVP data for the UI
      const eventsWithRSVPs = await Promise.all(
        combinedEvents.map(async (event) => {
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
      
      // Sort events by start_date (newest first)
      eventsWithRSVPs.sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      
      setEvents(eventsWithRSVPs);
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage('An error occurred while loading events');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle checkbox toggle
  const handleShowOwnEventsToggle = (checked: boolean) => {
    setShowOwnEvents(checked);
  };
  
  // Re-fetch events when showOwnEvents changes
  useEffect(() => {
    fetchAllEvents();
  }, [showOwnEvents]);
  
  // Initial fetch
  useEffect(() => {
    fetchAllEvents();
  }, []);
  
  // Handle deleting own event
  const handleDeleteEvent = async (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    setActionLoading(eventId);
    
    try {
      await deleteEvent(eventId);
      // Remove the event from the list
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setErrorMessage('');
    } catch (error) {
      console.error('Error deleting event:', error);
      setErrorMessage('Error deleting event. Please try again.');
    } finally {
      setActionLoading(null);
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
  
  // Show attendees modal (combined liked + going)
  const showAttendees = (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowAttendeesModal(eventId);
  };
  
  // Close attendees modal
  const closeAttendeesModal = () => {
    setShowAttendeesModal(null);
  };
  
  // Handle RSVP (Going only, since Interested is removed)
  const handleRSVP = async (eventId: number, status: 'GOING', event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(eventId);
    
    try {
      await rsvpToEvent(eventId, status);
      await fetchAllEvents();
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
      await fetchAllEvents();
      setErrorMessage('');
    } catch (error) {
      console.error('Error canceling RSVP:', error);
      setErrorMessage('Error canceling RSVP. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Handle opening chat for an event
  const handleOpenChat = (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/events/${eventId}/chat`);
  };
  
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
  const getEventStatus = (event: MatchedEvent): 'LIKED' | 'GOING' | 'OWN' => {
    if (event.is_own_event) {
      return 'OWN';
    }
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
      case 'OWN':
        return (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}/edit`);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Edit Event
            </button>
            <button
              onClick={(e) => handleDeleteEvent(event.id, e)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete Event
            </button>
          </div>
        );
        
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
      case 'OWN':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Your Event</span>;
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
        email: '', // We don't have email for creator, so use empty string
        profile_picture: event.creator.profile_picture,
        created_at: new Date().toISOString() // Default timestamp
      });
    }
    
    if (event.liked_by_friends) {
      people.push(...event.liked_by_friends);
    }
    
    return people;
  };
  
  // Get all people who are going to the event
  const getPeopleGoing = (event: MatchedEvent): User[] => {
    return event.going_users || [];
  };
  
  // Get combined attendees with status
  const getCombinedAttendees = (event: MatchedEvent): AttendeeWithStatus[] => {
    const liked = getPeopleLiked(event).map(user => ({ ...user, status: 'LIKED' as const }));
    const going = getPeopleGoing(event).map(user => ({ ...user, status: 'GOING' as const }));
    
    // Remove duplicates (people who both liked and are going)
    const combined: AttendeeWithStatus[] = [];
    const seenIds = new Set<number>();
    
    // Add going users first (higher priority)
    going.forEach(user => {
      if (!seenIds.has(user.id)) {
        combined.push(user);
        seenIds.add(user.id);
      }
    });
    
    // Then add liked users
    liked.forEach(user => {
      if (!seenIds.has(user.id)) {
        combined.push(user);
        seenIds.add(user.id);
      }
    });
    
    return combined;
  };
  
  if (isLoading) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <EventsHeader />
        <div className="text-center p-8">Loading events...</div>
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
      
      {/* Controls Section */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOwnEvents}
              onChange={(e) => handleShowOwnEventsToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-black-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-gray-700">
              My Events
            </span>
          </label>
        </div>
      
      {events.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-lg text-gray-600">
            {showOwnEvents ? 'No events found!' : 'No matches yet!'}
          </p>
          <p className="text-sm text-gray-500">
            {showOwnEvents 
              ? 'Create some events or start swiping to see matches here.'
              : 'Start swiping on events to find matches.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
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
                  <div className="flex justify-between items-start space-x-4">
                    {/* Event Cover Photo */}
                    <div className="flex-shrink-0">
                      <img 
                        src={event.cover_photo_url || '/api/placeholder/80/80'} 
                        alt={event.title}
                        className="w-20 h-20 rounded-lg object-cover border border-gray-300"
                      />
                    </div>
                    
                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                        {getStatusBadge(event)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDateTime(event.start_date, event.start_time)}
                      </p>
                      
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        📍 {event.location}
                      </p>
                      
                      {/* Attendees preview with profile pics */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <button 
                          onClick={(e) => showAttendees(event.id, e)}
                          className="hover:text-blue-600 flex items-center space-x-2"
                        >
                          {/* Profile pics preview (up to 5) */}
                          <div className="flex -space-x-1">
                            {getCombinedAttendees(event).slice(0, 5).map((attendee, index) => (
                              <div key={attendee.id} className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center" style={{zIndex: 5 - index}}>
                                {attendee.profile_picture ? (
                                  <img 
                                    src={attendee.profile_picture} 
                                    alt={attendee.username}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-600">
                                    {attendee.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <span>
                            {peopleGoing.length > 0 ? (
                              <span className="text-green-600 font-medium">{peopleGoing.length} going</span>
                            ) : (
                              <span>{peopleLiked.length} interested</span>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Expand Arrow */}
                    <div className="flex items-center flex-shrink-0">
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
                    <div className="mb-4 space-y-2">
                      {renderActionButtons(event)}
                      
                      {/* Chat Button - only show for non-own events or own events with participants */}
                      {(!event.is_own_event || (event.is_own_event && getCombinedAttendees(event).length > 0)) && (
                        <button
                          onClick={(e) => handleOpenChat(event.id, e)}
                          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center space-x-2"
                        >
                          <span>💬</span>
                          <span>Chat with Event Group</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Combined Attendees Modal */}
      {showAttendeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Event Interest</h3>
              <button
                onClick={closeAttendeesModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const event = events.find(e => e.id === showAttendeesModal);
                const peopleLiked = event ? getPeopleLiked(event) : [];
                const peopleGoing = event ? getPeopleGoing(event) : [];
                
                return (
                  <>
                    {/* People Going Section */}
                    {peopleGoing.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Going ({peopleGoing.length})</h4>
                        <div className="space-y-2">
                          {peopleGoing.map(user => (
                            <div key={user.id} className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                {user.profile_picture ? (
                                  <img 
                                    src={user.profile_picture} 
                                    alt={user.username}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-600">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm">{user.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* People Liked Section */}
                    {peopleLiked.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-purple-600 mb-2">Interested ({peopleLiked.length})</h4>
                        <div className="space-y-2">
                          {peopleLiked.map(user => (
                            <div key={user.id} className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                {user.profile_picture ? (
                                  <img 
                                    src={user.profile_picture} 
                                    alt={user.username}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-600">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm">{user.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {peopleLiked.length === 0 && peopleGoing.length === 0 && (
                      <p className="text-gray-500 text-center">No one has shown interest yet</p>
                    )}
                  </>
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