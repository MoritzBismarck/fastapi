// In react-client/src/pages/Login.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../features/auth/LoginForm';

const Login: React.FC = () => {
  const [hasUsers, setHasUsers] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if there are any users in the system
    const checkUsers = async () => {
      try {
        const response = await fetch('/api/users/count');
        const data = await response.json();
        setHasUsers(data.count > 0);
      } catch (err) {
        console.error('Error checking user count:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUsers();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-300 text-black font-mono flex flex-col items-center justify-center">
      <div className="w-full max-w-md border-4 border-black bg-white p-6">
        <h1 className="text-4xl font-bold text-center mb-4 border-b-4 border-black pb-2">Bone Sozial</h1>
        <p className="text-center mb-6">Beta Release</p>

        {isLoading ? (
          <p className="text-lg font-bold text-center">Loading...</p>
        ) : !hasUsers ? (
          <div className="bg-yellow-200 border-2 border-black text-black px-4 py-3 mb-4 text-center">
            <p className="font-bold mb-2">New Installation Detected</p>
            <p className="mb-4">Create the first administrator account to get started.</p>
            <Link to="/signup/first-user" className="underline font-bold text-blue-600 hover:text-blue-800">
              Create Admin Account
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Login</h2>
            <div className="bg-gray-100 border-2 border-black p-4">
              <LoginForm />
            </div>
            <p className="mt-4 text-center">Account creation only with invitation</p>
          </>
        )}
      </div>

      <footer className="mt-6 text-center">
        <hr className="border-black w-full mb-4" />
        <address className="italic">
          CONNECTION: <span className="font-bold">bone-social.com</span>
        </address>
      </footer>
    </div>
  );
};

export default Login;