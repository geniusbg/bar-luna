'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function AdminDashboard({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { data: session, status } = useSession();
  
  // Redirect if not authenticated or wrong role
  useEffect(() => {
    // Don't redirect if offline - offline banner will handle it
    if (typeof window !== 'undefined' && (window as any).__isOffline) {
      return;
    }
    
    if (status === 'unauthenticated') {
      // Small delay to allow SW offline message to arrive
      const timer = setTimeout(() => {
        // Check again if still not offline (race condition with SW message)
        if (typeof window !== 'undefined' && !(window as any).__isOffline) {
          window.location.href = `/${locale}/admin/login`;
        }
      }, 100); // 100ms delay
      return () => clearTimeout(timer);
    }
    
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any)?.role;
      if (userRole === 'STAFF') {
        window.location.href = `/${locale}/staff`;
      }
    }
  }, [status, session, locale]);

  // Prevent back button after logout
  useEffect(() => {
    const handlePopState = (e: any) => {
      // Don't redirect if offline
      if (typeof window !== 'undefined' && (window as any).__isOffline) {
        return;
      }
      
      if (!session) {
        window.history.pushState(null, '', window.location.href);
        window.location.href = `/${locale}/admin/login`;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session, locale]);

  const [stats, setStats] = useState({ categories: 0, products: 0, events: 0 });
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(data => {
      setStats(data);
      // Show loading for 2 seconds
      setTimeout(() => {
        setInitialLoading(false);
      }, 2000);
    });
  }, []);

  // Show loading while checking session or initial loading
  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="logo-container h-64 w-64 md:h-96 md:w-96 mx-auto mb-10 animate-pulse-glow">
            <Image 
              src="/bg/luna-logo.svg"
              alt="LUNA Logo" 
              width={384}
              height={384}
              className="h-64 w-64 md:h-96 md:w-96"
              priority
            />
          </div>
          <p className="text-white text-3xl font-medium">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Админ Панел</h1>
        <p className="text-gray-400 text-lg">Управление на LUNA Bar</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/bg/admin/categories"
          className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-3">Категории</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{stats.categories}</p>
            </div>
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">📁</div>
          </div>
        </a>

        <a
          href="/bg/admin/products"
          className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-3">Продукти</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{stats.products}</p>
            </div>
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🍸</div>
          </div>
        </a>

        <a
          href="/bg/admin/events"
          className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 sm:col-span-2 lg:col-span-1 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-3">Събития</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{stats.events}</p>
            </div>
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🎉</div>
          </div>
        </a>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Бързи действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/bg/admin/products/new"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🍸</div>
            <h3 className="text-white font-bold text-lg">Добави продукт</h3>
          </a>
          <a
            href="/bg/admin/events/new"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🎉</div>
            <h3 className="text-white font-bold text-lg">Добави събитие</h3>
          </a>
          <a
            href="/bg/admin/categories"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">📁</div>
            <h3 className="text-white font-bold text-lg">Категории</h3>
          </a>
          <a
            href="/bg/admin/qr"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">📱</div>
            <h3 className="text-white font-bold text-lg">QR Кодове</h3>
          </a>
          <a
            href="/bg/admin/working-hours"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🕐</div>
            <h3 className="text-white font-bold text-lg">Работно време</h3>
          </a>
          <a
            href="/bg/admin/security-settings"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🛡️</div>
            <h3 className="text-white font-bold text-lg">Настройки за сигурност</h3>
          </a>
        </div>
      </div>
    </div>
  );
}


