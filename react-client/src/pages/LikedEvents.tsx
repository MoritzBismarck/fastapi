import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import { Event, User } from '../types';
import { getLikedEvents, unlikeEvent } from '../api/eventsApi';
import EventsHeader from '../components/EventsHeader';

interface EventMatch {
  event: Event;
  friends: User[];
  matchedAt: string; // When the match was first detected
}

const LikedEvents: React.FC = () => {
  // State for events
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedPopular, setExpandedPopular] = useState(false);
  const [expandedLiked, setExpandedLiked] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState(false);
  
  const navigate = useNavigate();
  
  // Separate events into popular and regular
  const popularEvents = events.filter(event => 
    event.liked_by_friends && event.liked_by_friends.length > 2
  );
  
  const otherLikedEvents = events.filter(event => 
    !event.liked_by_friends || event.liked_by_friends.length <= 2
  );
  
  // Find recent matches (events with at least one friend match)
  const recentMatches: EventMatch[] = events
    .filter(event => event.liked_by_friends && event.liked_by_friends.length > 0)
    .map(event => ({
      event,
      friends: event.liked_by_friends!,
      matchedAt: event.created_at // Using event creation as fallback, ideally would be when the match occurred
    }))
    .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())
    .slice(0, 10); // Show only the 10 most recent matches
  
  // Sort both sections by start date
  popularEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  otherLikedEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  // Fetch liked events with friend information
  const fetchLikedEvents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Get liked events
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
      
      // Remove the event from both lists
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return 'Just now';
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const EventListItem: React.FC<{ event: Event; onClick: () => void }> = ({ event, onClick }) => (
    <div className="border-b border-gray-300 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onClick}>
      <div className="p-4 flex items-center space-x-4">
        {/* Event Image */}
        <div className="w-20 h-20 flex-shrink-0 overflow-hidden border border-gray-300">
          <img 
            src={event.image_url || '/api/placeholder/80/80'} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Event Info */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-1">{event.title}</h3>
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-mono">{formatDate(event.start_date)}</span>
            {event.start_time && <span className="ml-2">{event.start_time}</span>}
          </div>
          <div className="text-sm text-gray-700">{event.place}</div>
        </div>
        
        {/* Friends who liked this */}
        <div className="flex-shrink-0 text-right">
          {event.liked_by_friends && event.liked_by_friends.length > 0 && (
            <div className="flex items-center justify-end -space-x-2 mb-2">
              {event.liked_by_friends.slice(0, 3).map(friend => (
                <div 
                  key={friend.id} 
                  className="w-6 h-6 rounded-full border border-white overflow-hidden"
                  title={friend.username}
                >
                  {friend.profile_picture ? (
                    <img 
                      src={friend.profile_picture} 
                      alt={friend.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {event.liked_by_friends.length > 3 && (
                <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center text-xs font-bold">
                  +{event.liked_by_friends.length - 3}
                </div>
              )}
            </div>
          )}
          <div className="text-xs text-gray-500">
            {event.liked_by_friends?.length || 0} friends liked
          </div>
        </div>
        
        {/* Arrow indicator */}
        <div className="flex-shrink-0 text-gray-400">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4 L10 8 L6 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );

  const MatchItem: React.FC<{ match: EventMatch; onClick: () => void }> = ({ match, onClick }) => (
    <div className="border-b border-gray-300 last:border-b-0 cursor-pointer hover:bg-blue-50 transition-colors" onClick={onClick}>
      <div className="p-4 flex items-center space-x-4">
        {/* Match Icon */}
        <div className="w-12 h-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-2xl">🎯</span>
        </div>
        
        {/* Match Info */}
        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-1">{match.event.title}</h3>
          <div className="text-sm text-gray-600 mb-1">
            You and {match.friends.map(f => f.username).join(', ')} both liked this!
          </div>
          <div className="text-xs text-gray-500">
            {formatRelativeTime(match.matchedAt)}
          </div>
        </div>
        
        {/* Friend avatars */}
        <div className="flex-shrink-0">
          <div className="flex items-center -space-x-2">
            {match.friends.slice(0, 3).map(friend => (
              <div 
                key={friend.id} 
                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
                title={friend.username}
              >
                {friend.profile_picture ? (
                  <img 
                    src={friend.profile_picture} 
                    alt={friend.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {friend.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      <EventsHeader />
      
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
        <div className="space-y-8">
          {/* Recent Matches Section */}
          {recentMatches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold border-b-2 border-blue-600 inline-block pb-1 text-blue-800">
                  Recent
                </h2>
                <span className="text-sm text-gray-600">
                  {recentMatches.length} match{recentMatches.length !== 1 ? 'es' : ''}
                </span>
              </div>
              
              <div className="border border-blue-200 rounded overflow-hidden bg-blue-50">
                {(expandedMatches ? recentMatches : recentMatches.slice(0, 3)).map(match => (
                  <MatchItem 
                    key={match.event.id} 
                    match={match} 
                    onClick={() => navigate(`/events/${match.event.id}`)}
                  />
                ))}
              </div>
              
              {recentMatches.length > 3 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => setExpandedMatches(!expandedMatches)}
                    className="text-blue-700 underline hover:text-blue-900 text-sm"
                  >
                    {expandedMatches ? 'Show less' : `Show ${recentMatches.length - 3} more matches`}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Popular Section */}
          {popularEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold border-b-2 border-black inline-block pb-1">
                  Popular Among Friends
                </h2>
                <span className="text-sm text-gray-600">
                  {popularEvents.length} event{popularEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="border border-gray-300 rounded overflow-hidden bg-white">
                {(expandedPopular ? popularEvents : popularEvents.slice(0, 3)).map(event => (
                  <EventListItem 
                    key={event.id} 
                    event={event} 
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                ))}
              </div>
              
              {popularEvents.length > 3 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => setExpandedPopular(!expandedPopular)}
                    className="text-blue-700 underline hover:text-blue-900 text-sm"
                  >
                    {expandedPopular ? 'Show less' : `Show ${popularEvents.length - 3} more`}
                  </button>
                </div>
              )}
            </section>
          )}
          
          {/* Regular Liked Events Section */}
          {otherLikedEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold border-b-2 border-black inline-block pb-1">
                  Liked
                </h2>
                <span className="text-sm text-gray-600">
                  {otherLikedEvents.length} event{otherLikedEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="border border-gray-300 rounded overflow-hidden bg-white">
                {(expandedLiked ? otherLikedEvents : otherLikedEvents.slice(0, 5)).map(event => (
                  <EventListItem 
                    key={event.id} 
                    event={event} 
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                ))}
              </div>
              
              {otherLikedEvents.length > 5 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => setExpandedLiked(!expandedLiked)}
                    className="text-blue-700 underline hover:text-blue-900 text-sm"
                  >
                    {expandedLiked ? 'Show less' : `Show ${otherLikedEvents.length - 5} more`}
                  </button>
                </div>
              )}
            </section>
          )}
          
          {/* Action Button */}
          <div className="text-center pt-6 border-t border-gray-300">
            <button
              onClick={() => navigate('/events')}
              className="text-lg text-blue-700 underline hover:text-blue-900 font-bold"
            >
              Discover More Events
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikedEvents;