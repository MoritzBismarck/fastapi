// react-client/src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { login, isLoading: isAuthLoading, error } = useAuth();
  const navigate = useNavigate();

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
    try {
      await login({ emailOrUsername: usernameOrEmail, password });
      navigate('/dashboard');
    } catch {
      // error shown by `error`
    }
  };

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
        {/* title + underline */}
        <Header variant="login" />

        {/* card */}
        <div className="bg-[#222] p-6 rounded w-full max-w-sm mx-auto">
          <p className="text-[#f5ead3] mb-4">Have an account?</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username or Email"
              value={usernameOrEmail}
              onChange={e => setUsernameOrEmail(e.target.value)}
              className="
                w-full
                bg-[#E5DCCC]
                text-[#2A2A2A]
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
                text-[#2A2A2A]
                placeholder-[#918880] placeholder-opacity-100
                px-3 py-2
                font-mono
                focus:outline-none
              "
              required
            />

            {error && (
              <div className="text-red-700 bg-red-100 p-2 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isAuthLoading}
              fullWidth
              className="
                font-bold
                bg-[#A59B91]
                border-t-white border-l-white
                border-b-[#9D9086] border-r-[#9D9086]
                text-[#f5ead3]
              "
            >
              {isAuthLoading ? 'Processing…' : 'Login'}
            </Button>
          </form>
        </div>

        {/* footer notes */}
        <div className="mt-6 text-center text-[#222] text-sm space-y-1">
          <p>Beta: Account creation only with invitation</p>
          <p>About: Simple networking with real impact</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

