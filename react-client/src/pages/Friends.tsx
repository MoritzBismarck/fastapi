// Update react-client/src/pages/Friends.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Button from '../components/Button';
import { User, Friendship, MutualFriend } from '../types';
import { del, get, post, put } from '../api/client';

const Friends: React.FC = () => {
  const navigate = useNavigate();
  // State for users and friends
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchFriendsData();
  }, []);
  
  const fetchFriendsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await get<{users: User[], friends: Friendship[]}>('/users/overview');
      setUsers(response.users);
      setFriends(response.friends);
    } catch (error) {
      console.error('Error fetching friends data:', error);
      setError('Failed to load friends data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle friend request, accepting or removing friendship
  const handleFriendAction = async (user: User, action: 'request' | 'accept' | 'remove') => {
    try {
      if (action === 'request') {
        // Send friend request
        const response = await post<Friendship>('/friendships', {
          addressee_id: user.id
        });
        
        // Update user in the list
        setUsers(users.map(u => 
          u.id === user.id ? { 
            ...u, 
            relationship: 'request_sent',
            friendshipId: response.id,
            liked: true 
          } : u
        ));
      } 
      else if (action === 'accept' && user.friendshipId) {
        // Accept friend request
        const response = await put<Friendship>(`/friendships/${user.friendshipId}`, {
          status: 'accepted'
        });
        
        // Remove from users list and add to friends list
        setUsers(users.filter(u => u.id !== user.id));
        setFriends([...friends, {
          id: response.id,
          status: 'accepted',
          created_at: response.created_at,
          updated_at: response.updated_at,
          friend: user
        }]);
      }
      else if (action === 'remove' && user.friendshipId) {
        // Remove friendship
        await del(`/friendships/${user.friendshipId}`);
        
        if (user.relationship === 'friends') {
          // Remove from friends list
          setFriends(friends.filter(f => f.id !== user.friendshipId));
          // Add back to users with 'none' relationship
          setUsers([...users, { 
            ...user,
            relationship: 'none', 
            friendshipId: null,
            liked: false 
          }]);
        } else {
          // Just update the user in the list
          setUsers(users.map(u => 
            u.id === user.id ? { 
              ...u, 
              relationship: 'none', 
              friendshipId: null,
              liked: false 
            } : u
          ));
        }
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
      setError('An error occurred. Please try again.');
    }
  };
  
  // Helper function to determine button text based on relationship
  const getButtonText = (user: User) => {
    switch (user.relationship) {
      case 'none': 
        return 'Like';
      case 'request_sent': 
        return 'Mog i ni mehr';
      case 'request_received': 
        return 'Like';
      case 'friends': 
        return 'Friends';
      default: 
        return 'Add Friend';
    }
  };
  
  // Helper function to determine action based on relationship
  const getAction = (user: User): 'request' | 'accept' | 'remove' => {
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

  // Helper function to get full name
  const getFullName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    }
    return '';
  };

  // Helper function to get mutual friends text
  const getMutualFriendsText = (mutualFriends?: MutualFriend[]) => {
    if (!mutualFriends || mutualFriends.length === 0) return '';
    
    if (mutualFriends.length === 1) {
      return mutualFriends[0].username;
    } else {
      return `${mutualFriends[0].username} + ${mutualFriends.length - 1} more`;
    }
  };

  // Helper function to handle profile click
  const handleProfileClick = (user: User) => {
    navigate(`/profile/${user.id}`);
  };

  // Helper function to handle profile click with event checking
  const handleProfileClickWithCheck = (user: User, event: React.MouseEvent) => {
    // Don't navigate if clicking on a button or its children
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    handleProfileClick(user);
  };

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      {error && (
        <div className="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : (
        <>
          {/* People to Friend Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">
              Suggested Friends
            </h2>
            
            {users.length > 0 ? (
              <ul className="space-y-3">
                {users.map(user => (
                  <li key={user.id} className="flex items-center justify-between py-2 hover:bg-gray-50">
                    <div 
                      className="flex items-center flex-1 cursor-pointer pr-4"
                      onClick={(event) => handleProfileClickWithCheck(user, event)}
                    >
                      {/* Profile Picture */}
                      <div className="mr-3 w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Username */}
                        <p className="font-semibold text-base truncate">{user.username}</p>
                        
                        {/* Real Name */}
                        {getFullName(user) && (
                          <p className="text-gray-600 text-sm truncate">{getFullName(user)}</p>
                        )}
                        
                        {/* Mutual Friends */}
                        {getMutualFriendsText(user.mutual_friends) && (
                          <p className="text-gray-500 text-sm truncate">
                            Mutual: {getMutualFriendsText(user.mutual_friends)}
                          </p>
                        )}
                        
                        {/* Same Time Join Indicator */}
                        {user.same_time_join && (
                          <p className="text-blue-600 text-xs">Joined around the same time</p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleFriendAction(user, getAction(user))}
                      className="flex-shrink-0"
                    >
                      {getButtonText(user)}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No users found.</p>
            )}
          </section>
          
          {/* My Friends Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">
              Friends{' '}
              <span className="text-base font-medium text-gray-600">
                (You like each other)
              </span>
            </h2>
            
            {friends.length > 0 ? (
              <ul className="space-y-3">
                {friends.map(friendship => (
                  <li key={friendship.id} className="flex items-center justify-between py-2 hover:bg-gray-50">
                    <div 
                      className="flex items-center flex-1 cursor-pointer pr-4"
                      onClick={(event) => handleProfileClickWithCheck(friendship.friend, event)}
                    >
                      {/* Profile Picture */}
                      <div className="mr-3 w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {friendship.friend.profile_picture ? (
                          <img 
                            src={friendship.friend.profile_picture} 
                            alt={friendship.friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-lg">
                            {friendship.friend.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Username */}
                        <p className="font-semibold text-base truncate">{friendship.friend.username}</p>
                        
                        {/* Real Name */}
                        {getFullName(friendship.friend) && (
                          <p className="text-gray-600 text-sm truncate">{getFullName(friendship.friend)}</p>
                        )}
                        
                        {/* Mutual Friends */}
                        {getMutualFriendsText(friendship.friend.mutual_friends) && (
                          <p className="text-gray-500 text-sm truncate">
                            Mutual: {getMutualFriendsText(friendship.friend.mutual_friends)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={() => handleFriendAction(
                        { 
                          ...friendship.friend, 
                          relationship: 'friends', 
                          friendshipId: friendship.id 
                        },
                        'remove'
                      )}
                      className="flex-shrink-0"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">You don't have any friends yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Friends;