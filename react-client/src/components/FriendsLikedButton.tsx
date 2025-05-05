// src/components/FriendsLikedButton.tsx
import React, { useState } from 'react';
import { User } from '../types';

interface FriendsLikedButtonProps {
  friends: User[];
  className?: string;
}

const FriendsLikedButton: React.FC<FriendsLikedButtonProps> = ({ friends, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!friends || friends.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Show at most 5 avatars in the preview
  const previewFriends = friends.slice(0, 5);
  const hasMore = friends.length > 5;

  return (
    <div className={`relative ${className}`}>
      {/* Button with friend avatars */}
      <button 
        onClick={toggleExpanded}
        className="flex items-center border border-gray-300 rounded-md py-1 px-2 bg-white hover:bg-gray-50"
      >
        <div className="flex -space-x-2 mr-2">
          {previewFriends.map(friend => (
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
          {hasMore && (
            <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center text-xs font-bold">
              +{friends.length - 5}
            </div>
          )}
        </div>
        <span className="text-xs font-mono">
          {friends.length} liked
        </span>
      </button>

      {/* Expanded list of friends */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md z-10 w-48 max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 font-bold text-sm">
            Friends who liked this
          </div>
          <ul>
            {friends.map(friend => (
              <li key={friend.id} className="flex items-center p-2 hover:bg-gray-100">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                  {friend.profile_picture ? (
                    <img 
                      src={friend.profile_picture} 
                      alt={friend.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-mono">{friend.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FriendsLikedButton;