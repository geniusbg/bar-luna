'use client';

import { useEffect } from 'react';

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Service Worker update found');
          });
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
      
      // Listen for SW update messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('🔄 New version available:', event.data.version);
          // Automatically reload to get the latest version
          console.log('💡 Reloading to get the latest version...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
      
      // Check for updates periodically (every 15 minutes)
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update();
          }
        });
      }, 900000); // Check every 15 minutes
      
      return () => clearInterval(updateInterval);
    }
  }, []);

  return null; // This component doesn't render anything
}

