'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface AdminNavProps {
  locale: string;
}

export default function AdminNav({ locale }: AdminNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Don't show nav on login page
  if (pathname?.includes('/login')) {
    return null;
  }

  const navLinks = [
    { href: `/${locale}/admin`, label: '📊 Dashboard' },
    { href: `/${locale}/admin/categories`, label: '📁 Категории' },
    { href: `/${locale}/admin/products`, label: '🍸 Продукти' },
    { href: `/${locale}/admin/events`, label: '🎉 Събития' },
    { href: `/${locale}/admin/qr`, label: '📱 QR Кодове' },
    { href: `/${locale}/admin/users`, label: '👥 Потребители' },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    if (confirm('Сигурни ли сте, че искате да излезете?')) {
      // Sign out without NextAuth redirect
      await signOut({ redirect: false });
      
      // Manually redirect to login using current origin
      const currentOrigin = window.location.origin;
      const loginUrl = `${currentOrigin}/${locale}/admin/login`;
      window.location.href = loginUrl;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}/admin`} className="flex items-center">
            <div className="h-20 overflow-hidden flex items-center">
              <Image 
                src="/bg/logo_luna2.svg" 
                alt="L.U.N.A." 
                width={192}
                height={192}
                className="w-auto h-full object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive(link.href)
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                  {(session?.user as any)?.name?.[0] || 'A'}
                </div>
                <span className="text-white text-sm font-medium hidden lg:block">
                  {(session?.user as any)?.name || 'Admin'}
                </span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-700">
                    <p className="text-white font-semibold">{(session?.user as any)?.name}</p>
                    <p className="text-sm text-gray-400">{(session?.user as any)?.email}</p>
                    <span className="mt-1 inline-block px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-300 hover:text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-800 mt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-4 rounded-lg transition-colors font-medium mb-2 ${
                  isActive(link.href)
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="block w-full text-left py-3 px-4 text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              🚪 Изход
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

