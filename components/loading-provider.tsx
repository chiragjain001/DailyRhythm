'use client';

import React, { ReactNode } from 'react';
import { LoadingProvider } from '@/contexts/loading-context';
import GlobalLoader from './global-loader';
import { useLoading } from '@/contexts/loading-context';

interface LoadingWrapperProps {
  children: ReactNode;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ children }) => {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <>
      {children}
      <GlobalLoader isVisible={isLoading} message={loadingMessage} />
    </>
  );
};

const AppLoadingProvider: React.FC<LoadingWrapperProps> = ({ children }) => {
  return (
    <LoadingProvider>
      <LoadingWrapper>
        {children}
      </LoadingWrapper>
    </LoadingProvider>
  );
};

export default AppLoadingProvider;
