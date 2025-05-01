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
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">The BONE SOCIAL WEB PROJECT</h1>
      
      <hr className="border-gray-400 my-6" />
      
      {isLoading ? (
        <p>Loading...</p>
      ) : !hasUsers ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>It looks like this is a new installation. You need to create the first administrator account.</p>
          <Link to="/signup/first-user" className="underline font-bold">
            Create First Admin Account
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4">Login if you have an account</h2>
          <LoginForm />
          <p className="mb-6">If you don't have an account yet, find one of our qr codes</p>
        </>
      )}
      
      <hr className="border-gray-400 my-6" />
      
      <address className="italic mb-4">
        Webmaster: <a href="mailto:webmaster@example.com" className="text-blue-700 underline hover:text-blue-900">info@fickdoomscrolling.com</a><br />
        Last Updated: April 2025
      </address>
    </div>
  );
};

export default Login;