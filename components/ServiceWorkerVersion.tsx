'use client';

import { useEffect, useState } from 'react';

// Hardcoded version as fallback (should match sw.js CACHE_VERSION)
const FALLBACK_VERSION = 'v3.3.3';

export default function ServiceWorkerVersion() {
  const [version, setVersion] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [swSupported, setSwSupported] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Get version from Service Worker
      navigator.serviceWorker.ready
        .then((registration) => {
          // Request version from active SW
          if (registration.active) {
            registration.active.postMessage({ type: 'GET_VERSION' });
          }
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker not available:', error);
          setSwSupported(false);
          setVersion(FALLBACK_VERSION);
        });

      // Listen for version response
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SW_VERSION') {
          console.log('📦 SW Version received:', event.data.version);
          setVersion(event.data.version);
          setSwSupported(true);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Fallback: If no version received after 3 seconds, use hardcoded version
      const fallbackTimer = setTimeout(() => {
        if (!version) {
          console.warn('⚠️ SW version not received, using fallback');
          setVersion(FALLBACK_VERSION);
          setSwSupported(false);
        }
      }, 3000);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        clearTimeout(fallbackTimer);
      };
    } else {
      // Service Worker not supported at all
      console.warn('⚠️ Service Worker not supported');
      setVersion(FALLBACK_VERSION);
      setSwSupported(false);
    }
  }, [version]);

  // Always show button, even if version is not loaded yet

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[9999] bg-gray-800/90 backdrop-blur-sm text-gray-300 px-3 py-2 rounded-lg text-xs font-mono border border-gray-700 shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="Toggle Service Worker version"
      >
        SW
      </button>

      {/* Version info - shown when toggled */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-[9999] bg-gray-900/95 backdrop-blur-sm text-gray-200 px-4 py-3 rounded-lg text-xs font-mono border border-gray-700 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            {swSupported ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            )}
            <span className="text-gray-400">
              {swSupported ? 'Service Worker' : 'SW Limited'}
            </span>
          </div>
          <div className="text-sm font-semibold text-white">
            {version || 'Loading...'}
          </div>
          {!swSupported && (
            <div className="text-[10px] text-orange-400 mt-2 border-t border-gray-700 pt-2">
              ⚠️ iOS HTTP: SW не работи<br/>
              Offline mode: ограничен
            </div>
          )}
          <div className="text-[10px] text-gray-500 mt-1">
            Tap SW to hide
          </div>
        </div>
      )}
    </>
  );
}

