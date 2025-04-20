import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../features/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Bone Social Web Project</h1>
      
      <p className="mb-4">This is a simple social web platform for demonstration purposes.</p>
      
      <p className="mb-6">The purpose of this website is to demonstrate a minimal and functional design 
      with modern technology under the hood.</p>
      
      <hr className="border-gray-400 my-6" />
      
      <h2 className="text-xl font-bold mb-4">Login</h2>
      
      <LoginForm />
      
      <p className="mb-6">Don't have an account? <Link to="/signup" className="text-blue-700 underline hover:text-blue-900">Create one here</Link>.</p>
      
      <hr className="border-gray-400 my-6" />
      
      <address className="italic mb-4">
        Webmaster: <a href="mailto:webmaster@example.com" className="text-blue-700 underline hover:text-blue-900">webmaster@example.com</a><br />
        Last Updated: April 2025
      </address>
    </div>
  );
};

export default Login;