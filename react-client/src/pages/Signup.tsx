// react-client/src/pages/Signup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { post } from '../api/client';
import Button from '../components/Button';

const Signup: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Redirect to login if no token is provided
  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);
  
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
      // Register user with the token
      await post(`/users/${token}`, {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });
      
      // Redirect to login page with success message
      navigate('/', { state: { message: 'Registration successful! You can now log in.' } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="py-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Your Account</h1>
      
      <p className="mb-6">You've been invited to join Bone Social!</p>
      
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
    </div>
  );
};

export default Signup;