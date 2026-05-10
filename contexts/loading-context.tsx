'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { safeStorageWithFallback } from '@/lib/safeStorage';

interface LoadingContextType {
  isLoading: boolean;
  isInitialLoad: boolean;
  loadingMessage?: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoading: (loading: boolean, message?: string) => void;
  setInitialLoadComplete: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();

  // Handle initial page load
  useEffect(() => {
    // Check if this is the first load
    const hasLoadedBefore = safeStorageWithFallback.getItem('app-has-loaded', 'session');
    
    if (!hasLoadedBefore) {
      // First time load - show React loader and hide CSS loader
      setIsLoading(true);
      setLoadingMessage('Loading application...');
      
      // Hide the CSS-based initial loader
      const initialLoader = document.getElementById('initial-loader');
      if (initialLoader) {
        initialLoader.classList.add('hidden');
      }
      
      // Wait for all resources to load
      const handleLoad = () => {
        // Additional delay to ensure all assets are ready
        setTimeout(() => {
          setIsLoading(false);
          setIsInitialLoad(false);
          setLoadingMessage(undefined);
          safeStorageWithFallback.setItem('app-has-loaded', 'true', 'session');
          document.body.classList.add('app-ready');
        }, 800); // Give time for fonts, images, etc.
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    } else {
      // Not first load - hide CSS loader immediately
      setIsInitialLoad(false);
      const initialLoader = document.getElementById('initial-loader');
      if (initialLoader) {
        initialLoader.classList.add('hidden');
      }
      document.body.classList.add('app-ready');
    }
  }, []);

  const showLoading = useCallback((message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setIsLoading(loading);
    setLoadingMessage(loading ? message : undefined);
  }, []);

  const setInitialLoadComplete = useCallback(() => {
    setIsLoading(false);
    setIsInitialLoad(false);
    setLoadingMessage(undefined);
  }, []);

  const value: LoadingContextType = {
    isLoading,
    isInitialLoad,
    loadingMessage,
    showLoading,
    hideLoading,
    setLoading,
    setInitialLoadComplete,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
