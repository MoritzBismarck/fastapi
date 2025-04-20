import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const { username } = useAuth();

  return (
    <header className="mb-8 border-b border-gray-400 pb-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">The Bone Social Web Project</h1>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-blue-700 underline hover:text-blue-900">
            Home
          </Link>
          <Link to="/friends" className="text-blue-700 underline hover:text-blue-900">
            Friends
          </Link>
          <Link to="/profile" className="text-blue-700 underline hover:text-blue-900">
            {username}
          </Link>
          <div className="mx-2">
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;