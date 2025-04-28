// react-client/src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { username } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Function to check if a link is active (current page)
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="mb-8">
      {/* Top row with title and nav links side by side */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-2">
        <h1 className="text-2xl font-bold">The Bone Social Web Project</h1>
        
        {/* Hamburger menu for mobile */}
        <button 
          className="lg:hidden border border-gray-500 px-2 py-1 self-end mt-2" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-0.5 bg-black mb-1"></div>
          <div className="w-6 h-0.5 bg-black mb-1"></div>
          <div className="w-6 h-0.5 bg-black"></div>
        </button>
        
        {/* Desktop navigation with pipes */}
        <nav className="hidden lg:block">
          <div className="text-lg">
            <Link 
              to="/dashboard" 
              className={`${isActive('/dashboard') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Home
            </Link>
            <span className="mx-2 text-black">|</span>
            <Link 
              to="/friends" 
              className={`${isActive('/friends') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Friends
            </Link>
            <span className="mx-2 text-black">|</span>
            <Link 
              to="/profile" 
              className={`${isActive('/profile') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              {username}
            </Link>
            <span className="mx-2 text-black">|</span>
            <Link 
              to="/design-test" 
              className={`${isActive('/design-test') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Design Lab
            </Link>
          </div>
        </nav>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-b border-gray-400 py-2">
          <div className="flex flex-col space-y-2">
            <Link 
              to="/dashboard" 
              onClick={toggleMenu} 
              className={`${isActive('/dashboard') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Home
            </Link>
            <Link 
              to="/events" 
              onClick={toggleMenu} 
              className={`${isActive('/events') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Events
            </Link>
            <Link 
              to="/friends" 
              onClick={toggleMenu} 
              className={`${isActive('/friends') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Friends
            </Link>
            <Link 
              to="/profile" 
              onClick={toggleMenu} 
              className={`${isActive('/profile') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              {username}
            </Link>
            <Link 
              to="/notifications" 
              onClick={toggleMenu} 
              className={`${isActive('/notifications') ? 'text-purple-700' : 'text-blue-700'} underline`}
            >
              Notifications
            </Link>
          </div>
        </nav>
      )}
      <hr className="border-gray-400 mt-2" />
    </header>
  );
};

export default Header;