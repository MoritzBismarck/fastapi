import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventsHeader from '../components/EventsHeader';
import { Event, User } from '../types';
import { getMatchedEvents, rsvpToEvent, getEventRSVPs } from '../api/eventsApi';

interface MatchedEvent extends Event {
  creator?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  liked_by_friends?: User[];
  liked_by_current_user?: boolean;
  going_users?: User[];
  interested_users?: User[];
}

const MatchedEvents: React.FC = () => {
  const [events, setEvents] = useState<MatchedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [showLikersModal, setShowLikersModal] = useState<number | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);
  
  const navigate = useNavigate();
  
  // Fetch matched events
  const fetchMatchedEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const data = await getMatchedEvents();
      
      // For each event, fetch RSVP data
      const eventsWithRSVPs = await Promise.all(
        data.map(async (event) => {
          try {
            const rsvps = await getEventRSVPs(event.id);
            const going_users = rsvps.filter(rsvp => rsvp.rsvp_status === 'GOING');
            const interested_users = rsvps.filter(rsvp => rsvp.rsvp_status === 'INTERESTED');
            
            return {
              ...event,
              going_users,
              interested_users
            };
          } catch (error) {
            console.error(`Error fetching RSVPs for event ${event.id}:`, error);
            return {
              ...event,
              going_users: [],
              interested_users: []
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
    event.stopPropagation(); // Prevent event expansion
    setShowLikersModal(eventId);
  };
  
  // Close likers modal
  const closeLikersModal = () => {
    setShowLikersModal(null);
  };
  
  // Handle RSVP
  const handleRSVP = async (eventId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event expansion
    setRsvpLoading(eventId);
    
    try {
      await rsvpToEvent(eventId, 'GOING');
      
      // Refresh the events to get updated RSVP data
      await fetchMatchedEvents();
      
      // Show success message
      setErrorMessage(''); // Clear any previous errors
      // You can add a success toast here if you want
      
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      setErrorMessage('Error submitting RSVP. Please try again.');
    } finally {
      setRsvpLoading(null);
    }
  };
  
  // Get all people who liked the event (creator first if they liked it)
  const getPeopleLiked = (event: MatchedEvent): User[] => {
    const people: User[] = [];
    
    // Add creator first if they liked it and it's a private event
    if (event.creator && event.visibility === 'PRIVATE') {
      people.push({
        id: event.creator.id,
        username: event.creator.username,
        email: '', // We don't need this for display
        profile_picture: event.creator.profile_picture
      });
    }
    
    // Add friends who liked it
    if (event.liked_by_friends) {
      people.push(...event.liked_by_friends);
    }
    
    return people;
  };
  
  // Get people who are going (now uses real RSVP data)
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
        <div className="border border-gray-300 p-4 text-center">
          <p className="mb-4">You don't have any matches yet.</p>
          <button
            onClick={() => navigate('/events')}
            className="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300"
          >
            Discover Events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const isExpanded = expandedEventId === event.id;
            const peopleLiked = getPeopleLiked(event);
            
            return (
              <div key={event.id} className="border border-gray-300 bg-white">
                {/* Collapsible Header */}
                <div 
                  className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-start space-x-3 mb-2">
                      {/* Event Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img 
                          src={event.cover_photo_url || '/placeholder.jpg'} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{event.title}</h3>
                        <p className="text-xs text-gray-600 truncate">
                          {formatDateTime(event.start_date, event.start_time)}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          📍 {event.location}
                        </p>
                      </div>
                      
                      {/* Expand Arrow */}
                      <div className="flex-shrink-0 ml-2">
                        <span className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                    
                    {/* People Liked - Mobile */}
                    <div 
                      className="flex items-center justify-between"
                      onClick={(e) => showLikers(event.id, e)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-1">
                          {peopleLiked.slice(0, 4).map((person, index) => (
                            <div key={person.id} className="w-6 h-6 rounded-full border border-white overflow-hidden bg-gray-300">
                              {person.profile_picture ? (
                                <img 
                                  src={person.profile_picture} 
                                  alt={person.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-400 flex items-center justify-center text-xs text-white">
                                  {person.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {peopleLiked.length} {peopleLiked.length === 1 ? 'person' : 'people'} interested
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Event Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img 
                          src={event.cover_photo_url || '/placeholder.jpg'} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{event.title}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {formatDateTime(event.start_date, event.start_time)}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          📍 {event.location}
                        </p>
                      </div>
                      
                      {/* People Liked - Desktop */}
                      <div 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                        onClick={(e) => showLikers(event.id, e)}
                      >
                        <div className="flex -space-x-2">
                          {peopleLiked.slice(0, 3).map((person, index) => (
                            <div key={person.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-300">
                              {person.profile_picture ? (
                                <img 
                                  src={person.profile_picture} 
                                  alt={person.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-400 flex items-center justify-center text-xs text-white">
                                  {person.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {peopleLiked.length > 3 && (
                          <span className="text-sm text-gray-500">+{peopleLiked.length - 3}</span>
                        )}
                        <span className="text-sm text-gray-500">interested</span>
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Arrow */}
                    <div className="ml-4">
                      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Event Details */}
                    <div className="mb-4">
                      <h4 className="font-bold mb-3">Event Details</h4>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Description:</strong> {event.description}</p>
                        <p className="text-sm"><strong>When:</strong> {formatDateTime(event.start_date, event.start_time)}</p>
                        {event.end_date && event.end_time && (
                          <p className="text-sm"><strong>Until:</strong> {formatDateTime(event.end_date, event.end_time)}</p>
                        )}
                        <p className="text-sm"><strong>Where:</strong> {event.location}</p>
                        {event.guest_limit && (
                          <p className="text-sm"><strong>Guest Limit:</strong> {event.guest_limit}</p>
                        )}
                        <p className="text-sm"><strong>Going:</strong> {event.going_count} | <strong>Interested:</strong> {event.interested_count}</p>
                      </div>
                    </div>
                    
                    {/* RSVP Button */}
                    <div className="text-center">
                      <button
                        onClick={(e) => handleRSVP(event.id, e)}
                        disabled={rsvpLoading === event.id}
                        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {rsvpLoading === event.id ? 'Submitting...' : "I'm Going! 🎉"}
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Event Interest</h3>
              <button
                onClick={closeLikersModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {(() => {
              const currentEvent = events.find(e => e.id === showLikersModal)!;
              const peopleGoing = getPeopleGoing(currentEvent);
              const peopleLiked = getPeopleLiked(currentEvent);
              
              return (
                <div className="space-y-4">
                  {/* People Going Section */}
                  {peopleGoing.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                        🎉 Going ({peopleGoing.length})
                      </h4>
                      <div className="space-y-2">
                        {peopleGoing.map((person) => (
                          <div key={`going-${person.id}`} className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                              {person.profile_picture ? (
                                <img 
                                  src={person.profile_picture} 
                                  alt={person.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs">
                                  {person.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-green-800">{person.username}</span>
                            <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded">Going</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* People Interested Section */}
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
                      💙 Interested ({peopleLiked.length})
                    </h4>
                    <div className="space-y-2">
                      {peopleLiked.map((person) => (
                        <div key={`liked-${person.id}`} className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                            {person.profile_picture ? (
                              <img 
                                src={person.profile_picture} 
                                alt={person.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs">
                                {person.username[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-blue-800">{person.username}</span>
                          <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">Interested</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* If no one is going or interested */}
                  {peopleGoing.length === 0 && peopleLiked.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No one has shown interest yet</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchedEvents;