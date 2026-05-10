'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/contexts/loading-context';

export const useRouteLoading = () => {
  const pathname = usePathname();
  const { showLoading, hideLoading, isInitialLoad } = useLoading();

  useEffect(() => {
    // Skip route loading on initial load
    if (isInitialLoad) return;

    // Show loading when route starts changing
    const handleRouteChangeStart = () => {
      showLoading('Loading page...');
    };

    // Hide loading when route change completes
    const handleRouteChangeComplete = () => {
      hideLoading();
    };

    // For Next.js App Router, we'll use a timeout to simulate route loading
    // In a real scenario, you might want to use Next.js router events
    handleRouteChangeStart();
    
    const timer = setTimeout(() => {
      handleRouteChangeComplete();
    }, 300); // Reduced timing for better UX

    return () => {
      clearTimeout(timer);
      hideLoading();
    };
  }, [pathname, showLoading, hideLoading, isInitialLoad]);
};

// Custom hook for manual loading control
export const useLoadingControl = () => {
  const { isLoading, loadingMessage, showLoading, hideLoading, setLoading } = useLoading();

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    setLoading,
  };
};
