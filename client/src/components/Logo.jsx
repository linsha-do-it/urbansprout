import React from 'react';

const Logo = ({ 
  size = 'md', 
  className = '', 
  showText = false, 
  variant = 'default' 
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  // You can replace this with your actual logo image
  const LogoImage = () => (
    <img
      src="/urbansprout-logo.jpg"
      alt="UrbanSprout Logo"
      className={`${sizeClasses[size]} object-cover ${className}`}
      onError={(e) => {
        // Fallback to emoji if logo image is not found
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'inline-block';
      }}
    />
  );

  // Fallback emoji (will be hidden when logo loads successfully)
  const FallbackEmoji = () => (
    <span 
      className={`${sizeClasses[size]} ${className} flex items-center justify-center text-green-600`}
      style={{ display: 'none' }}
    >
      🌱
    </span>
  );

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <LogoImage />
        <FallbackEmoji />
      </div>
      {showText && (
        <span className={`font-bold text-forest-green-600 ${textSizes[size]}`}>
          UrbanSprout
        </span>
      )}
    </div>
  );
};

export default Logo;
