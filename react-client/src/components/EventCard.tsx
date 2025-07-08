import React, { useState } from 'react';
import { Event } from '../types';
import FriendsLikedButton from './FriendsLikedButton';

interface EventCardProps {
  event: Event;
  onLike?: () => void;
  onSkip?: () => void;
  onUnlike?: () => void;
  showActionButtons?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onLike, onSkip, showActionButtons = true }) => {
  const [isShowingDetails, setIsShowingDetails] = useState(false);
  
  const toggleDetails = () => {
    setIsShowingDetails(!isShowingDetails);
  };

  const handleUserClick = (user: any) => {
    // You can add navigation to user profile here if needed
    console.log('User clicked:', user);
  };

  // Format date and time for display
  const formatDateTime = () => {
    const date = new Date(event.start_date);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).replace(',', '');

    if (event.start_time) {
      let timeStr = event.start_time;
      if (event.end_time) {
        timeStr += ` – ${event.end_time}`;
      }
      return { date: dateStr, time: timeStr };
    }
    
    return { date: dateStr, time: 'All day' };
  };

  const { date, time } = formatDateTime();

  return (
    <div className="max-w-sm mx-auto bg-[#C5C5C5] rounded-3xl p-3 shadow-lg border-black border-2">
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 bg-black">
        {/* MAIN IMAGE AREA */}
        <div className="relative">
          <img 
            src={event.cover_photo_url || '/placeholder.jpg'} 
            alt={event.title}
            className="w-full aspect-[3/4] object-cover"
          />
          
          {/* FRIENDS AVATARS OVERLAY - Using the new component */}
          {event.liked_by_friends && event.liked_by_friends.length > 0 && (
            <div className="absolute top-4 left-4">
              <FriendsLikedButton
                friends={event.liked_by_friends}
                onUserClick={handleUserClick}
              />
            </div>
          )}
          
          {/* DATE/TIME OVERLAY */}
          <div className="absolute top-4 right-4 text-right">
            <div className="text-white font-mono text-sm">
              {date}
              <br />
              {time}
            </div>
          </div>
          
          {/* CONTENT OVERLAY - CONDITIONAL BASED ON DETAILS VIEW */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            {!isShowingDetails ? (
              /* TITLE VIEW */
              <>
                <h2 className="text-white text-xl font-bold mb-1">
                  {event.title}
                </h2>
                <p className="text-white text-sm mb-2">
                  📍 {event.location}
                </p>
                {event.description && (
                  <p className="text-white text-sm line-clamp-2">
                    {event.description}
                  </p>
                )}
              </>
            ) : (
              /* DETAILS VIEW */
              <div className="text-white">
                <div className="mb-2">
                  <div className="font-bold text-sm uppercase">Title:</div>
                  <div className="text-lg font-bold">{event.title}</div>
                </div>
                
                <div className="mb-2">
                  <div className="font-bold text-sm uppercase">When:</div>
                  <div>{date}</div>
                  <div>{time}</div>
                </div>
                
                <div className="mb-2">
                  <div className="font-bold text-sm uppercase">Location:</div>
                  <div>{event.location}</div>
                </div>
                
                <div className="mb-2">
                  <div className="font-bold text-sm uppercase">About:</div>
                  <p className="text-sm whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                {/* Show guest info if available */}
                {(event.interested_count > 0 || event.going_count > 0) && (
                  <div className="mb-2">
                    <div className="font-bold text-sm uppercase">Interest:</div>
                    <div className="text-sm">
                      {event.going_count} going, {event.interested_count} interested
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CONTROL BUTTONS */}
      <div className="flex justify-between items-center mt-4 px-6">
        {/* SKIP BUTTON */}
        {showActionButtons && onSkip && (
          <button 
            onClick={onSkip}
            className="w-16 h-16 rounded-full bg-[#9e2755] flex items-center justify-center shadow-md hover:brightness-110"
            aria-label="Skip"
          >
            <span className="text-white text-2xl font-bold">×</span>
          </button>
        )}
        
        {/* DETAILS BUTTON */}
        <button 
          onClick={toggleDetails}
          className="w-20 h-6 bg-[#A8A8A8] border-2 border-t-white border-l-white border-b-[#666] border-r-[#666] rounded-md flex items-center justify-center shadow-md active:translate-y-[1px] active:shadow-sm transition-all"
        >
          <span className="text-gray-700 text-sm font-medium">
            {isShowingDetails ? 'Back' : 'Details'}
          </span>
        </button>
        
        {/* LIKE BUTTON */}
        {showActionButtons && onLike && (
          <button 
            onClick={onLike}
            className="w-16 h-16 rounded-full bg-[#19a36f] flex items-center justify-center shadow-md hover:brightness-110"
            aria-label="Like"
          >
            <span className="text-white text-2xl">♥</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;