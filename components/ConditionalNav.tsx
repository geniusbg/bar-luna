'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Navigation from '@/components/Navigation';

export default function ConditionalNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  
  // Hide navigation in admin and staff routes
  const isAdminRoute = pathname.includes('/admin') || pathname.includes('/staff');
  
  return (
    <>
      {!isAdminRoute && <Navigation />}
      <div className={isAdminRoute ? '' : 'pt-16'}>
        {children}
      </div>
    </>
  );
}

