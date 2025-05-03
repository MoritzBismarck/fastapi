// react-client/src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { username } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  
  // Function to check if a link is active (current page)
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="mb-8">
      {/* Top row with title and nav links side by side */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">
          <Link to="/dashboard" className="className=text-black hover:text-black visited:text-black focus:text-black active:text-black">
            Bone Sozial
          </Link>
        </h1>
        
        <div className="text-lg">
          <span 
            onClick={() => navigate('/profile')} 
            className="cursor-pointer text-black hover:text-black"
          >
            Profile
          </span>
        </div>
      </div>
      
      <hr className="border-gray-400 mt-2" />
    </header>
  );
};

export default Header;