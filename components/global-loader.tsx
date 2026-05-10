'use client';

import React, { useState, useEffect } from 'react';

interface GlobalLoaderProps {
  isVisible: boolean;
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ isVisible, message }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure smooth fade-in
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for fade-out animation to complete
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Main loader container - exact styled-components dimensions */}
      <div className="relative w-[200px] h-[60px] mb-6">
        {/* Bouncing circles */}
        <div className="absolute w-5 h-5 bg-white rounded-full left-[15%] animate-bounce-loader shadow-lg"></div>
        <div className="absolute w-5 h-5 bg-white rounded-full left-[45%] animate-bounce-loader-delayed-1 shadow-lg"></div>
        <div className="absolute w-5 h-5 bg-white rounded-full right-[15%] animate-bounce-loader-delayed-2 shadow-lg"></div>
        
        {/* Shadows */}
        <div className="absolute w-5 h-1 bg-black/90 rounded-full left-[15%] top-[62px] blur-[1px] animate-shadow-loader"></div>
        <div className="absolute w-5 h-1 bg-black/90 rounded-full left-[45%] top-[62px] blur-[1px] animate-shadow-loader-delayed-1"></div>
        <div className="absolute w-5 h-1 bg-black/90 rounded-full right-[15%] top-[62px] blur-[1px] animate-shadow-loader-delayed-2"></div>
      </div>
      
      {/* Loading message */}
      {message && (
        <div className="text-white text-sm font-medium animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};

export default GlobalLoader;
