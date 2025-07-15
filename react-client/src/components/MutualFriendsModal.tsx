// Create react-client/src/components/MutualFriendsModal.tsx

import React from 'react';
import { MutualFriend } from '../types';
import Button from './Button';

interface MutualFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutualFriends: MutualFriend[];
  targetUserName: string;
}

const MutualFriendsModal: React.FC<MutualFriendsModalProps> = ({
  isOpen,
  onClose,
  mutualFriends,
  targetUserName
}) => {
  if (!isOpen) return null;

  const getFullName = (friend: MutualFriend) => {
    if (friend.first_name && friend.last_name) {
      return `${friend.first_name} ${friend.last_name}`;
    } else if (friend.first_name) {
      return friend.first_name;
    } else if (friend.last_name) {
      return friend.last_name;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex justify-between items-center">
            {/* <h2 className="text-lg font-bold">
              Mutual friends
            </h2> */}
            <h2 className="text-gray-600 font-bold mt-1">
            {mutualFriends.length} mutual friend{mutualFriends.length !== 1 ? 's' : ''}
            </h2>
            <Button 
              onClick={onClose}
              variant="secondary"
              size="sm"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {mutualFriends.map(friend => (
              <div key={friend.id} className="flex items-center space-x-3">
                {/* Profile Picture */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {friend.profile_picture ? (
                    <img 
                      src={friend.profile_picture} 
                      alt={friend.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-bold">{friend.username}</p>
                  {getFullName(friend) && (
                    <p className="text-sm text-gray-600">{getFullName(friend)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="p-4 border-t border-gray-300">
          <Button 
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        </div> */}
      </div>
    </div>
  );
};

export default MutualFriendsModal;