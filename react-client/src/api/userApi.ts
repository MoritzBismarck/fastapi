import { get, apiClient } from './client';
import { User } from '../types';

export const getCurrentUser = async (): Promise<User> => {
  return get<User>('/users/me');
};

export const getAllUsers = async (): Promise<User[]> => {
  return get<User[]>('/users');
};

export interface UsernameCheckResponse {
  available: boolean;
  username: string;
}

export const checkUsernameAvailability = async (username: string): Promise<UsernameCheckResponse> => {
  const response = await apiClient.get(`/users/check-username/${encodeURIComponent(username)}`);
  return response.data;
};