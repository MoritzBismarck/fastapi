import axios from 'axios';
import { apiClient } from './client';
import { LoginCredentials, TokenResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Special login method that doesn't use the apiClient (since we don't have a token yet)
export const login = async (credentials: LoginCredentials): Promise<TokenResponse> => {
  // FastAPI OAuth2 expects username/password as form data
  const formData = new URLSearchParams();
  formData.append('username', credentials.emailOrUsername); // FastAPI expects 'username'
  formData.append('password', credentials.password);

  const response = await axios.post(`${API_URL}/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/logout');
};