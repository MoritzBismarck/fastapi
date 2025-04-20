import { get as getRequest, post, del } from './client';
import { Event } from '../types';

// Get events that the user hasn't liked yet
export const getEvents = async (
  limit: number = 10,
  skip: number = 0,
  excludeLiked: boolean = true
): Promise<Event[]> => {
  const query = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    exclude_liked: excludeLiked.toString()
  });
  
  return getRequest<Event[]>(`/events?${query}`);
};

// Get events that the user has liked
export const getLikedEvents = async (
  limit: number = 20,
  skip: number = 0
): Promise<Event[]> => {
  const query = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString()
  });
  
  return getRequest<Event[]>(`/events/liked?${query}`);
};

// Like an event
export const likeEvent = async (eventId: number): Promise<void> => {
  return post(`/events/${eventId}/like`, null);
};

// Unlike an event
export const unlikeEvent = async (eventId: number): Promise<void> => {
  return del(`/events/${eventId}/like`);
};