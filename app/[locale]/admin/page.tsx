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
  const [securitySettings, setSecuritySettings] = useState({
    id: '',
    approvalOrderThreshold: 5,
    approvalTimeWindowMinutes: 5,
    sessionDurationHours: 3,
    autoRejectMinutes: 30
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(data => {
      setStats(data);
      // Show loading for 2 seconds
      setTimeout(() => {
        setInitialLoading(false);
      }, 2000);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    setSettingsLoading(true);
    fetch('/api/security-settings')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data?.settings) {
          setSecuritySettings({
            id: data.settings.id || '',
            approvalOrderThreshold: data.settings.approvalOrderThreshold ?? 5,
            approvalTimeWindowMinutes: data.settings.approvalTimeWindowMinutes ?? 5,
            sessionDurationHours: data.settings.sessionDurationHours ?? 3,
            autoRejectMinutes: data.settings.autoRejectMinutes ?? 30
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSettingsError('Грешка при зареждане на настройките.');
      })
      .finally(() => {
        if (!isMounted) return;
        setSettingsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSettingsChange = (field: keyof typeof securitySettings, value: number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    setSettingsError(null);
    try {
      const response = await fetch('/api/security-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(securitySettings)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Грешка при записване');
      }

      const data = await response.json();
      if (data.settings) {
        setSecuritySettings({
          id: data.settings.id || '',
          approvalOrderThreshold: data.settings.approvalOrderThreshold ?? securitySettings.approvalOrderThreshold,
          approvalTimeWindowMinutes: data.settings.approvalTimeWindowMinutes ?? securitySettings.approvalTimeWindowMinutes,
          sessionDurationHours: data.settings.sessionDurationHours ?? securitySettings.sessionDurationHours,
          autoRejectMinutes: data.settings.autoRejectMinutes ?? securitySettings.autoRejectMinutes
        });
      }
      setSettingsMessage('Настройките бяха обновени успешно.');
    } catch (error: any) {
      setSettingsError(error?.message || 'Възникна грешка при запазване на настройките.');
    } finally {
      setSavingSettings(false);
    }
  };

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
            href="#security-settings"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🛡️</div>
            <h3 className="text-white font-bold text-lg">Настройки за сигурност</h3>
          </a>
        </div>
      </div>

      {/* Security Settings */}
      <div id="security-settings" className="mt-12">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Настройки за сигурност</h2>
              <p className="text-gray-400 text-sm mt-1">
                Определи след колко поръчки и в какъв период ще се изисква одобрение. Настройките се отразяват веднага.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || savingSettings}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                settingsLoading || savingSettings
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {savingSettings ? 'Запазване...' : 'Запази настройките'}
            </button>
          </div>

          {settingsMessage && (
            <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-200 px-4 py-2">
              {settingsMessage}
            </div>
          )}
          {settingsError && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 px-4 py-2">
              {settingsError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Брой поръчки преди одобрение
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={securitySettings.approvalOrderThreshold}
                onChange={(e) => handleSettingsChange('approvalOrderThreshold', Number(e.target.value))}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <p className="text-xs text-gray-500">Колко поръчки от една маса преди да се изисква одминистратор.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Времеви прозорец (минути)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={securitySettings.approvalTimeWindowMinutes}
                onChange={(e) => handleSettingsChange('approvalTimeWindowMinutes', Number(e.target.value))}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <p className="text-xs text-gray-500">Периодът, в който се броят поръчките (например 5 минути).</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Валидност на сесиите (часове)
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={securitySettings.sessionDurationHours}
                onChange={(e) => handleSettingsChange('sessionDurationHours', Number(e.target.value))}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <p className="text-xs text-gray-500">Колко време QR сесията остава активна след сканиране.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Автоматично отхвърляне (минути)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={securitySettings.autoRejectMinutes}
                onChange={(e) => handleSettingsChange('autoRejectMinutes', Number(e.target.value))}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <p className="text-xs text-gray-500">След колко време чакащите поръчки се отхвърлят автоматично.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


