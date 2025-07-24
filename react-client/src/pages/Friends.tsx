// react-client/src/pages/Friends.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { User, Friendship, MutualFriend, FriendUser, RelationshipStatus } from '../types';
import { del, get, post, put } from '../api/client';

const Friends: React.FC = () => {
  const navigate = useNavigate();
  
  // State for users and friends
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Toggle state - defaults to "suggested" (Suggested for you)
  const [activeTab, setActiveTab] = useState<'suggested' | 'friends' | 'search'>('suggested');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    fetchFriendsData();
  }, []);
  
  // Auto-search when user types (with debounce)
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await get<User[]>(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'search' && searchQuery.trim().length >= 3) {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Set new timeout for search
      const timeout = setTimeout(() => {
        handleSearch();
      }, 500); // 500ms delay
      
      setSearchTimeout(timeout);
    } else if (searchQuery.trim().length < 3) {
      setSearchResults([]);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, activeTab, handleSearch]);
  
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
        
        // Update user in all relevant lists
        const updateUser = (u: User): User => u.id === user.id ? { 
          ...u, 
          relationship: 'request_sent' as RelationshipStatus,
          friendshipId: response.id,
          liked: true 
        } : u;
        
        setUsers(users.map(updateUser));
        setSearchResults(searchResults.map(updateUser));
      } 
      else if (action === 'accept' && user.friendshipId) {
        // Accept friend request
        const response = await put<Friendship>(`/friendships/${user.friendshipId}`, {
          status: 'accepted'
        });
        
        // Remove from users and search results, add to friends list
        setUsers(users.filter(u => u.id !== user.id));
        setSearchResults(searchResults.filter(u => u.id !== user.id));
        setFriends([...friends, {
          id: response.id,
          status: 'accepted',
          created_at: response.created_at,
          updated_at: response.updated_at,
          friend: user as FriendUser
        }]);
      }
      else if (action === 'remove' && user.friendshipId) {
        // Remove friendship
        await del(`/friendships/${user.friendshipId}`);
        
        if (user.relationship === 'friends') {
          // Remove from friends list
          setFriends(friends.filter(f => f.id !== user.friendshipId));
          // Add back to users with 'none' relationship
          const updatedUser: User = { 
            ...user,
            relationship: 'none' as RelationshipStatus, 
            friendshipId: null,
            liked: false 
          };
          setUsers([...users, updatedUser]);
        } else {
          // Just update the user in the lists
          const updateUser = (u: User): User => u.id === user.id ? { 
            ...u, 
            relationship: 'none' as RelationshipStatus, 
            friendshipId: null,
            liked: false 
          } : u;
          
          setUsers(users.map(updateUser));
          setSearchResults(searchResults.map(updateUser));
        }
      }
    } catch (error) {
      console.error('Error handling friend action:', error);
      setError('An error occurred. Please try again.');
    }
  };

  // Helper function to handle friend removal for FriendUser
  const handleFriendRemoval = async (friendUser: FriendUser, friendshipId: number) => {
    try {
      await del(`/friendships/${friendshipId}`);
      
      // Remove from friends list
      setFriends(friends.filter(f => f.id !== friendshipId));
      
      // Convert FriendUser to User and add back to suggested users
      const userAsUser: User = {
        ...friendUser,
        relationship: 'none' as RelationshipStatus,
        liked: false,
        friendshipId: null,
        hasLikedCurrentUser: false,
        recommended: false,
        same_time_join: false
      };
      
      setUsers([...users, userAsUser]);
    } catch (error) {
      console.error('Error removing friendship:', error);
      setError('An error occurred. Please try again.');
    }
  };
  
  // Helper function to determine button text based on relationship
  const getButtonText = (user: User) => {
    switch (user.relationship || 'none') { // Default to 'none' if undefined
      case 'none': 
        return 'Like';
      case 'request_sent': 
        return 'Mog ni mehr';
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
    switch (user.relationship || 'none') { // Default to 'none' if undefined
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
  const getFullName = (user: User | FriendUser) => {
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

  // Helper function to handle profile click for any user type
  const handleProfileClick = (user: User | FriendUser) => {
    navigate(`/profile/${user.id}`);
  };

  // Helper function to handle profile click with event checking for User
  const handleProfileClickWithCheck = (user: User, event: React.MouseEvent) => {
    // Don't navigate if clicking on a button or its children
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    handleProfileClick(user);
  };

  // Helper function to handle profile click with event checking for FriendUser
  const handleFriendProfileClickWithCheck = (user: FriendUser, event: React.MouseEvent) => {
    // Don't navigate if clicking on a button or its children
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    handleProfileClick(user);
  };

  // Render user list component (shared between tabs)
  const renderUserList = (userList: User[], emptyMessage: string) => (
    <>
      {userList.length > 0 ? (
        <ul className="space-y-3">
          {userList.map(user => (
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
        <p className="text-gray-600">{emptyMessage}</p>
      )}
    </>
  );

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      {error && (
        <div className="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
          {error}
        </div>
      )}
      
      {/* Toggle Buttons */}
      <div className="mb-6">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab('suggested')}
            className={`px-1 py-2 font-bold text-lg ${
              activeTab === 'suggested'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Suggested
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-1 py-2 font-bold text-lg ml-6 ${
              activeTab === 'friends'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-1 py-2 font-bold text-lg ml-6 ${
              activeTab === 'search'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Search
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : (
        <>
          {/* Suggested Friends Tab */}
          {activeTab === 'suggested' && (
            <section>
              {renderUserList(users, "No suggested users found.")}
            </section>
          )}
          
          {/* My Friends Tab */}
          {activeTab === 'friends' && (
            <section>
              {friends.length > 0 ? (
                <ul className="space-y-3">
                  {friends.map(friendship => (
                    <li key={friendship.id} className="flex items-center justify-between py-2 hover:bg-gray-50">
                      <div 
                        className="flex items-center flex-1 cursor-pointer pr-4"
                        onClick={(event) => handleFriendProfileClickWithCheck(friendship.friend, event)}
                      >
                        {/* Profile Picture */}
                        <div className="mr-3 w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {friendship.friend.profile_picture ? (
                            <img 
                              src={friendship.friend.profile_picture} 
                              alt={friendship.friend.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '';
                              }}
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
                          
                          {/* Friends since date */}
                          <p className="text-gray-500 text-sm">
                            Friends since {new Date(friendship.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => handleFriendRemoval(friendship.friend, friendship.id)}
                        variant="secondary"
                        className="flex-shrink-0"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">Like each other to become friends!</p>
              )}
            </section>
          )}
          
          {/* Search Tab */}
          {activeTab === 'search' && (
            <section>
              
              {/* Search Input */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by username, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                  <p className="text-gray-500 text-sm mt-1">Type at least 3 characters to search</p>
                )}
                {isSearching && (
                  <p className="text-gray-500 text-sm mt-1">Searching...</p>
                )}
              </div>
              
              {/* Search Results */}
              {searchQuery.trim().length >= 3 && (
                renderUserList(
                  searchResults, 
                  isSearching ? "Searching..." : "No users found matching your search."
                )
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Friends;