// Create react-client/src/hooks/useUsernameValidation.ts

import { useState, useEffect, useCallback } from 'react';
import { checkUsernameAvailability } from '../api/userApi';

interface UseUsernameValidationReturn {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
  checkUsername: (username: string) => void;
}

export const useUsernameValidation = (debounceMs: number = 500): UseUsernameValidationReturn => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setIsAvailable(null);
        setError(null);
        return;
      }

      setIsChecking(true);
      setError(null);
      
      try {
        const response = await checkUsernameAvailability(username);
        setIsAvailable(response.available);
      } catch (err) {
        setError('Failed to check username availability');
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, debounceMs),
    [debounceMs]
  );

  return {
    isChecking,
    isAvailable,
    error,
    checkUsername
  };
};

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}