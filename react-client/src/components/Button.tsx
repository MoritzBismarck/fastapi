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
    'flex items-center justify-center bg-[#A59B91] ' +
    'border-t-2 border-l-2 border-b-2 border-r-2 ' +
    'border-t-[#F9F2E3] border-l-[#F9F2E3] ' + // Cream for top/left
    'border-b-[#2A2A2A] border-r-[#2A2A2A] ' + // Dark for bottom/right
    'active:border-t-[#2A2A2A] active:border-l-[#2A2A2A] active:border-b-[#F9F2E3] active:border-r-[#F9F2E3] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant styles - primarily affects text color
  const variantClasses = {
    primary: 'text-[#F9F2E3]',
    secondary: 'text-black',
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