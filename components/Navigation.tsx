'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
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
  ro: {
    home: 'Acasă',
    menu: 'Meniu',
    events: 'Evenimente',
    contact: 'Contact'
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--malts-paper)]/95 backdrop-blur-md border-b border-[var(--malts-hairline)] shadow-sm">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`}>
            <div className="h-20 flex items-center">
              <img 
                src="/malts-logo-landscape.svg" 
                alt="Malt's" 
                className="h-[72px] w-auto md:h-[80px]"
                style={{ aspectRatio: '3.6/1' }}
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 malts-nav-font malts-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium ${
                  isActive(link.href, link.exact)
                    ? 'text-[var(--malts-accent)] border-b-2 border-[var(--malts-accent)]'
                    : 'text-[var(--malts-ink)] hover:text-[var(--malts-accent)]'
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
              className="md:hidden text-[var(--malts-ink)] hover:text-[var(--malts-accent)] p-2"
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
          <div className="md:hidden py-4 border-t border-[var(--malts-hairline)] mt-2 malts-nav-font malts-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-4 rounded-lg transition-colors font-medium ${
                  isActive(link.href, link.exact)
                    ? 'text-[var(--malts-accent)] bg-[var(--malts-accent-tint)] border-l-4 border-[var(--malts-accent)]'
                    : 'text-[var(--malts-ink)] hover:text-[var(--malts-accent)] hover:bg-[var(--malts-card-hover)]'
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
