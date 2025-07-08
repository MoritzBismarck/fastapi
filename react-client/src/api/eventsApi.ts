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

// NEW: Get events that the user has matches for
export const getMatchedEvents = async (
  limit: number = 20,
  skip: number = 0
): Promise<Event[]> => {
  const query = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString()
  });
  
  return getRequest<Event[]>(`/events/matches?${query}`);
};

// Like an event
export const likeEvent = async (eventId: number): Promise<void> => {
  return post(`/events/${eventId}/like`, null);
};

// Unlike an event
export const unlikeEvent = async (eventId: number): Promise<void> => {
  return del(`/events/${eventId}/like`);
};

// NEW: RSVP to an event
export const rsvpToEvent = async (eventId: number, status: 'INTERESTED' | 'GOING' | 'CANCELLED'): Promise<void> => {
  return post(`/events/${eventId}/rsvp`, { status });
};

// NEW: Cancel RSVP
export const cancelRSVP = async (eventId: number): Promise<void> => {
  return del(`/events/${eventId}/rsvp`);
};

// NEW: Get RSVPs for an event
export const getEventRSVPs = async (eventId: number, statusFilter?: string): Promise<any[]> => {
  const query = statusFilter ? `?status_filter=${statusFilter}` : '';
  return getRequest<any[]>(`/events/${eventId}/rsvps${query}`);
};