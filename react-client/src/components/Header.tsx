// react-client/src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  variant?: 'default' | 'login';
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  variant = 'default',
  title = 'BONE - Closed Beta',
}) => {
  const { username } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const wrapperClass = variant === 'login' ? 'mb-6' : 'mb-8';
  const hrClass = variant === 'login'
    ? 'border-0 border-t-4 border-black mb-6'
    : 'border-0 border-t-4 border-black mb-6';

  return (
    <header className={wrapperClass}>
      <div className="grid grid-cols-3 items-center px-6 py-4">
        <div className="justify-self-start cursor-pointer">
            <span
              onClick={() => navigate('/dashboard')}
              title="Home"
            >
              <img
                src="/assets/home2.png"
                alt="Home"
                className="w-6 h-6"
              />
            </span>
          </div>
        {/* Left: Brand and Beta label as plain text */}
        <div className="justify-self-center text-center">
          <Link
            to={variant === 'login' ? '/' : '/dashboard'}
            className="text-black hover:text-black visited:text-black focus:text-black active:text-black"
          >
            <span className="text-2xl font-bold leading-tight mr-2">BONE</span>
          </Link>
        </div>

        {/* Profile button on the right, vertically centered */}
        {username && (
          <div className="justify-self-end">
            <span
              onClick={() => navigate('/profile')}
              className="cursor-pointer flex items-center"
              title="Profile"
            >
              <img
                src="/assets/user2.png"
                alt="Profile"
                className="w-6 h-6"
              />
            </span>
          </div>
        )}
      </div>
      <hr className={hrClass} />
    </header>
  );
};

export default Header;
