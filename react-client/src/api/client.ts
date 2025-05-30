import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getStoredToken, removeStoredToken } from '../utils/tokenStorage';

// Create axios instance
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// if (window.location.hostname !== 'localhost' && window.location.protocol === 'https:') {
//   API_URL = API_URL.replace('http:', 'https:');
// }

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// apiClient.interceptors.request.use(config => {
//   // Ensure URLs have a trailing slash for consistent handling
//   if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
//     config.url = `${config.url}/`;
//   }
//   return config;
// });

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors (expired token, etc.)
    if (error.response?.status === 401) {
      // Clear invalid token
      removeStoredToken();
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Generic GET request
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, config);
  return response.data;
};

// Generic POST request
export const post = async <T>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data, config);
  return response.data;
};

// Generic PUT request
export const put = async <T>(
  url: string, 
  data: any, 
  config?: AxiosRequestConfig
): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.put(url, data, config);
  return response.data;
};

// Generic DELETE request
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.delete(url, config);
  return response.data;
};