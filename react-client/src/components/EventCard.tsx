import React, { useState } from 'react';
import { Event } from '../types';
import Button from './Button';

interface EventCardProps {
  event: Event;
  onLike?: () => void;
  onSkip?: () => void;
  onUnlike?: () => void;
  showActionButtons?: boolean;
  fitToViewport?: boolean; // New prop to enable viewport fitting
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onLike, 
  onSkip, 
  showActionButtons = true, 
  fitToViewport = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Helper function to check if description exists and is not empty
  const hasDescription = (description: string | null | undefined): boolean => {
    return !!(description && description.trim().length > 0);
  };

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

  // Choose container classes based on fitToViewport prop
  const containerClasses = fitToViewport 
    ? "w-full h-full max-h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden"
    : "max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Image Container - Responsive height based on viewport fitting */}
      <div className={`relative bg-gray-200 ${
        fitToViewport 
          ? "flex-1 min-h-0" // Takes available space, but leaves room for buttons
          : "aspect-[3/5]" // Fixed aspect ratio for normal view
      }`}>
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
        
        {/* Details button - Only show if there's a description */}
        {hasDescription(event.description) && (
          <div className="absolute top-4 right-4">
            <Button
              onClick={() => setShowDetails(true)}
              size="sm"
              variant="primary"
              theme="white"
              className="bg-white/90 backdrop-blur-sm shadow-lg"
              ariaLabel="View event details"
            >
              <span>ℹ️</span>
            </Button>
          </div>
        )}
        
        {/* Basic event info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="text-white">
            <h2 className={`font-bold mb-2 ${fitToViewport ? 'text-xl' : 'text-2xl'}`}>
              {event.title}
            </h2>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">📍</span>
              <p className={`${fitToViewport ? 'text-sm' : 'text-base'} truncate`}>
                {event.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <p className={`${fitToViewport ? 'text-sm' : 'text-base'}`}>
                {date} • {time}
              </p>
            </div>
          </div>
        </div>
        
        {/* Full details modal overlay */}
        {showDetails && (
          <div className="absolute inset-0 bg-white z-50 overflow-y-auto">
            {/* Header with close button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Details</h3>
              <Button
                onClick={() => setShowDetails(false)}
                size="sm"
                variant="secondary"
                theme="white"
                className="w-10 h-10"
                ariaLabel="Close details"
              >
                ✕
              </Button>
            </div>
            
            {/* Details content */}
            <div className="p-6 space-y-6">
              {/* Description - Only show if it exists */}
              {hasDescription(event.description) && (
                <div>
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
                    <span className="font-medium">{event.guest_limit}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons - Only show when enabled */}
      {showActionButtons && (onLike || onSkip) && (
        <div className={`flex gap-4 ${fitToViewport ? 'p-4' : 'p-6'}`}>
          {onSkip && (
            <Button
              onClick={onSkip}
              size="lg"
              variant="secondary"
              fullWidth={true}
              className="flex-1"
            >
              <span className="mr-2">⏭️</span>
            </Button>
          )}
          {onLike && (
            <Button
              onClick={onLike}
              size="lg"
              variant="primary"
              fullWidth={true}
              className="flex-1"
            >
              <span className="mr-2">❤️</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCard;