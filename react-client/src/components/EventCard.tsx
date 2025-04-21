// react-client/src/components/EventCard.tsx
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
  // Format the date display
  const formatDateRange = () => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    
    const dateOptions: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    };
    
    // Format the start date
    let formattedDate = startDate.toLocaleDateString('en-US', dateOptions);
    
    // If there's an end date and it's different from the start date
    if (endDate && endDate.toDateString() !== startDate.toDateString()) {
      formattedDate += ` - ${endDate.toLocaleDateString('en-US', dateOptions)}`;
    }
    
    return formattedDate;
  };
  
  // Format the time display
  const formatTimeRange = () => {
    if (event.all_day) {
      return "All day";
    }
    
    let timeStr = "";
    
    if (event.start_time) {
      timeStr = event.start_time;
      
      if (event.end_time) {
        timeStr += ` - ${event.end_time}`;
      }
    }
    
    return timeStr || "Time not specified";
  };
  
  // Format the location display
  const formatLocation = () => {
    if (!event.venue_name && !event.address) {
      return "Location not specified";
    }
    
    if (event.venue_name && event.address) {
      return `${event.venue_name}, ${event.address}`;
    }
    
    return event.venue_name || event.address;
  };

  return (
    <div className="border border-gray-300 rounded p-6 max-w-md w-full mx-auto bg-white shadow-md">
      {/* Display event image if available */}
      {event.image_url && (
        <div className="mb-4 -mx-6 -mt-6">
          <img 
            src={event.image_url} 
            alt={event.title} 
            className="w-full h-64 object-cover rounded-t"
          />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{event.title}</h2>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-bold mb-1">When:</div>
        <div>{formatDateRange()}</div>
        <div>{formatTimeRange()}</div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-bold mb-1">Where:</div>
        <div>{formatLocation()}</div>
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
              className="border border-gray-300 px-6 py-2 rounded hover:bg-gray-100"
              aria-label="Skip event"
            >
              X
            </button>
          )}
          
          {onLike && (
            <button 
              onClick={onLike}
              className="border border-green-500 bg-green-100 text-green-800 px-6 py-2 rounded hover:bg-green-200"
              aria-label="Like event"
            >
              Love
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