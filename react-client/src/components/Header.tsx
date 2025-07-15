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
      <div className="relative flex items-center justify-between mb-2 min-h-[4rem]">
        {/* Left: Brand and Beta label as plain text */}
        <div className="flex items-center font-mono">
          <Link
            to={variant === 'login' ? '/' : '/dashboard'}
            className="text-black hover:text-black visited:text-black focus:text-black active:text-black"
          >
            <span className="text-3xl font-bold leading-tight mr-2">BONE</span>
            <span className="text-base ml-2">Closed Beta</span>
          </Link>
        </div>

        {/* Profile button on the right, vertically centered */}
        {username && (
          <div className="text-lg flex items-center">
            <span
              onClick={() => navigate('/profile')}
              className="cursor-pointer flex items-center"
              title="Profile"
            >
              <img
                src="/assets/profile_icon.png"
                alt="Profile"
                className="w-9 h-9"
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
