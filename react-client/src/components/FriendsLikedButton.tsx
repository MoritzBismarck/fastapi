// src/components/FriendsLikedButton.tsx
import React, { useState } from 'react';
import { User } from '../types';

interface FriendsLikedButtonProps {
  friends: User[];
  className?: string;
  onUserClick?: (user: User) => void;
}

const FriendsLikedButton: React.FC<FriendsLikedButtonProps> = ({ 
  friends, 
  className = '',
  onUserClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!friends || friends.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Show at most 6 avatars in the preview
  const previewFriends = friends.slice(0, 6);
  const hasMore = friends.length > 6;

  return (
    <div className={`relative ${className}`}>
      {/* Button with friend avatars */}
      <button 
        onClick={toggleExpanded}
        className="flex items-center p-1 rounded-md bg-white bg-opacity-80 hover:bg-opacity-100 transition-all border border-gray-300 shadow-sm"
      >
        <div className="flex -space-x-2">
          {previewFriends.map((friend, index) => (
            <div 
              key={friend.id} 
              className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm"
              title={friend.username}
            >
              {friend.profile_picture ? (
                <img 
                  src={friend.profile_picture} 
                  alt={friend.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs">
                  {friend.username[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {hasMore && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              +{friends.length - 6}
            </div>
          )}
        </div>
        {friends.length <= 6 && (
          <span className="ml-2 text-xs font-medium text-gray-700">
            {friends.length} liked
          </span>
        )}
      </button>

      {/* Expanded list of friends */}
      {isExpanded && (
        <>
          {/* Click overlay to close */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Modal-like popup */}
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 w-80 max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-200 font-bold text-sm bg-gray-50">
              Friends who liked this ({friends.length})
            </div>
            
            <div className="overflow-y-auto">
              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => {
                    if (onUserClick) {
                      onUserClick(friend);
                    }
                    setIsExpanded(false);
                  }}
                  className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border border-gray-200">
                    {friend.profile_picture ? (
                      <img 
                        src={friend.profile_picture} 
                        alt={friend.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white font-bold">
                        {friend.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-gray-900">{friend.username}</span>
                    {(friend.first_name || friend.last_name) && (
                      <div className="text-xs text-gray-500">
                        {[friend.first_name, friend.last_name].filter(Boolean).join(' ')}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsLikedButton;