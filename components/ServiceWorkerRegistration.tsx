"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Logo } from './logo';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const isDev = process.env.NODE_ENV === 'development';

      // In Development, always unregister SW to prevent cached code blocking updates!
      if (isDev) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => {
            reg.unregister();
            console.log('[DEV MODE]: Service Worker unregistered to disable cache.');
          });
        });
        return;
      }

      // Register the new service worker (Production only)
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
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
                  console.log('New service worker installed, content updated');
                  toast.info(<Logo size="sm" />, {
                    description: 'DailyRhythm Update Ready! Tap reload to activate.',
                    action: {
                      label: 'Reload',
                      onClick: () => window.location.reload(),
                    },
                    duration: Infinity,
                  });
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
