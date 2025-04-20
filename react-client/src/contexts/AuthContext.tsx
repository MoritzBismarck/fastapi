import React, { createContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { login as apiLogin, logout as apiLogout, LoginCredentials } from '../api/authApi';
import { getCurrentUser } from '../api/userApi';
import { 
  storeToken, 
  storeUsername, 
  // getStoredToken, 
  getStoredUsername, 
  removeStoredToken, 
  removeStoredUsername,
  hasToken
} from '../utils/tokenStorage';

interface AuthContextType {
  user: User | null;
  username: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  username: '',
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (hasToken()) {
        try {
          setIsLoading(true);
          const user = await getCurrentUser();
          setUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error loading user:', error);
          setIsAuthenticated(false);
          removeStoredToken();
          removeStoredUsername();
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiLogin(credentials);
      
      // Store the token
      storeToken(response.access_token);
      storeUsername(credentials.email);
      
      // Set authenticated state
      setIsAuthenticated(true);
      
      // Create a temporary user object until we can fetch the full profile
      setUser({
        id: 0, // This will be updated when we fetch the full profile
        username: getStoredUsername() || credentials.email,
        email: credentials.email
      });
      
      // Fetch the full user profile
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Continue as authenticated even if profile fetch fails
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Call the logout API which will invalidate the token in Redis
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clean up local state even if the API call fails
      removeStoredToken();
      removeStoredUsername();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    username: user?.username || getStoredUsername() || '',
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};