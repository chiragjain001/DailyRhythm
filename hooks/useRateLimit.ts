"use client";

import { useState, useCallback, useRef } from 'react';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

export function useRateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs, key = 'default' } = options;
  const [isLimited, setIsLimited] = useState(false);
  const requestsRef = useRef<Map<string, number[]>>(new Map());

  const isAllowed = useCallback((requestKey?: string) => {
    const requestId = requestKey || key;
    const now = Date.now();
    const requests = requestsRef.current.get(requestId) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      setIsLimited(true);
      // Auto-reset after window expires
      setTimeout(() => setIsLimited(false), windowMs);
      return false;
    }
    
    validRequests.push(now);
    requestsRef.current.set(requestId, validRequests);
    setIsLimited(false);
    return true;
  }, [maxRequests, windowMs, key]);

  const reset = useCallback((requestKey?: string) => {
    const requestId = requestKey || key;
    requestsRef.current.delete(requestId);
    setIsLimited(false);
  }, [key]);

  return {
    isAllowed,
    isLimited,
    reset
  };
}

// Pre-configured rate limiters for common use cases
export const useAuthRateLimit = () => useRateLimit({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
  key: 'auth'
});

export const useApiRateLimit = () => useRateLimit({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  key: 'api'
});

export const useDatabaseRateLimit = () => useRateLimit({
  maxRequests: 20,
  windowMs: 60000, // 1 minute
  key: 'database'
});
