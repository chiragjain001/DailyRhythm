"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      // Unregister any existing service workers first to avoid conflicts
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.scope.includes('localhost') || registration.scope.includes('127.0.0.1')) {
            console.log('Unregistering old service worker:', registration.scope);
            registration.unregister();
          }
        });
      }).then(() => {
        // Register the new service worker
        return navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        });
      }).then((registration) => {
        console.log('SW registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('New service worker installing...');
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available
                  console.log('New service worker installed, content updated');
                } else {
                  // Content is cached for the first time
                  console.log('Content is cached for offline use');
                }
              }
            });
          }
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message from service worker:', event.data);
        });

      }).catch((error) => {
        console.error('SW registration failed:', error);
      });
    }
  }, []);

  return null;
}
