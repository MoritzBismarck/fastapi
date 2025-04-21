// src/pages/Friends.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import { User, Friendship } from '../types';
import { del, get, post, put } from '../api/client'; // Import basic API functions

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
            ...user, // Fix: use 'user' instead of 'u'
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
        return 'Mog ni mehr';
      case 'request_received': 
        return 'Like back';
      case 'friends': 
        return 'Mog ni mehr';
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
      
      <h1 className="text-2xl font-bold mb-6">Friends</h1>
      
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
            <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">People to Friend</h2>
            
            {users.length > 0 ? (
              <ul className="space-y-4">
                {users.map(user => (
                  <li key={user.id} className="border border-gray-300 p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{user.username}</p>
                      {user.relationship === 'request_received' && (
                        <p className="text-sm text-green-700">Sent you a friend request!</p>
                      )}
                    </div>
                    
                    <button 
                      className="border border-gray-500 px-4 py-1 hover:bg-gray-300"
                      onClick={() => handleFriendAction(user, getAction(user))}
                    >
                      {getButtonText(user)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No users found.</p>
            )}
          </section>
          
          {/* My Friends Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">My Friends</h2>
            
            {friends.length > 0 ? (
              <ul className="space-y-4">
                {friends.map(friendship => (
                  <li key={friendship.id} className="border border-gray-300 p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{friendship.friend.username}</p>
                    </div>
                    <button 
                      className="border border-gray-500 bg-red-100 text-red-700 px-4 py-1 hover:bg-red-200"
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
                    </button>
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