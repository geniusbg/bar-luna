'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Navigation from '@/components/Navigation';

export default function ConditionalNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  
  // Hide navigation in admin, staff, and order routes
  const hideNav = pathname.includes('/admin') || pathname.includes('/staff') || pathname.includes('/order');
  
  return (
    <>
      {!hideNav && <Navigation />}
      <div className={hideNav ? '' : 'pt-16'}>
        {children}
      </div>
    </>
  );
}

