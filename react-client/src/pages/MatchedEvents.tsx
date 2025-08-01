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
      let combinedEvents: MatchedEvent[] = [];
      
      if (showOwnEvents) {
        // When "My Events" is checked, show ONLY user's own events
        const ownData = await getUserOwnEvents();
        combinedEvents = ownData.map(event => ({
          ...event,
          is_own_event: true
        }));
      } else {
        // When "My Events" is unchecked, show ALL matched events (including own events)
        const matchedData = await getMatchedEvents();
        
        // Mark which events are own events so we can handle them differently
        const matchedEventsWithFlag = matchedData.map(event => ({
          ...event,
          is_own_event: false // Will be updated below for own events
        }));
        
        // Also fetch own events to identify them in the matched list
        const ownData = await getUserOwnEvents();
        const ownEventIds = new Set(ownData.map(event => event.id));
        
        // Update the flag for own events that appear in matches
        combinedEvents = matchedEventsWithFlag.map(event => ({
          ...event,
          is_own_event: ownEventIds.has(event.id)
        }));
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
  
  const handleUnlikeEvent = async (eventId: number, event: React.MouseEvent) => {
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
  
  // Helper functions for getting people data
  const getPeopleLiked = (event: MatchedEvent): User[] => {
    return event.liked_by_friends || [];
  };
  
  const getPeopleGoing = (event: MatchedEvent): User[] => {
    return event.going_users || [];
  };
  
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
  
  const getStatusBadge = (event: MatchedEvent) => {
    if (event.current_user_rsvp?.status === 'GOING') {
      return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Going</span>;
    }
    if (event.liked_by_current_user) {
      return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Interested</span>;
    }
    return null;
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
      <div className="flex items-center space-x-3 mb-6">
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
                                  <span className="text-xs text-gray-600">{attendee.username.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                            ))}
                            {getCombinedAttendees(event).length > 5 && (
                              <div className="w-6 h-6 bg-gray-400 text-white rounded-full border-2 border-white flex items-center justify-center text-xs">
                                +{getCombinedAttendees(event).length - 5}
                              </div>
                            )}
                          </div>
                          <span>{getCombinedAttendees(event).length} attendees</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-gray-400 text-sm">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Event Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {/* Action Buttons */}
                    <div className="mb-4 pt-4">
                      {/* Edit buttons - ONLY show for own events when "My Events" is checked */}
                      {showOwnEvents && event.is_own_event && (
                        <div className="flex space-x-2 mb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${event.id}/edit`);
                            }}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit Event
                          </button>
                          <button
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                            disabled={actionLoading === event.id}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm disabled:opacity-50"
                          >
                            {actionLoading === event.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}

                      {/* Regular RSVP buttons - only show for matched events (not own events when "My Events" is checked) */}
                      {!showOwnEvents && (
                        <div className="flex space-x-2 mb-3">
                          {event.current_user_rsvp?.status === 'GOING' ? (
                            <button
                              onClick={(e) => handleCancelRSVP(event.id, e)}
                              disabled={actionLoading === event.id}
                              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-sm disabled:opacity-50"
                            >
                              {actionLoading === event.id ? 'Updating...' : 'Cancel RSVP'}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleRSVP(event.id, 'GOING', e)}
                              disabled={actionLoading === event.id}
                              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm disabled:opacity-50"
                            >
                              {actionLoading === event.id ? 'RSVPing...' : 'RSVP Going'}
                            </button>
                          )}
                          {/* Only show unlike button for events that are NOT your own */}
                          {!event.is_own_event && (
                            <button
                              onClick={(e) => handleUnlikeEvent(event.id, e)}
                              disabled={actionLoading === event.id}
                              className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm disabled:opacity-50"
                            >
                              {actionLoading === event.id ? 'Removing...' : 'Unlike'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Chat button - only for matched events */}
                      {!showOwnEvents && (
                        <button
                          onClick={(e) => handleOpenChat(event.id, e)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm mb-3"
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                    
                    {/* Event Description */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {event.description || 'No description provided.'}
                      </p>
                    </div>
                    
                    {/* Additional Event Details */}
                    <div className="text-sm text-gray-600 space-y-1">
                      {event.end_date && (
                        <p><strong>End:</strong> {formatDateTime(event.end_date, event.end_time)}</p>
                      )}
                      {event.guest_limit && (
                        <p><strong>Guest Limit:</strong> {event.guest_limit}</p>
                      )}
                      {event.rsvp_close_time && (
                        <p><strong>RSVP Closes:</strong> {new Date(event.rsvp_close_time).toLocaleString()}</p>
                      )}
                      <p><strong>Visibility:</strong> {event.visibility}</p>
                      {event.creator && (
                        <p><strong>Created by:</strong> {event.creator.username}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Attendees Modal */}
      {showAttendeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Attendees</h3>
                <button 
                  onClick={closeAttendeesModal}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              {(() => {
                const event = events.find(e => e.id === showAttendeesModal);
                if (!event) return <p>Event not found</p>;
                
                const combinedAttendees = getCombinedAttendees(event);
                
                if (combinedAttendees.length === 0) {
                  return <p className="text-gray-500 text-center">No attendees yet</p>;
                }
                
                return (
                  <div className="space-y-3">
                    {combinedAttendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          {attendee.profile_picture ? (
                            <img 
                              src={attendee.profile_picture} 
                              alt={attendee.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {attendee.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attendee.username}</p>
                          <p className="text-xs text-gray-500">
                            {attendee.status === 'GOING' ? 'Going' : 'Interested'}
                          </p>
                        </div>
                      </div>
                    ))}
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