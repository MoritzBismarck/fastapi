// src/pages/Friends.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Button from '../components/Button'; // Import our new Button component
import { User, Friendship } from '../types';
import { del, get, post, put } from '../api/client';

const Friends: React.FC = () => {
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
      
      // Use the client directly since we haven't created the friendsApi yet
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

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <h1 className="text-2xl font-bold mb-6">Friend Finder</h1>
      
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
              People{' '}
              <span className="text-base font-medium text-gray-600">
                (To discover)
              </span>
            </h2>
            
            {users.length > 0 ? (
              <ul className="space-y-4">
                {users.map(user => (
                  <li key={user.id} className="border border-gray-300 p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {/* Profile Picture */}
                      <div className="mr-3 w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {user.profile_picture ? (
                          <img 
                            src={user.profile_picture} 
                            alt={user.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null; // Prevent infinite loop
                              e.currentTarget.src = ''; // Fallback to empty string
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-bold">{user.username}</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleFriendAction(user, getAction(user))}
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
              <ul className="space-y-4">
                {friends.map(friendship => (
                  <li key={friendship.id} className="border border-gray-300 p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {/* Profile Picture */}
                      <div className="mr-3 w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {friendship.friend.profile_picture ? (
                          <img 
                            src={friendship.friend.profile_picture} 
                            alt={friendship.friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold">
                            {friendship.friend.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <p className="font-bold">{friendship.friend.username}</p>
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