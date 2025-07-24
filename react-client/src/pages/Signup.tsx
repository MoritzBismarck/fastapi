// react-client/src/pages/Signup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { post, get } from '../api/client';
import { useAuth } from '../hooks/useAuth';
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
            <div className="text-red-700 bg-red-100 p-2 text-sm mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-bold">
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
              required
            />
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
              required
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
              required
            />
            <input
              type="password"
              placeholder="confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="
                w-full
                bg-[#f4f4f4]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
              required
            />

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              className="
                font-bold
                bg-[#A59B91]
                border-t-white border-l-white
                border-b-[#9D9086] border-r-[#9D9086]
                text-[#f5ead3]
              "
            >
              {loading ? 'Creating Account...' : 'Enter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;