// react-client/src/pages/Signup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { post } from '../api/client';
import Button from '../components/Button';
import Header from '../components/Header';

const Signup: React.FC<{ isFirstUser?: boolean }> = ({ isFirstUser = false }) => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch('/api/users/count');
        const data = await response.json();
        if (data.count > 0 && isFirstUserPage) {
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

  useEffect(() => {
    if (!isFirstUserPage && !token) {
      navigate('/', { state: { error: 'Invalid or missing invitation token.' } });
    }
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
      await post(`/users/${effectiveToken}`, {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
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
    <div className="min-h-screen flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-md px-4">
        {/* Centered title + underline, matching login */}
        <Header 
          variant="login" 
          title={isFirstUserPage ? "Create Administrator Account" : "Bone Sozial - Beta"} 
        />

        {/* Card-style form, matching login */}
        <h1 className="text-2xl font-bold text-center mb-4">You have been invited 🎉</h1>
        <div className="bg-[#222] p-6 rounded w-full max-w-sm mx-auto">
          {isFirstUserPage && (
            <p className="text-[#f5ead3] mb-4">Create the first admin account to get started.</p>
          )}
          {!isFirstUserPage && (
            <p className="text-[#f5ead3] mb-4">Create Your Account</p>
          )}

          {error && (
            <div className="text-red-700 bg-red-100 p-2 text-sm mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
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
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
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
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
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
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
              required
            />
            <input
              type="text"
              placeholder="First Name (Optional)"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
            />
            <input
              type="text"
              placeholder="Last Name (Optional)"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
                text-[#222]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        {/* Footer link, matching login */}
        <div className="mt-6 text-center text-[#222] text-sm space-y-1">
          <a
            href="/"
            className="text-blue-700 underline hover:text-blue-900"
            onClick={e => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Return to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
