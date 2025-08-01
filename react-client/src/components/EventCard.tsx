import React, { useState } from 'react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onLike?: () => void;
  onSkip?: () => void;
  onUnlike?: () => void;
  showActionButtons?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onLike, onSkip, showActionButtons = true }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Format date and time for display
  const formatDateTime = () => {
    const date = new Date(event.start_date);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const timeStr = event.start_time 
      ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`
      : 'All day';

    return { date: dateStr, time: timeStr };
  };

  const { date, time } = formatDateTime();

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Image Container - Vertical aspect ratio */}
      <div className="relative aspect-[3/5] bg-gray-200">
        <img 
          src={event.cover_photo_url || '/placeholder.jpg'} 
          alt={event.title}
          className="w-full h-full object-cover"
        />

        {/* Private Banner - Top Left */}
        {event.visibility === 'FRIENDS' && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
            <span>🔒</span>
            <span>Private</span>
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Details button - More prominent */}
        <button 
          onClick={() => setShowDetails(true)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-medium shadow-lg hover:bg-white transition-all flex items-center gap-2"
        >
          <span>Details</span>
          <span>ℹ️</span>
        </button>
        
        {/* Basic event info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">📍</span>
              <p className="text-base">{event.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <p className="text-base">{date} • {time}</p>
            </div>
          </div>
        </div>
        
        {/* Full details modal overlay */}
        {showDetails && (
          <div className="absolute inset-0 bg-white z-50 overflow-y-auto">
            {/* Header with close button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Details</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Details content */}
            <div className="p-6 space-y-6">
              {/* <div className="relative h-48 rounded-lg overflow-hidden">
                <img 
                  src={event.cover_photo_url || '/placeholder.jpg'} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div> */}

              {/* Title and visibility */}
              {/* <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  event.visibility === 'PRIVATE' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {event.visibility === 'PRIVATE' ? '🔒 Private' : '🌍 Public'}
                </span>
              </div> */}
              
              {/* Time & Date */}
              {/* <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📅</span> When
                </h4>
                <p className="text-gray-700">{date}</p>
                <p className="text-gray-700">{time}</p>
                {event.end_date && event.end_date !== event.start_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    Ends: {new Date(event.end_date).toLocaleDateString()}
                  </p>
                )}
              </div> */}
              
              {/* Location */}
              {/* <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📍</span> Where
                </h4>
                <p className="text-gray-700">{event.location}</p>
              </div> */}
              
              {/* Description */}
              {event.description && (
                <div>
                  {/* <h4 className="font-semibold text-gray-900 mb-2">About</h4> */}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
              
              {/* Interest stats */}
              {(event.interested_count > 0 || event.going_count > 0) && (
                <div className="flex gap-4">
                  {event.going_count > 0 && (
                    <div className="bg-green-50 rounded-lg px-4 py-3 flex-1 text-center">
                      <p className="text-2xl font-bold text-green-600">{event.going_count}</p>
                      <p className="text-sm text-gray-600">Going</p>
                    </div>
                  )}
                  {event.interested_count > 0 && (
                    <div className="bg-blue-50 rounded-lg px-4 py-3 flex-1 text-center">
                      <p className="text-2xl font-bold text-blue-600">{event.interested_count}</p>
                      <p className="text-sm text-gray-600">Interested</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Additional info */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                {event.guest_limit && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Guest Limit</span>
                    <span className="font-medium text-gray-900">{event.guest_limit} people</span>
                  </div>
                )}
                
                {event.rsvp_close_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">RSVP by</span>
                    <span className="font-medium text-gray-900">
                      {new Date(event.rsvp_close_time).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center items-center py-4 space-x-8">
        {showActionButtons && onSkip && (
          <button 
            onClick={onSkip}
            className="hover:scale-110 transition-transform duration-200 active:scale-95"
          >
            <img 
              src="/assets/Skipbutton.png"
              alt="Skip"
              className="w-12 h-12 object-contain"
            />
          </button>
        )}
        
        {showActionButtons && onLike && (
          <button 
            onClick={onLike}
            className="hover:scale-110 transition-transform duration-200 active:scale-95"
          >
            <img 
              src="/assets/Likebutton.png"
              alt="Like"
              className="w-14 h-14 object-contain"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;