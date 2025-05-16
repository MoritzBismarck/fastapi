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
  title = 'THE BONE - beta',
}) => {
  const { username } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const wrapperClass = variant === 'login' ? 'mb-6' : 'mb-8';
  const h1Class = variant === 'login'
    ? 'text-3xl font-bold text-center mb-2'
    : 'text-2xl font-bold';
  const hrClass = variant === 'login'
    ? 'border-0 border-t-4 border-black mb-6'
    : 'border-0 border-t-4 border-black mb-6';

  return (
    <header className={wrapperClass}>
      <div className="relative flex items-center justify-center mb-2 min-h-[2.5rem]">
        {/* Profile button on the right */}
        {username && (
          <div className="absolute right-0 text-lg">
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

        {/* Centered title */}
        <h1 className={h1Class + " w-full text-center font-mono text-3xl"}>
          <Link
            to={variant === 'login' ? '/' : '/dashboard'}
            className="text-black hover:text-black visited:text-black focus:text-black active:text-black "
          >
            {title}
          </Link>
        </h1>
      </div>
      <hr className={hrClass} />
    </header>
  );
};
export default Header;
