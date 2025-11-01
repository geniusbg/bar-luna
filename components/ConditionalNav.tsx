'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { SessionProvider } from 'next-auth/react';
import OfflineBanner from '@/components/OfflineBanner';
import ServiceWorkerVersion from '@/components/ServiceWorkerVersion';

export default function ConditionalNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);
  
  // Hide navigation in admin, staff, and order routes
  const hideNav = pathname.includes('/admin') || pathname.includes('/staff') || pathname.includes('/order');
  
  // Use inline function to avoid re-renders
  const handleStatusChange = (blocked: boolean) => {
    setIsOffline(blocked);
    
    // Expose offline state globally for toast hiding
    if (typeof window !== 'undefined') {
      (window as any).__isOffline = blocked;
    }
  };
  
  // Expose offline state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__isOffline = isOffline;
    }
  }, [isOffline]);
  
  return (
    <SessionProvider>
      <OfflineBanner onStatusChange={handleStatusChange} />
      <ServiceWorkerVersion />
      <div className={isOffline ? 'pointer-events-none opacity-50' : ''}>
        {!hideNav && <Navigation />}
        <div className={hideNav ? '' : 'pt-16'}>
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}

