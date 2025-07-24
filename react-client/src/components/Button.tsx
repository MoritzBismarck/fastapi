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
  theme?: 'classic' | 'white';
  inactive?: boolean; // New prop for subtle inactive state
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
  theme = 'classic',
  inactive = false, // Default to normal/active state
}) => {
  // Theme configurations
  const themes = {
    classic: {
      // Normal/Active state (full prominence)
      face: 'bg-[#c0c0c0]',
      highlight: 'border-t-[#ffffff] border-l-[#ffffff]',
      shadow: 'border-r-[#808080] border-b-[#808080]',
      activeHighlight: 'active:border-t-[#808080] active:border-l-[#808080]',
      activeShadow: 'active:border-r-[#ffffff] active:border-b-[#ffffff]',
      activeFace: 'active:bg-[#c0c0c0]',
      hover: 'hover:bg-[#d4d0c8]',
      focusRing: 'focus:ring-black',
      disabledHover: 'disabled:hover:bg-[#c0c0c0]',
      // Inactive state (subtly dimmed)
      inactiveFace: 'bg-[#b0b0b0]', // Slightly grayer
      inactiveHighlight: 'border-t-[#d0d0d0] border-l-[#d0d0d0]', // Dimmer highlights
      inactiveShadow: 'border-r-[#909090] border-b-[#909090]', // Lighter shadows
      inactiveHover: 'hover:bg-[#b8b8b8]', // Subtle hover
    },
    white: {
      // Normal/Active state (full prominence)
      face: 'bg-[#f4f4f4]',
      highlight: 'border-t-[#ffffff] border-l-[#ffffff]',
      shadow: 'border-r-[#a0a0a0] border-b-[#a0a0a0]',
      activeHighlight: 'active:border-t-[#a0a0a0] active:border-l-[#a0a0a0]',
      activeShadow: 'active:border-r-[#ffffff] active:border-b-[#ffffff]',
      activeFace: 'active:bg-[#e8e8e8]',
      hover: 'hover:bg-[#f8f8f8]',
      focusRing: 'focus:ring-white',
      disabledHover: 'disabled:hover:bg-[#f4f4f4]',
      // Inactive state (subtly dimmed)
      inactiveFace: 'bg-[#e8e8e8]', // Slightly grayer
      inactiveHighlight: 'border-t-[#f0f0f0] border-l-[#f0f0f0]', // Dimmer highlights
      inactiveShadow: 'border-r-[#b8b8b8] border-b-[#b8b8b8]', // Lighter shadows
      inactiveHover: 'hover:bg-[#ececec]', // Subtle hover
    },
  };

  const currentTheme = themes[theme];

  // Choose colors based on state priority: disabled > inactive > normal
  let faceColor, highlightColor, shadowColor, hoverColor;
  
  if (disabled) {
    // Disabled state (most muted)
    faceColor = 'bg-[#a0a0a0]';
    highlightColor = 'border-t-[#c0c0c0] border-l-[#c0c0c0]';
    shadowColor = 'border-r-[#808080] border-b-[#808080]';
    hoverColor = 'hover:bg-[#a0a0a0]'; // No hover change
  } else if (inactive) {
    // Inactive state (subtly dimmed but still usable)
    faceColor = currentTheme.inactiveFace;
    highlightColor = currentTheme.inactiveHighlight;
    shadowColor = currentTheme.inactiveShadow;
    hoverColor = currentTheme.inactiveHover;
  } else {
    // Normal/Active state (full prominence)
    faceColor = currentTheme.face;
    highlightColor = currentTheme.highlight;
    shadowColor = currentTheme.shadow;
    hoverColor = currentTheme.hover;
  }

  // Base styling
  const baseStyle = 
    'flex items-center justify-center font-sans ' +
    `${faceColor} ` +
    'border-2 ' +
    `${highlightColor} ` +
    `${shadowColor} ` +
    'cursor-pointer select-none ' +
    `${currentTheme.activeHighlight} ${currentTheme.activeShadow} ` +
    `${currentTheme.activeFace} ` +
    'active:translate-x-[1px] active:translate-y-[1px] ' +
    `${hoverColor} ` +
    `focus:outline-none focus:ring-1 ${currentTheme.focusRing} focus:ring-inset ` +
    'transition-all duration-150 ' +
    (disabled ? 'opacity-50 cursor-not-allowed' : '');

  // Size variations - Windows 95 typical sizing
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs min-h-[20px]',
    md: 'px-4 py-1 text-sm min-h-[23px]', // Standard Windows 95 button height
    lg: 'px-6 py-2 text-base min-h-[26px]',
  };
  
  // Text styling based on state
  const getTextColor = () => {
    if (disabled) return 'text-gray-600';
    if (inactive) return 'text-gray-700 font-normal'; // Slightly muted text
    return 'text-black font-normal'; // Normal text
  };
  
  const variantClasses = {
    primary: getTextColor(),
    secondary: getTextColor(),
    danger: getTextColor(),
  };
  
  // Width style
  const widthClass = fullWidth ? 'w-full' : 'min-w-[75px]';
  
  const combinedClasses = `
    ${baseStyle}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${widthClass}
    ${className}
  `.replace(/\s+/g, ' ').trim();

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