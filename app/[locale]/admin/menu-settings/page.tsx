'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import Toast from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';

interface MenuSettings {
  id: string;
  titleBg: string;
  titleEn: string;
  titleDe: string;
  subtitleBg: string;
  subtitleEn: string;
  subtitleDe: string;
  backgroundImageUrl: string | null;
}

export default function MenuSettingsPage({
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

  const [settings, setSettings] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/api/menu-settings');
      const data = await response.json();
      
      if (data.settings) {
        setSettings(data.settings);
      } else {
        // Initialize with defaults if no settings exist
        const defaultSettings: MenuSettings = {
          id: '',
          titleBg: '🍸 Нашето Меню',
          titleEn: '🍸 Our Menu',
          titleDe: '🍸 Unser Menü',
          subtitleBg: 'Открийте нашата селекция от напитки и деликатеси',
          subtitleEn: 'Discover our selection of drinks and delicacies',
          subtitleDe: 'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten',
          backgroundImageUrl: null
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading menu settings:', error);
      setToast({ message: 'Грешка при зареждане на настройките', type: 'error' });
      // Set defaults on error
      const defaultSettings: MenuSettings = {
        id: '',
        titleBg: '🍸 Нашето Меню',
        titleEn: '🍸 Our Menu',
        titleDe: '🍸 Unser Menü',
        subtitleBg: 'Открийте нашата селекция от напитки и деликатеси',
        subtitleEn: 'Discover our selection of drinks and delicacies',
        subtitleDe: 'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten',
        backgroundImageUrl: null
      };
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/menu-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleBg: settings.titleBg,
          titleEn: settings.titleEn,
          titleDe: settings.titleDe,
          subtitleBg: settings.subtitleBg,
          subtitleEn: settings.subtitleEn,
          subtitleDe: settings.subtitleDe,
          backgroundImageUrl: settings.backgroundImageUrl
        })
      });

      if (response.ok) {
        setToast({ message: '✅ Настройките са запазени успешно', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Грешка при запазване', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving menu settings:', error);
      setToast({ message: 'Грешка при запазване', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen locale={locale} />;
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toast && typeof window !== 'undefined' && !(window as any).__isOffline && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/${locale}/admin`)}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
        >
          <span>←</span>
          <span>Назад към Dashboard</span>
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Настройки на меню</h1>
            <p className="text-gray-400 mt-2">
              Настрой заглавието, подзаглавието и фоновото изображение на меню страницата.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Запазване...' : 'Запази'}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 md:p-8 space-y-8">
        {/* Titles */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Заглавие</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Заглавие (БГ) *</label>
              <input
                type="text"
                value={settings?.titleBg || ''}
                onChange={(e) => setSettings({ ...settings!, titleBg: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Title (EN) *</label>
              <input
                type="text"
                value={settings?.titleEn || ''}
                onChange={(e) => setSettings({ ...settings!, titleEn: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Titel (DE) *</label>
              <input
                type="text"
                value={settings?.titleDe || ''}
                onChange={(e) => setSettings({ ...settings!, titleDe: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Subtitles */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Подзаглавие</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Подзаглавие (БГ) *</label>
              <textarea
                value={settings?.subtitleBg || ''}
                onChange={(e) => setSettings({ ...settings!, subtitleBg: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Subtitle (EN) *</label>
              <textarea
                value={settings?.subtitleEn || ''}
                onChange={(e) => setSettings({ ...settings!, subtitleEn: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Untertitel (DE) *</label>
              <textarea
                value={settings?.subtitleDe || ''}
                onChange={(e) => setSettings({ ...settings!, subtitleDe: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Background Image */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Фоново изображение</h2>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <p className="text-gray-300 mb-4">
              Препоръчителни размери: <span className="font-semibold text-white">1920x600px</span> (широк формат за hero секция)
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Изображението ще се показва като фон в hero секцията на меню страницата. За най-добър резултат използвайте широко изображение с височина около 600px.
            </p>
            <ImageUpload
              currentImageUrl={settings?.backgroundImageUrl || ''}
              onImageUploaded={(url) => setSettings({ ...settings!, backgroundImageUrl: url })}
              bucket="menu-backgrounds"
              recommendedSize="1920x600px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

