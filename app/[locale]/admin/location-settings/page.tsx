'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LocationSettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__isOffline) {
      return;
    }
    
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && !(window as any).__isOffline) {
          window.location.href = `/${locale}/admin/login`;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any)?.role;
      if (userRole === 'STAFF') {
        window.location.href = `/${locale}/staff`;
      }
    }
  }, [status, session, locale]);

  const [locationSettings, setLocationSettings] = useState({
    id: '',
    addressBg: '',
    addressEn: '',
    addressDe: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setSettingsLoading(true);
    fetch('/api/location-settings')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data?.settings) {
          setLocationSettings({
            id: data.settings.id || '',
            addressBg: data.settings.addressBg || '',
            addressEn: data.settings.addressEn || '',
            addressDe: data.settings.addressDe || ''
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

  const handleSettingsChange = (field: keyof typeof locationSettings, value: string) => {
    setLocationSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setSettingsMessage(null);
    setSettingsError(null);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    setSettingsError(null);

    try {
      const response = await fetch('/api/location-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressBg: locationSettings.addressBg,
          addressEn: locationSettings.addressEn,
          addressDe: locationSettings.addressDe
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSettingsMessage('Настройките са запазени успешно!');
        setLocationSettings({
          id: data.settings.id || locationSettings.id,
          addressBg: data.settings.addressBg ?? locationSettings.addressBg,
          addressEn: data.settings.addressEn ?? locationSettings.addressEn,
          addressDe: data.settings.addressDe ?? locationSettings.addressDe
        });
        setTimeout(() => setSettingsMessage(null), 3000);
      } else {
        setSettingsError(data.error || 'Грешка при запазване на настройките.');
      }
    } catch (error) {
      setSettingsError('Грешка при връзка със сървъра.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (status === 'loading' || settingsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${locale}/admin`)}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <span>←</span>
            <span>Назад към Dashboard</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Адрес</h1>
          <p className="text-gray-400 mt-2">
            Настрой адреса на заведението за всички езици. Адресът се показва на главната страница.
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Адрес по езици</h2>
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

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Адрес (Български)
              </label>
              <input
                type="text"
                value={locationSettings.addressBg}
                onChange={(e) => handleSettingsChange('addressBg', e.target.value)}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Русе, ул. Александровска 97"
              />
              <p className="text-xs text-gray-500">Адресът който се показва на българската версия на сайта.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Address (English)
              </label>
              <input
                type="text"
                value={locationSettings.addressEn}
                onChange={(e) => handleSettingsChange('addressEn', e.target.value)}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Ruse, 97 Alexandrovska St"
              />
              <p className="text-xs text-gray-500">The address displayed on the English version of the site.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                Adresse (Deutsch)
              </label>
              <input
                type="text"
                value={locationSettings.addressDe}
                onChange={(e) => handleSettingsChange('addressDe', e.target.value)}
                disabled={settingsLoading}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Ruse, Alexandrovska Str. 97"
              />
              <p className="text-xs text-gray-500">Die Adresse, die auf der deutschen Version der Website angezeigt wird.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

