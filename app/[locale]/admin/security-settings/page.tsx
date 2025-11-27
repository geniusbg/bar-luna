'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

export default function SecuritySettingsPage({
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
    setSettingsMessage(null);
    setSettingsError(null);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage(null);
    setSettingsError(null);

    try {
      const response = await fetch('/api/security-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securitySettings)
      });

      const data = await response.json();

      if (response.ok) {
        setSettingsMessage('Настройките са запазени успешно!');
        setSecuritySettings({
          id: data.settings.id || securitySettings.id,
          approvalOrderThreshold: data.settings.approvalOrderThreshold ?? securitySettings.approvalOrderThreshold,
          approvalTimeWindowMinutes: data.settings.approvalTimeWindowMinutes ?? securitySettings.approvalTimeWindowMinutes,
          sessionDurationHours: data.settings.sessionDurationHours ?? securitySettings.sessionDurationHours,
          autoRejectMinutes: data.settings.autoRejectMinutes ?? securitySettings.autoRejectMinutes
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
    return <LoadingScreen locale={locale} />;
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
          <h1 className="text-3xl md:text-4xl font-bold text-white">Настройки за сигурност</h1>
          <p className="text-gray-400 mt-2">
            Определи след колко поръчки и в какъв период ще се изисква одобрение. Настройките се отразяват веднага.
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Конфигурация</h2>
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
              <p className="text-xs text-gray-500">Колко поръчки от една маса преди да се изисква одобрение от администратор.</p>
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

