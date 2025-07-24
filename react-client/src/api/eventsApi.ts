// react-client/src/api/eventsApi.ts - Updated to use types from main types file

import { get as getRequest, post, del, get, put } from './client';
import { Event, ChatMessage, EventChatInfo, SendMessageResponse, CreateMessageRequest, EventUpdate } from '../types';

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

// === CHAT-RELATED API FUNCTIONS ===

// Get event chat info and participants
export const getEventChatInfo = async (eventId: number): Promise<EventChatInfo> => {
  return get(`/events/${eventId}/chat-info`);
};

// Get chat messages for an event
export const getEventMessages = async (eventId: number, limit: number = 50): Promise<ChatMessage[]> => {
  return get(`/events/${eventId}/messages?limit=${limit}`);
};

// Send a message to event chat - now returns the created message
export const sendEventMessage = async (eventId: number, content: string): Promise<SendMessageResponse> => {
  return post(`/events/${eventId}/messages`, { content });
};

export const getUserOwnEvents = async (
  limit: number = 20,
  skip: number = 0
): Promise<Event[]> => {
  const query = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString()
  });
  
  return getRequest<Event[]>(`/events/own?${query}`);
};

export const deleteEvent = async (eventId: number): Promise<void> => {
  return del(`/events/${eventId}`);
};

export const getEventById = async (eventId: number): Promise<Event> => {
  return getRequest<Event>(`/events/${eventId}`);
};

// Update an event
export const updateEvent = async (eventId: number, eventData: EventUpdate): Promise<Event> => {
  return put(`/events/${eventId}`, eventData);
};