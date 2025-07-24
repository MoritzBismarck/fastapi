// react-client/src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Header from '../components/Header';

const Login: React.FC = () => {
  // ————— page/first-user state —————
  const [hasUsers, setHasUsers] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // ————— form state & auth hook —————
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading: isAuthLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ————— derived state —————
  const isFormComplete = usernameOrEmail.trim().length > 0 && password.length > 0;
  const canSubmit = isFormComplete && !isAuthLoading;
  
  // ————— error handling from redirects —————
  const [displayError, setDisplayError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if there's an error message from redirect
    const locationState = location.state as { error?: string } | null;
    if (locationState?.error) {
      setDisplayError(locationState.error);
      // Clear the location state to prevent the error from persisting
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/count');
        const { count } = await res.json();
        setHasUsers(count > 0);
      } catch (e) {
        console.error(e);
      } finally {
        setIsPageLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayError(null); // Clear any redirect errors
    try {
      await login({ emailOrUsername: usernameOrEmail, password });
      navigate('/dashboard');
    } catch {
      // error shown by `authError`
    }
  };

  // Combine errors - prefer auth error over redirect error
  const error = authError || displayError;

  // ————— loading or first-user screens —————
  if (isPageLoading) {
    return (
      <p className="font-mono text-center mt-20">Loading…</p>
    );
  }

  if (!hasUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono">
        <div className="bg-yellow-200 border-2 border-black p-6 text-center">
          <p className="font-bold mb-2">New Installation Detected</p>
          <p className="mb-4">Create the first administrator account to get started.</p>
          <a
            href="/signup/first-user"
            className="underline font-bold text-blue-600 hover:text-blue-800"
          >
            Create Admin Account
          </a>
        </div>
      </div>
    );
  }

  // ————— normal login screen —————
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-md px-4">
        <h2 className="text-2xl font-bold text-center mb-4">
          BONE
        </h2>

        {/* card */}
        <div className="bg-[#222] p-6 rounded w-full max-w-sm mx-auto">
          <p className="text-[#f4f4f4] mb-4 font-bold">komm rin...</p>

          {/* Show error at the top of the form */}
          {error && (
            <div className="text-red-700 bg-red-100 p-2 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username or Email"
              value={usernameOrEmail}
              onChange={e => setUsernameOrEmail(e.target.value)}
              className="
                w-full
                bg-[#f4f4f4]
                text-[#2A2A2A]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
                font-bold
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
                bg-[#f4f4f4]
                text-[#2A2A2A]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
                font-bold
              "
              required
            />

          <Button
            type="submit"
            disabled={!canSubmit}           // Disabled when form incomplete or loading
            theme="white"                   // White theme works better on dark background
            fullWidth
            size="lg"
          >
            {isAuthLoading 
              ? 'Processing…' 
              : isFormComplete 
                ? 'Login'               // Exciting text when ready
                : 'Enter credentials'       // Instructional text when not ready
            }
          </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

