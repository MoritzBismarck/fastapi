// Updated react-client/src/pages/MatchedEvents.tsx

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

  // Get combined attendees with status - SORTED LIST
  const getCombinedAttendees = (event: MatchedEvent): AttendeeWithStatus[] => {
    const peopleLiked = getPeopleLiked(event);
    const peopleGoing = getPeopleGoing(event);
    
    // Create a map to track users and avoid duplicates
    const attendeesMap = new Map<number, AttendeeWithStatus>();
    
    // Add people who liked (but prioritize going status if they exist in both)
    peopleLiked.forEach(person => {
      attendeesMap.set(person.id, {
        ...person,
        status: 'LIKED'
      });
    });
    
    // Override with going status for people who are going
    peopleGoing.forEach(person => {
      attendeesMap.set(person.id, {
        ...person,
        status: 'GOING'
      });
    });
    
    // Convert to array and sort: GOING first, then LIKED, then by username
    return Array.from(attendeesMap.values()).sort((a, b) => {
      // First sort by status priority (GOING before LIKED)
      if (a.status !== b.status) {
        return a.status === 'GOING' ? -1 : 1;
      }
      
      // Then sort alphabetically by username within same status
      return a.username.localeCompare(b.username);
    });
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
            const totalAttendees = peopleLiked.length + peopleGoing.length;
            
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
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-medium">
                                    {attendee.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {getCombinedAttendees(event).length > 5 && (
                              <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
                                +{getCombinedAttendees(event).length - 5}
                              </div>
                            )}
                          </div>
                          
                          {/* Text showing real attendees count */}
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
                    
                    {/* TEMPORARILY DISABLED - Chat Button */}
                    {/* 
                    <button
                        onClick={(e) => handleOpenChat(event.id, e)}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center space-x-2"
                    >
                        <span>💬</span>
                        <span>Chat with Event Group</span>
                    </button>
                    */}
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
                  <div>
                    {/* Going Section */}
                    {peopleGoing.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2 flex items-center">
                          <span className="text-green-600 mr-1">✅</span>
                          Going ({peopleGoing.length})
                        </h4>
                        <div className="space-y-2 mb-4">
                          {peopleGoing.map((person) => (
                            <div key={person.id} className="flex items-center space-x-3 p-2 rounded hover:bg-green-50">
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
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Liked Section */}
                    {peopleLiked.length > 0 && (
                      <div>
                        <h4 className="font-medium text-purple-700 mb-2 flex items-center">
                          <span className="text-purple-600 mr-1">❤️</span>
                          Interested ({peopleLiked.length})
                        </h4>
                        <div className="space-y-2">
                          {peopleLiked
                            .filter(person => !peopleGoing.some(going => going.id === person.id)) // Exclude people who are already going
                            .map((person) => (
                            <div key={person.id} className="flex items-center space-x-3 p-2 rounded hover:bg-purple-50">
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
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Empty state */}
                    {peopleGoing.length === 0 && peopleLiked.length === 0 && (
                      <p className="text-sm text-gray-500">No one has shown interest yet.</p>
                    )}
                  </div>
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