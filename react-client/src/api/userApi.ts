import { get } from './client';
import { User } from '../types';

export const getCurrentUser = async (): Promise<User> => {
  return get<User>('/users/me');
};

export const getAllUsers = async (): Promise<User[]> => {
  return get<User[]>('/users');
};