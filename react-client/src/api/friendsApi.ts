// src/api/friendsApi.ts
import { get, post, put, del } from './client';
import { Friendship, User, UserProfile } from '../types';

// Interface for the friends overview response
interface FriendsOverview {
  users: User[];
  friends: Friendship[];
}

// Get friends overview (users and current friendships)
export const getFriendsOverview = async (): Promise<FriendsOverview> => {
  return get<FriendsOverview>('/users/overview');
};

// Send a friend request
export const sendFriendRequest = async (addresseeId: number): Promise<Friendship> => {
  return post<Friendship>('/friendships', { addressee_id: addresseeId });
};

// Accept or reject a friend request
export const updateFriendshipStatus = async (
  friendshipId: number, 
  status: 'accepted' | 'rejected'
): Promise<Friendship> => {
  return put<Friendship>(`/friendships/${friendshipId}`, { status });
};

// Remove a friendship
export const removeFriendship = async (friendshipId: number): Promise<void> => {
  return del(`/friendships/${friendshipId}`);
};

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  return get<UserProfile>(`/users/${userId}/profile`);
};