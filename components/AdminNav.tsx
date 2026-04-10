'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ConfirmModal from '@/components/ConfirmModal';

function buildNavLinks(locale: string, isSuper: boolean) {
  const links = [
    { href: `/${locale}/admin`, label: '📊 Dashboard' },
    { href: `/${locale}/admin/orders`, label: '🧾 Поръчки' },
    { href: `/${locale}/admin/categories`, label: '🗂️ Категории' },
    { href: `/${locale}/admin/products`, label: '🍽️ Продукти' },
    { href: `/${locale}/admin/promotions`, label: '🏷️ Промоции' },
    { href: `/${locale}/admin/events`, label: '🎉 Събития' },
    { href: `/${locale}/admin/qr`, label: '📱 QR Кодове' },
    { href: `/${locale}/admin/users`, label: '👥 Потребители' },
  ];
  if (isSuper) {
    links.splice(links.length - 1, 0, {
      href: `/${locale}/admin/operational-settings`,
      label: '⚙️ Оперативни',
    });
  }
  return links;
}

interface AdminNavProps {
  locale: string;
}

export default function AdminNav({ locale }: AdminNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Don't show nav on login page
  if (pathname?.includes('/login')) {
    return null;
  }

  const isSuper = (session?.user as { role?: string })?.role === 'SUPER_ADMIN';
  const navLinks = buildNavLinks(locale, isSuper);

  const splitEmojiLabel = (label: string) => {
    const trimmed = label.trim();
    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) return { icon: '', text: trimmed };
    return { icon: trimmed.slice(0, firstSpace), text: trimmed.slice(firstSpace + 1) };
  };

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    // Sign out without NextAuth redirect
    await signOut({ redirect: false });

    // Manually redirect to login using current origin
    const currentOrigin = window.location.origin;
    const loginUrl = `${currentOrigin}/${locale}/admin/login`;
    window.location.href = loginUrl;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--malts-paper)]/92 backdrop-blur-md border-b border-[var(--malts-hairline)]">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-1">
          <div className="grid grid-cols-[1fr_auto_1fr] lg:grid-cols-[auto_1fr_auto] items-center gap-3">
          {/* Left: Logo (desktop) */}
          <div className="hidden lg:flex items-center justify-start">
            <Link href={`/${locale}/admin`} className="flex items-center flex-shrink-0">
              <div className="h-20 flex items-center">
                <img
                  src="/malts-logo-landscape.svg"
                  alt="Malt's"
                  className="h-[64px] w-auto max-w-[240px]"
                  style={{ aspectRatio: '3.6/1' }}
                />
              </div>
            </Link>
          </div>

          {/* Center: Logo (mobile) */}
          <div className="lg:hidden flex items-center justify-center">
            <Link href={`/${locale}/admin`} className="flex items-center">
              <div className="h-16 flex items-center">
                <img
                  src="/malts-logo-landscape.svg"
                  alt="Malt's"
                  className="h-[56px] w-auto"
                  style={{ aspectRatio: '3.6/1' }}
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block min-w-0">
            <div className="flex items-center justify-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar py-1">
              {navLinks.map((link) => (
                (() => {
                  const { icon, text } = splitEmojiLabel(link.label);
                  return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-2xl transition-colors text-base font-semibold shrink-0 ${
                    isActive(link.href)
                      ? 'bg-[var(--malts-accent)] text-[#f5f0e6]'
                      : 'text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)]'
                  }`}
                >
                  <span className="flex flex-col items-center justify-center gap-1 leading-tight">
                    {icon ? <span className="text-2xl leading-none">{icon}</span> : null}
                    <span className="text-[15px]">{text}</span>
                  </span>
                </Link>
                  );
                })()
              ))}
            </div>
          </div>

          {/* Right: User menu (desktop) / hamburger (mobile) */}
          <div className="flex items-center justify-end">
            <div className="hidden lg:block relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors border border-[var(--malts-hairline)] bg-[var(--malts-card)] hover:bg-[var(--malts-card-hover)]"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--malts-accent)] text-[#f5f0e6] flex items-center justify-center font-bold text-sm">
                  {(session?.user as any)?.name?.[0] || 'A'}
                </div>
                <span className="text-[var(--malts-ink)] text-sm font-medium hidden xl:block">
                  {(session?.user as any)?.name || 'Admin'}
                </span>
                <svg className="w-3 h-3 text-[var(--malts-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--malts-card)] border border-[var(--malts-hairline)] rounded-xl shadow-xl z-50">
                  <div className="p-4 border-b border-[var(--malts-hairline)]">
                    <p className="text-[var(--malts-ink)] font-semibold">{(session?.user as any)?.name}</p>
                    <p className="text-sm malts-muted">{(session?.user as any)?.email}</p>
                    <span className="mt-2 inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-[var(--malts-accent-tint)] border border-[var(--malts-accent-tint-border)] text-[var(--malts-accent)]">
                      {(session?.user as any)?.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full text-left px-4 py-3 text-[var(--malts-danger)] hover:bg-[var(--malts-accent-tint)] transition-colors flex items-center gap-2"
                  >
                    <span>🚪</span>
                    Изход
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] rounded-xl p-2 transition-colors"
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
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[var(--malts-hairline)] mt-4">
            {navLinks.map((link) => (
              (() => {
                const { icon, text } = splitEmojiLabel(link.label);
                return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-4 px-4 rounded-2xl transition-colors font-semibold mb-2 ${
                  isActive(link.href)
                    ? 'bg-[var(--malts-accent)] text-[#f5f0e6]'
                    : 'text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)]'
                }`}
              >
                <span className="flex flex-col items-center justify-center gap-1 leading-tight">
                  {icon ? <span className="text-2xl leading-none">{icon}</span> : null}
                  <span className="text-[15px]">{text}</span>
                </span>
              </Link>
                );
              })()
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="block w-full text-left py-3 px-4 text-[var(--malts-danger)] transition-colors font-semibold"
            >
              🚪 Изход
            </button>
          </div>
        )}
      </div>
      </nav>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Изход"
        message="Сигурни ли сте, че искате да излезете?"
        confirmLabel="Да, излез"
        cancelLabel="Отказ"
        tone="danger"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await handleLogout();
        }}
      />
    </>
  );
}

