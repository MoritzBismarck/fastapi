import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../features/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4">The BONE SOCIAL WEB PROJECT</h1>
      
      <hr className="border-gray-400 my-6" />
      
      <h2 className="text-xl font-bold mb-4">Login if you have an account</h2>
      
      <LoginForm />
      
      <p className="mb-6">If you don't have an account yet, find one of our qr codes</p>
      
      <hr className="border-gray-400 my-6" />
      
      <address className="italic mb-4">
        Webmaster: <a href="mailto:webmaster@example.com" className="text-blue-700 underline hover:text-blue-900">info@fickdoomscrolling.com</a><br />
        Last Updated: April 2025
      </address>
    </div>
  );
};

export default Login;