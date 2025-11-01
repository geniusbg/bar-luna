'use client';

import { useEffect } from 'react';

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker with force update
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then(registration => {
          console.log('✅ Service Worker registered');
          
          // Force immediate update check
          registration.update();
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Service Worker update found');
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✅ New Service Worker installed! Ready to activate.');
                  // Send message to activate immediately
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
      
      // Listen for SW update messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('🔄 New version available:', event.data.version);
        }
      });
      
      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 New Service Worker activated! Reloading page...');
        // Reload once when new SW takes control
        window.location.reload();
      });
      
      // Check for updates periodically (every 1 minute for PWA apps)
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            console.log('🔍 Checking for Service Worker updates...');
            registration.update();
          }
        });
      }, 60000); // Check every 1 minute (more aggressive for PWA)
      
      return () => clearInterval(updateInterval);
    }
  }, []);

  return null; // This component doesn't render anything
}

