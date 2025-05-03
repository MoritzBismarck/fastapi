// react-client/src/pages/Signup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { post } from '../api/client';
import Button from '../components/Button';

const Signup: React.FC<{ isFirstUser?: boolean }> = ({ isFirstUser = false }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is first user based on path rather than prop
  const isFirstUserPage = location.pathname === '/signup/first-user';
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingFirstUser, setIsCheckingFirstUser] = useState(true);
  
  // Check if this is truly the first user
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch('/api/users/count');
        const data = await response.json();

        if (data.count > 0 && isFirstUserPage) {
          // Redirect to login if the first user already exists
          navigate('/', { state: { error: 'First user already exists. Please log in.' } });
        }
      } catch (err) {
        console.error('Error checking user count:', err);
        setError('Failed to check if this is the first user. Please try again.');
      } finally {
        setIsCheckingFirstUser(false);
      }
    };

    if (isFirstUserPage) {
      checkFirstUser();
    } else {
      setIsCheckingFirstUser(false);
    }
  }, [isFirstUserPage, navigate]);
  
  // Redirect to login if no token is provided and not first user
  useEffect(() => {
    if (!isFirstUserPage && !token) {
      navigate('/', { state: { error: 'Invalid or missing invitation token.' } });
    }
  }, [token, navigate, isFirstUserPage]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
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
      // For the first user, use a special token value
      const effectiveToken = isFirstUserPage ? 'first-user' : token;
      
      // Register user with the token
      await post(`/users/${effectiveToken}`, {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
      
      // Redirect to login page with success message
      navigate('/', { 
        state: { 
          message: isFirstUserPage
            ? 'Admin account created successfully! You can now log in.'
            : 'Registration successful! You can now log in.'
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (isCheckingFirstUser) {
    return (
      <div className="py-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Checking System Status</h1>
        <p className="mb-6">Please wait while we check the system...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isFirstUserPage ? 'Create Administrator Account' : 'Create Your Account'}
      </h1>
      
      <p className="mb-6">
        {isFirstUserPage 
          ? 'You are creating the first administrator account for this system.' 
          : 'You\'ve been invited to join Bone Social!'}
      </p>
      
      {error && (
        <div className="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block mb-1">Username:</label>
          <input 
            id="username"
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-500 p-1 w-full font-mono bg-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block mb-1">Email:</label>
          <input 
            id="email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-500 p-1 w-full font-mono bg-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block mb-1">Password:</label>
          <input 
            id="password"
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-500 p-1 w-full font-mono bg-white"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
        </div>
        
        <div>
          <label htmlFor="confirm-password" className="block mb-1">Confirm Password:</label>
          <input 
            id="confirm-password"
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-500 p-1 w-full font-mono bg-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="first-name" className="block mb-1">First Name (Optional):</label>
          <input 
            id="first-name"
            type="text" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border border-gray-500 p-1 w-full font-mono bg-white"
          />
        </div>
        
        <div>
          <label htmlFor="last-name" className="block mb-1">Last Name (Optional):</label>
          <input 
            id="last-name"
            type="text" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border border-gray-500 p-1 w-full font-mono bg-white"
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={loading}
          fullWidth
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <a 
          href="/" 
          className="text-blue-700 underline hover:text-blue-900"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          Return to Login
        </a>
      </div>
    </div>
  );
};

export default Signup;