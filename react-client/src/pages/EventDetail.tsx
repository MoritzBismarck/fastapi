// react-client/src/pages/EventDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import { get } from '../api/client';
import { Event, User } from '../types';

interface EventWithLikedUsers extends Event {
  liked_by_friends: User[];
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<EventWithLikedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the event with details about which friends liked it
        const data = await get<EventWithLikedUsers>(`/events/${id}/detail`);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <div className="text-center p-8">Loading event details...</div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Event not found'}
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-700 underline hover:text-blue-900"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-700 underline hover:text-blue-900"
        >
          ← Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <EventCard event={event} showActionButtons={false} />
        </div>
        
        <div className="border border-gray-300 p-4">
          <h2 className="text-xl font-bold mb-4 uppercase tracking-wide">Friends Going</h2>
          
          {event.liked_by_friends.length > 0 ? (
            <ul className="space-y-2">
              {event.liked_by_friends.map(friend => (
                <li key={friend.id} className="flex items-center">
                  {/* Profile picture or initial */}
                  {friend.profile_picture ? (
                    <img 
                      src={friend.profile_picture} 
                      alt={friend.username} 
                      className="w-8 h-8 rounded-full mr-2 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                      <span className="text-gray-700 font-bold">
                        {friend.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>{friend.username}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">None of your friends have liked this event yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;