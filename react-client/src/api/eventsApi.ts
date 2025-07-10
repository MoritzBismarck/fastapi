import { get as getRequest, post, del, get } from './client';
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

// Get events that the user has matches for
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

// RSVP to an event - UPDATED: Remove INTERESTED option
export const rsvpToEvent = async (eventId: number, status: 'GOING' | 'CANCELLED'): Promise<void> => {
  return post(`/events/${eventId}/rsvp`, { status });
};

// Cancel RSVP
export const cancelRSVP = async (eventId: number): Promise<void> => {
  return del(`/events/${eventId}/rsvp`);
};

// Get RSVPs for an event
export const getEventRSVPs = async (eventId: number, statusFilter?: string): Promise<any[]> => {
  const query = statusFilter ? `?status_filter=${statusFilter}` : '';
  return getRequest<any[]>(`/events/${eventId}/rsvps${query}`);
};

export interface ChatMessage {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  sent_at: string;
}

export interface EventChatInfo {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  cover_photo_url?: string;
  creator?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  match_participants: Array<{
    id: number;
    username: string;
    profile_picture?: string;
    email: string;
  }>;
}

// Get event chat info and participants
export const getEventChatInfo = async (eventId: number): Promise<EventChatInfo> => {
  return get(`/events/${eventId}/chat-info`);
};

// Get chat messages for an event
export const getEventMessages = async (eventId: number, limit: number = 50): Promise<ChatMessage[]> => {
  return get(`/events/${eventId}/messages?limit=${limit}`);
};

// Send a message to event chat
export const sendEventMessage = async (eventId: number, content: string): Promise<void> => {
  return post(`/events/${eventId}/messages`, { content });
};