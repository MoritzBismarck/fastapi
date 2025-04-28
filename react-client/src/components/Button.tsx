// react-client/src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  ariaLabel,
}) => {
  // Base styles for the Windows 95 look
  const baseStyle = 
    'flex items-center justify-center bg-[#c0c0c0] ' +
    'border-t-[2px] border-l-[2px] border-white ' +
    'border-b-[2px] border-r-[2px] border-b-[#808080] border-r-[#808080] ' +
    'active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant styles - primarily affects text color
  const variantClasses = {
    primary: 'text-black',
    secondary: 'text-gray-700',
    danger: 'text-red-600',
  };
  
  // Width style
  const widthClass = fullWidth ? 'w-full' : '';
  
  const combinedClasses = `
    ${baseStyle}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${widthClass}
    ${className}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Button;