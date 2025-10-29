'use client';

import { useEffect, useState } from 'react';

interface OfflineBannerProps {
  onStatusChange?: (isBlocked: boolean) => void;
  onBackOnline?: () => void;
}

export default function OfflineBanner({ onStatusChange, onBackOnline }: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);

  useEffect(() => {
    // Listen for SW messages (server offline detection)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SERVER_OFFLINE') {
        setIsOffline(true);
        setIsServerDown(true); // Server is down
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
  }, []);

  // Periodic health check when offline
  useEffect(() => {
    if (!isOffline) return;

    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
          setIsChecking(true);
          setIsServerDown(false);
          onStatusChange?.(false);
          
          // Close modal after 1 second, data will be refreshed on next fetch
          setTimeout(() => {
            setIsOffline(false);
            setIsChecking(false);
          }, 1000);
        }
      } catch (error) {
        // Server still offline
      }
    };

    // Check immediately, then every 10 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    return () => clearInterval(interval);
  }, [isOffline, onStatusChange]);

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
                ? 'Сървърът е временно недостъпен. Приложението проверява автоматично на всеки 10 секунди дали сървърът е отново онлайн.'
                : 'Моля, проверете интернет връзката си и опитайте отново.'
            }
          </p>

        </div>
      </div>
    </>
  );
}

