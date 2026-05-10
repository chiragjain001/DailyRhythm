'use client';

import React from 'react';
import { useLoadingControl } from '@/hooks/use-route-loading';

// Example component showing how to use the loading system
const LoadingExamples = () => {
  const { showLoading, hideLoading, setLoading, isLoading } = useLoadingControl();

  const handleAsyncOperation = async () => {
    try {
      showLoading('Processing your request...');
      
      // Simulate async operation (API call, data processing, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Operation failed:', error);
    }
  };

  const handleQuickLoading = () => {
    setLoading(true, 'Quick operation...');
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Loading System Examples</h2>
      
      <div className="space-y-2">
        <button
          onClick={handleAsyncOperation}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Simulate Async Operation (2s)
        </button>
        
        <button
          onClick={handleQuickLoading}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Quick Loading (1s)
        </button>
        
        <button
          onClick={() => showLoading('Custom message...')}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Show Loading with Custom Message
        </button>
        
        <button
          onClick={hideLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Hide Loading
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Current loading state: {isLoading ? 'Loading...' : 'Not loading'}</p>
      </div>
    </div>
  );
};

export default LoadingExamples;
