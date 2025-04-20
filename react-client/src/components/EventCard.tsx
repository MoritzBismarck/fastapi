import React from 'react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onLike?: () => void;
  onSkip?: () => void;
  onUnlike?: () => void;
  showActionButtons?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onLike, 
  onSkip, 
  onUnlike,
  showActionButtons = true
}) => {
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border border-gray-300 rounded p-6 max-w-md w-full mx-auto bg-white shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{event.title}</h2>
        {event.location && (
          <div className="text-sm text-gray-600">{event.location}</div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-bold mb-1">When:</div>
        <div>{formatDate(event.event_date)}</div>
      </div>
      
      <div className="mb-6">
        <div className="text-sm font-bold mb-1">Description:</div>
        <p className="whitespace-pre-line">{event.description}</p>
      </div>
      
      {showActionButtons && (
        <div className="flex justify-between pt-4 border-t border-gray-200">
          {onSkip && (
            <button 
              onClick={onSkip}
              className="border border-red-300 bg-red-50 text-red-800 w-16 h-16 rounded-full text-2xl font-bold hover:bg-red-100"
              aria-label="Skip event"
            >
              X
            </button>
          )}
          
          {onLike && (
            <button 
              onClick={onLike}
              className="border border-green-500 bg-green-100 text-green-800 w-16 h-16 rounded-full text-2xl font-bold hover:bg-green-200"
              aria-label="Like event"
            >
              ♥
            </button>
          )}
          
          {onUnlike && (
            <button 
              onClick={onUnlike}
              className="border border-red-500 bg-red-100 text-red-800 px-6 py-2 rounded hover:bg-red-200"
              aria-label="Unlike event"
            >
              Unlike
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCard;