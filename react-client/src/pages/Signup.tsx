// react-client/src/pages/Signup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { post, get } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useUsernameValidation } from '../hooks/useUsernameValidation'; // ADD THIS
import Button from '../components/Button';
import Header from '../components/Header';

const Signup: React.FC<{ isFirstUser?: boolean }> = ({ isFirstUser = false }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticatedUser } = useAuth();

  const isFirstUserPage = location.pathname === '/signup/first-user';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenDescription, setTokenDescription] = useState('');

  // ADD THIS: Username validation hook
  const { isChecking: isCheckingUsername, isAvailable, error: usernameError, checkUsername } = useUsernameValidation();

  // ————— Form validation for button states —————
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ADD THIS: Username validation function
  const isValidUsername = (username: string): boolean => {
    return username.trim().length >= 3 && isAvailable === true;
  };

  // UPDATE THIS: Include username validation in form completion check
  const isFormComplete = 
    username.trim().length >= 3 &&
    isAvailable === true &&
    !isCheckingUsername &&
    email.trim().length > 0 && 
    isValidEmail(email.trim()) &&
    password.length >= 8 && 
    confirmPassword.length > 0 &&
    password === confirmPassword;

  // UPDATE THIS: Include username validation errors
  const hasValidationErrors = 
    (username.length >= 3 && isAvailable === false) ||
    (email.length > 0 && !isValidEmail(email.trim())) ||
    (password.length > 0 && password.length < 8) ||
    (confirmPassword.length > 0 && password !== confirmPassword);

  // ADD THIS: Handle username changes
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    checkUsername(newUsername);
  };

  useEffect(() => {
    const validateToken = async () => {
      try {
        // For first user page, check if first user already exists
        if (isFirstUserPage) {
          const response = await fetch('/api/users/count');
          const data = await response.json();
          if (data.count > 0) {
            navigate('/', { state: { error: 'First user already exists. Please log in.' } });
            return;
          }
          setTokenValid(true);
          setIsCheckingToken(false);
          return;
        }

        // For regular signup, validate the token
        if (!token) {
          navigate('/', { state: { error: 'Invalid or missing invitation token.' } });
          return;
        }

        try {
          const validationResponse = await get<{
            valid: boolean;
            description?: string;
            message?: string;
          }>(`/invitations/validate/${token}`);
          
          if (validationResponse.valid) {
            setTokenValid(true);
            setTokenDescription(validationResponse.description || '');
          } else {
            navigate('/', { state: { error: 'Invalid invitation token.' } });
          }
        } catch (err: any) {
          // If the API returns 404 or 400, the token is invalid
          const errorMessage = err.response?.data?.detail || 'Invalid or expired invitation token.';
          navigate('/', { state: { error: errorMessage } });
        }
      } catch (err) {
        console.error('Error validating token:', err);
        navigate('/', { state: { error: 'Failed to validate invitation. Please try again.' } });
      } finally {
        setIsCheckingToken(false);
      }
    };

    validateToken();
  }, [token, navigate, isFirstUserPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if form has validation errors
    if (hasValidationErrors || !isFormComplete || isCheckingUsername) {
      if (isAvailable === false) {
        setError('Username is already taken. Please choose another one.');
      } else if (password !== confirmPassword) {
        setError('Passwords do not match');
      } else if (password.length < 8) {
        setError('Password must be at least 8 characters long');
      }
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const effectiveToken = isFirstUserPage ? 'first-user' : token;
      
      const response = await post<{
        user: any;
        access_token: string;
        token_type: string;
      }>(`/users/${effectiveToken}`, {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
      
      // Automatically log in the user
      setAuthenticatedUser(response.access_token, response.user);
      
      // Navigate to dashboard
      navigate('/dashboard', { 
        state: { 
          message: isFirstUserPage
            ? 'Welcome! Your admin account has been created.'
            : 'Welcome! Your account has been created successfully.'
        } 
      });
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-mono">
        <div className="w-full max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4 text-center">Validating Invitation...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  // If token is invalid, don't show the form (user will be redirected)
  if (!tokenValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-md px-4">
        <h1 className="text-2xl font-bold text-center mb-4">
          {isFirstUserPage ? "Create Administrator Account" : "You're invited 🎉"}
        </h1>
        
        {/* Show invitation description if available */}
        {/* {tokenDescription && (
          <p className="text-center text-gray-600 mb-4">
            Invitation: {tokenDescription}
          </p>
        )} */}
        
        <div className="bg-[#222] p-6 rounded w-full max-w-sm mx-auto">
          {isFirstUserPage && (
            <p className="text-[#f5ead3] mb-4">Create the first admin account to get started.</p>
          )}

          {error && (
            <div className="text-red-700 bg-red-100 p-2 text-sm mb-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-bold">
            {/* UPDATED USERNAME INPUT WITH VALIDATION */}
            <input
              type="text"
              placeholder="username (min 3 chars)"
              value={username}
              onChange={handleUsernameChange}
              className={`
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
                border-2
                transition-colors
                ${username.length >= 3 && isAvailable === false
                  ? 'border-red-400 focus:border-red-500'
                  : username.length >= 3 && isAvailable === true
                    ? 'border-green-400 focus:border-green-500'
                    : username.length > 0 && username.length < 3
                      ? 'border-yellow-400 focus:border-yellow-500'
                      : 'border-gray-400 focus:border-blue-500'
                }
              `}
              required
            />

            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
                border-2
                transition-colors
                ${email.length > 0 && !isValidEmail(email.trim())
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-400 focus:border-blue-500'
                }
              `}
              required
            />
            <input
              type="password"
              placeholder="password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
                border-2
                transition-colors
                ${password.length > 0 && password.length < 8 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-400 focus:border-blue-500'
                }
              `}
              required
            />
            <input
              type="password"
              placeholder="confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
                border-2
                transition-colors
                ${confirmPassword.length > 0 && password !== confirmPassword 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-400 focus:border-blue-500'
                }
              `}
              required
            />

            <Button
              type="submit"
              disabled={!isFormComplete || loading || isCheckingUsername}
              inactive={false}
              theme="white"
              fullWidth
              size="lg"
            >
              {loading 
                ? 'Creating Account...' 
                : isCheckingUsername
                  ? 'Checking username...'
                  : hasValidationErrors 
                    ? 'Fix errors above'
                    : isFormComplete 
                      ? 'Enter'
                      : 'Complete all fields'
              }
            </Button>
          </form>

          {/* UPDATED FORM PROGRESS INDICATOR WITH USERNAME VALIDATION */}
          <div className="mt-3 text-sm text-[#f4f4f4] text-center font-bold">
            {!username && 'Enter your username (min 3 characters)'}
            {username && username.length < 3 && 'Username too short (need 3+ characters)'}
            {username && username.length >= 3 && isCheckingUsername && 'Checking if username is available...'}
            {username && username.length >= 3 && !isCheckingUsername && isAvailable === false && 'Username taken - try another'}
            {username && username.length >= 3 && !isCheckingUsername && isAvailable === true && !email && 'Great username! Now enter email'}
            {username && isAvailable === true && email && !isValidEmail(email.trim()) && 'Valid email required (e.g. user@domain.com)'}
            {username && isAvailable === true && email && isValidEmail(email.trim()) && !password && 'Choose a password (min 8 chars)'}
            {username && isAvailable === true && email && isValidEmail(email.trim()) && password && password.length < 8 && 'Password too short'}
            {username && isAvailable === true && email && isValidEmail(email.trim()) && password && password.length >= 8 && !confirmPassword && 'Confirm your password'}
            {username && isAvailable === true && email && isValidEmail(email.trim()) && password && confirmPassword && password !== confirmPassword && 'Passwords don\'t match'}
            {isFormComplete && !loading && 'Ready!'}
            {loading && 'Creating your account...'}
            {usernameError && 'Error checking username - please try again'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;