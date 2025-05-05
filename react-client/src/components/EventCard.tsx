import React, { useState, useEffect } from 'react';
import { Event, User } from '../types';
import { apiClient } from '../api/client'; // Import your centralized API client

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
  showActionButtons = true,
}) => {
  const [likedByFriends, setLikedByFriends] = useState<User[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch liked_by_friends data using apiClient
  useEffect(() => {
    const fetchLikedByFriends = async () => {
      try {
        const response = await apiClient.get(`/events/${event.id}/detail`);
        setLikedByFriends(response.data.liked_by_friends);
      } catch (error) {
        console.error('Error fetching liked_by_friends:', error);
      }
    };

    fetchLikedByFriends();
  }, [event.id]);

  const formatDateRange = () => {
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : null;
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    let s = start.toLocaleDateString('en-US', opts);
    if (end && end.toDateString() !== start.toDateString()) {
      s += ` – ${end.toLocaleDateString('en-US', opts)}`;
    }
    return s;
  };

  const formatTimeRange = () => {
    if (event.all_day) return 'All day';
    if (!event.start_time) return 'Time not specified';
    return event.end_time
      ? `${event.start_time} – ${event.end_time}`
      : event.start_time;
  };

  const win95Btn =
    'px-4 py-2 flex items-center justify-center text-3xl bg-[#c0c0c0] ' +
    'border-t-[2px] border-l-[2px] border-white ' +
    'border-b-[2px] border-r-[2px] border-b-[#808080] border-r-[#808080] ' +
    'active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white ' +
    'w-24 h-12';

  return (
    <div className="border-4 border-black rounded-none p-6 max-w-md w-full mx-auto bg-white shadow-none flex flex-col">
      {/* IMAGE */}
      {event.image_url && (
        <div className="mb-4 -mx-6 -mt-6 h-64 relative">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover rounded-none border-b-4 border-black"
          />
        </div>
      )}

      {/* TITLE & VENUE */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold uppercase tracking-wide">
          {event.title}
        </h2>
        {event.place && (
          <div className="text-sm font-mono bg-black text-white px-2 py-1">
            {event.place}
          </div>
        )}
      </div>

      {/* WHEN */}
      <div className="mb-4 font-mono">
        <div className="text-sm font-bold mb-1">When:</div>
        <div>{formatDateRange()}</div>
        <div>{formatTimeRange()}</div>
      </div>

      {/* FRIENDS WHO LIKED */}
      {likedByFriends && likedByFriends.length > 0 ? (
        <div className="mb-4">
          <button
            onClick={() => alert(`Liked by: ${likedByFriends.map(friend => friend.username).join(', ')}`)}
            className="text-sm font-bold text-blue-600 underline"
          >
            {likedByFriends.length} {likedByFriends.length === 1 ? 'friend likes this' : 'friends like this'}
          </button>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-500 italic">
          No friends have liked this event yet.
        </div>
      )}

      {/* ACTION BUTTONS (always visible) */}
      {showActionButtons && (
        <div className="flex w-full justify-between px-8 mb-4">
          {onSkip && (
            <button
              onClick={onSkip}
              aria-label="Skip"
              className={win95Btn}
            >
              <span className="text-red-600 font-bold">×</span>
            </button>
          )}
          {onLike && (
            <button
              onClick={onLike}
              aria-label="Like"
              className={win95Btn}
            >
              <span className="text-green-600 font-bold">♥</span>
            </button>
          )}
        </div>
      )}

      {/* EXPANDED-ONLY: description + address */}
      {isExpanded && (
        <>
          <div className="mb-4 font-sans">
            <div className="text-sm font-bold mb-1">Description:</div>
            <p className="whitespace-pre-line">{event.description}</p>
          </div>
        </>
      )}

      {/* SHOW MORE / SHOW LESS */}
      <div className="mt-auto pt-4 border-t-4 border-black text-center">
        <button
          onClick={() => setIsExpanded(x => !x)}
          className="font-bold uppercase tracking-wider"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;