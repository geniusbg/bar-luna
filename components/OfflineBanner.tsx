'use client';

import { useEffect, useState, useRef } from 'react';

interface OfflineBannerProps {
  onStatusChange?: (isBlocked: boolean) => void;
  onBackOnline?: () => void;
}

export default function OfflineBanner({ onStatusChange, onBackOnline }: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Prevent false positives on first load
  const initializedRef = useRef(false); // Use ref for immediate access in handlers

  // Detect iOS
  const isIOS = typeof window !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

  useEffect(() => {
    // Initialize by checking server health immediately (prevents false positives)
    // This is faster and more accurate than waiting fixed time
    const initializeHealthCheck = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(1500) // 1.5 second timeout
        });
        
        if (response.ok) {
          // Server is online - we're initialized immediately
          console.log('✅ Initial health check: Server is online');
          initializedRef.current = true;
          setIsInitialized(true);
          return;
        }
      } catch (error) {
        // Network error - could be SW not ready or real offline
        console.log('⚠️ Initial health check failed, will retry once');
      }
      
      // If first check failed, retry once after brief delay (SW might not be ready)
      setTimeout(async () => {
        try {
          const retryResponse = await fetch('/api/health', {
            method: 'GET',
            cache: 'no-cache',
            signal: AbortSignal.timeout(1500)
          });
          
          if (retryResponse.ok) {
            console.log('✅ Retry health check: Server is online');
          } else {
            console.log('⚠️ Retry health check: Server returned error');
          }
        } catch (error) {
          console.log('⚠️ Retry health check: Still failed (server may be offline)');
        }
        
        // Initialize anyway after retry (ready to detect real offline state)
        initializedRef.current = true;
        setIsInitialized(true);
      }, 800); // Retry after 800ms
    };
    
    initializeHealthCheck();

    // Listen for SW messages (server offline detection)
    const handleMessage = (event: MessageEvent) => {
      // Ignore offline messages until we've confirmed server state
      if (!initializedRef.current) {
        console.log('⏳ Ignoring offline message during initialization');
        return;
      }
      
      if (event.data?.type === 'SERVER_OFFLINE') {
        setIsOffline(true);
        // Check if it's network offline or server down
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          // Network is offline, not server issue
          setIsServerDown(false);
        } else {
          // Network is online but server is down
          setIsServerDown(true);
        }
        setIsChecking(false);
        onStatusChange?.(true);
      }
    };

    // Listen for online/offline events
    const handleOnline = async () => {
      // When network comes back, check if server is actually up
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
          // Server is actually up
          setIsChecking(true);
          onStatusChange?.(false);
          
          // Close modal after 1 second, data will be refreshed on next fetch
          setTimeout(() => {
            setIsOffline(false);
            setIsServerDown(false);
            setIsChecking(false);
          }, 1000);
        } else {
          // Network is up but server is down - stay offline
          setIsOffline(true);
          setIsServerDown(true);
          setIsChecking(false);
        }
      } catch (error) {
        // Server still down even though network is up
        setIsOffline(true);
        setIsServerDown(true);
        setIsChecking(false);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsServerDown(false); // Network is down, not server
      setIsChecking(false);
      onStatusChange?.(true);
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Periodic health check when offline
  useEffect(() => {
    // Don't start health checks until initialized (prevent false positives)
    if (!isInitialized || !isOffline) {
      // Clear any existing interval if going online or not initialized
      return;
    }

    // iOS needs more frequent checks as browser events are unreliable
    const checkInterval = isIOS ? 5000 : 10000; // 5 seconds for iOS, 10 for others
    console.log(`🔄 Starting periodic health check (every ${checkInterval/1000} seconds)`);

    const checkHealth = async () => {
      try {
        console.log('🔍 Health check: Checking server status...');
        // Use cache: 'no-cache' to avoid stale responses
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        console.log('🔍 Health check response:', response.status, response.ok);

        // If we get a 200 OK, server is back online
        if (response.status === 200 && response.ok) {
          console.log('✅ Server is back online!');
          setIsChecking(true);
          setIsServerDown(false);
          onStatusChange?.(false);
          
          // Close modal after 1 second, data will be refreshed on next fetch
          setTimeout(() => {
            setIsOffline(false);
            setIsChecking(false);
          }, 1000);
          return;
        }
        
        // If we get 503 or other error status, server is still down
        console.log('❌ Server still offline (status:', response.status, ')');
        setIsServerDown(true);
      } catch (error) {
        // Network error or timeout - server is still offline
        // This is expected when server is down, so we just continue checking
        console.log('❌ Server still offline (network error)');
        setIsServerDown(true);
      }
    };

    // Check immediately, then at interval
    checkHealth();
    const interval = setInterval(checkHealth, checkInterval);

    return () => {
      console.log('🛑 Stopping periodic health check');
      clearInterval(interval);
    };
  }, [isOffline, onStatusChange, isIOS, isInitialized]);

  // Check initial online state on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Browser is offline on load
      setIsOffline(true);
      setIsServerDown(false); // Network offline, not server
      onStatusChange?.(true);
    }
  }, [onStatusChange]);

  // Expose offline state globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__setOfflineState = (offline: boolean) => {
        if (offline !== isOffline) {
          setIsOffline(offline);
          onStatusChange?.(offline);
        }
      };

      // Expose server down state
      (window as any).__setServerDown = (down: boolean) => {
        setIsServerDown(down);
      };
    }
  }, [onStatusChange, isOffline]);

  if (!isOffline) return null;

  // Show modal that blocks interaction
  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {isChecking ? (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full">
                <svg className="animate-spin h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full">
                <svg className="h-10 w-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            {isChecking 
              ? 'Връзката е възстановена!' 
              : isServerDown 
                ? 'Временен проблем със сървъра' 
                : 'Няма интернет връзка'}
          </h2>

          {/* Message */}
          <p className="text-gray-300 mb-6">
            {isChecking 
              ? 'Вече имате интернет връзка. Приложението е готово за използване.'
              : isServerDown
                ? `Сървърът е временно недостъпен. Приложението проверява автоматично на всеки ${isIOS ? '5' : '10'} секунди дали сървърът е отново онлайн.`
                : 'Моля, проверете интернет връзката си и опитайте отново.'
            }
          </p>

        </div>
      </div>
    </>
  );
}

