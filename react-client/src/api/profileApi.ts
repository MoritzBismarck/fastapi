import { apiClient } from './client';
import { User } from '../types';

// Update user profile
export const updateProfile = async (profileData: {
  first_name?: string;
  last_name?: string;
  username?: string;
}): Promise<User> => {
  const response = await apiClient.put('/users/me', profileData);
  return response.data;
};

// Upload profile picture
export const uploadProfilePicture = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/users/me/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};