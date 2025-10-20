'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

// Translations
const translations: Record<string, Record<string, string>> = {
  bg: {
    home: 'Начало',
    menu: 'Меню',
    events: 'Събития',
    contact: 'Контакти'
  },
  en: {
    home: 'Home',
    menu: 'Menu',
    events: 'Events',
    contact: 'Contact'
  },
  de: {
    home: 'Startseite',
    menu: 'Speisekarte',
    events: 'Veranstaltungen',
    contact: 'Kontakt'
  }
};

export default function Navigation() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = translations[locale] || translations.bg;

  const navLinks = [
    { href: `/${locale}`, label: t.home, exact: true },
    { href: `/${locale}/menu`, label: t.menu },
    { href: `/${locale}/events`, label: t.events },
    { href: `/${locale}/contact`, label: t.contact },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`}>
            <div className="h-20 overflow-hidden flex items-center">
              <Image 
                src={`/${locale}/logo_luna2.svg`} 
                alt="L.U.N.A." 
                width={240}
                height={240}
                className="w-auto h-full object-contain"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium ${
                  isActive(link.href, link.exact)
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Language Switcher & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <Suspense fallback={<div className="w-24 h-8"></div>}>
              <LanguageSwitcher />
            </Suspense>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                // X Icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger Icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-4 rounded-lg transition-colors font-medium ${
                  isActive(link.href, link.exact)
                    ? 'text-white bg-white/10 border-l-4 border-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
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
