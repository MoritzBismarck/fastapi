import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      // Error is handled in the auth context
      console.error('Login submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <label htmlFor="email" className="block mb-1">Email:</label>
        <input 
          id="email"
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-500 p-1 w-64 font-mono bg-white"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="password" className="block mb-1">Password:</label>
        <input 
          id="password"
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-500 p-1 w-64 font-mono bg-white"
          required
        />
      </div>
      
      {error && (
        <div className="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
          {error}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Login'}
      </Button>
    </form>
  );
};

export default LoginForm;