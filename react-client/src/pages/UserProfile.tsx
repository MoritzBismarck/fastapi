// Create react-client/src/pages/UserProfile.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import MutualFriendsModal from '../components/MutualFriendsModal';
import { UserProfile, MutualFriend } from '../types';
import { getUserProfile } from '../api/friendsApi';
import { sendFriendRequest, updateFriendshipStatus, removeFriendship } from '../api/friendsApi';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showMutualFriendsModal, setShowMutualFriendsModal] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/friends');
      return;
    }

    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const profileData = await getUserProfile(parseInt(userId));
      setUser(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendAction = async (action: 'request' | 'accept' | 'remove') => {
    if (!user) return;

    try {
      setIsActionLoading(true);
      setError(null);

      if (action === 'request') {
        const response = await sendFriendRequest(user.id);
        setUser({
          ...user,
          relationship: 'request_sent',
          friendshipId: response.id
        });
      } else if (action === 'accept' && user.friendshipId) {
        await updateFriendshipStatus(user.friendshipId, 'accepted');
        setUser({
          ...user,
          relationship: 'friends'
        });
      } else if (action === 'remove' && user.friendshipId) {
        await removeFriendship(user.friendshipId);
        setUser({
          ...user,
          relationship: 'none',
          friendshipId: null
        });
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getButtonText = () => {
    if (!user) return '';
    
    switch (user.relationship) {
      case 'none': 
        return 'Send Friend Request';
      case 'request_sent': 
        return 'Cancel Request';
      case 'request_received': 
        return 'Accept Request';
      case 'friends': 
        return 'Remove Friend';
      default: 
        return 'Send Friend Request';
    }
  };

  const getAction = (): 'request' | 'accept' | 'remove' => {
    if (!user) return 'request';
    
    switch (user.relationship) {
      case 'none': 
        return 'request';
      case 'request_sent': 
        return 'remove';
      case 'request_received': 
        return 'accept';
      case 'friends': 
        return 'remove';
      default: 
        return 'request';
    }
  };

  const getFullName = () => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    }
    return '';
  };

  const getMutualFriendsButtonText = () => {
    if (!user?.mutual_friends || user.mutual_friends.length === 0) return '';
    
    if (user.mutual_friends.length === 1) {
      return user.mutual_friends[0].username;
    } else {
      return `${user.mutual_friends[0].username} + ${user.mutual_friends.length - 1} others`;
    }
  };

  if (isLoading) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <div className="p-4 text-center">Loading user profile...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <div className="p-4 text-center text-red-600">
          {error || 'User not found'}
        </div>
        <div className="text-center">
          <Button onClick={() => navigate('/friends')}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/friends')}
          variant="secondary"
          size="sm"
        >
          ← Back
        </Button>
      </div>

      <div className="flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Large Profile Picture */}
        <div className="w-60 h-60 overflow-hidden bg-gray-200 mb-8">
          {user.profile_picture ? (
            <img 
              src={user.profile_picture} 
              alt={user.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-5xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Username */}
        <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
        
        {/* Real Name */}
        {getFullName() && (
          <p className="text-lg text-gray-600 mb-6">{getFullName()}</p>
        )}

        {/* Mutual Friends Button */}
        {getMutualFriendsButtonText() && (
          <div className="mb-6 w-full">
            <Button 
              onClick={() => setShowMutualFriendsModal(true)}
              variant="secondary"
              className="w-full py-3 text-sm"
            >
              Mutuals: {getMutualFriendsButtonText()}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 border border-red-500 text-red-700 bg-red-100 text-sm rounded w-full">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="w-full">
          <Button 
            onClick={() => handleFriendAction(getAction())}
            disabled={isActionLoading}
            variant={user.relationship === 'friends' ? 'danger' : 'primary'}
            className="w-full py-3 text-base font-semibold"
          >
            {isActionLoading ? 'Loading...' : getButtonText()}
          </Button>
        </div>
      </div>

      {/* Mutual Friends Modal */}
      <MutualFriendsModal
        isOpen={showMutualFriendsModal}
        onClose={() => setShowMutualFriendsModal(false)}
        mutualFriends={user?.mutual_friends || []}
        targetUserName={user?.username || ''}
      />
    </div>
  );
};

export default UserProfilePage;