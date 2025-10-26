'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface StaffNavProps {
  locale: string;
}

export default function StaffNav({ locale }: StaffNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Don't show nav on login page
  if (pathname?.includes('/login')) {
    return null;
  }

  const handleLogout = async () => {
    if (confirm('Сигурни ли сте, че искате да излезете?')) {
      await signOut({ redirect: false });
      
      const currentOrigin = window.location.origin;
      const loginUrl = `${currentOrigin}/${locale}/staff/login`;
      window.location.href = loginUrl;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link href={`/${locale}/staff`} className="flex items-center gap-3">
            <div className="h-16 overflow-hidden flex items-center">
              <Image 
                src="/bg/logo_luna2.svg" 
                alt="L.U.N.A." 
                width={192}
                height={192}
                className="w-auto h-full object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">Staff Dashboard</span>
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                {(session?.user as any)?.name?.[0] || 'S'}
              </div>
              <span className="text-white font-medium hidden sm:block">
                {(session?.user as any)?.name || 'Staff'}
              </span>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                <div className="p-4 border-b border-gray-700">
                  <p className="text-white font-semibold">{(session?.user as any)?.name}</p>
                  <p className="text-sm text-gray-400">{(session?.user as any)?.email}</p>
                  <span className="mt-1 inline-block px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                    {(session?.user as any)?.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <span>🚪</span>
                  Изход
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

