'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface AdminNavProps {
  locale: string;
}

export default function AdminNav({ locale }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}/staff`, label: '🔔 STAFF DASHBOARD', isStaff: true },
    { href: `/${locale}/admin`, label: '📊 Dashboard' },
    { href: `/${locale}/admin/categories`, label: '📁 Категории' },
    { href: `/${locale}/admin/products`, label: '🍸 Продукти' },
    { href: `/${locale}/admin/events`, label: '🎉 Събития' },
    { href: `/${locale}/admin/qr`, label: '📱 QR Кодове' },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link href={`/${locale}/admin`} className="flex items-center gap-3">
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
            <span className="text-xl font-bold text-white hidden sm:inline">Admin Panel</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  link.isStaff
                    ? 'bg-white text-black hover:bg-gray-200'
                    : isActive(link.href)
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
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
                  link.isStaff
                    ? 'bg-white text-black'
                    : isActive(link.href)
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

