// Key for storing JWT token in localStorage
const TOKEN_KEY = 'authToken';
const USERNAME_KEY = 'username';

// Store token in localStorage
export const storeToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Store username in localStorage
export const storeUsername = (username: string): void => {
  localStorage.setItem(USERNAME_KEY, username);
};

// Get token from localStorage
export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get username from localStorage
export const getStoredUsername = (): string | null => {
  return localStorage.getItem(USERNAME_KEY);
};

// Remove token from localStorage
export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Remove username from localStorage
export const removeStoredUsername = (): void => {
  localStorage.removeItem(USERNAME_KEY);
};

// Check if a token exists
export const hasToken = (): boolean => {
  return !!getStoredToken();
};