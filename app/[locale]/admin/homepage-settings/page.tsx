'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

interface HomepageSettings {
  id: string;
  sectionLabelBg: string;
  sectionLabelEn: string;
  sectionLabelDe: string;
  titleBg: string;
  titleEn: string;
  titleDe: string;
  subtitleBg: string;
  subtitleEn: string;
  subtitleDe: string;
  descriptionBg: string;
  descriptionEn: string;
  descriptionDe: string;
  moodTextBg: string;
  moodTextEn: string;
  moodTextDe: string;
  stats: {
    bg: { label: string; value: string }[];
    en: { label: string; value: string }[];
    de: { label: string; value: string }[];
  };
  ctaPrimaryBg: string;
  ctaPrimaryEn: string;
  ctaPrimaryDe: string;
  ctaSecondaryBg: string;
  ctaSecondaryEn: string;
  ctaSecondaryDe: string;
}

interface OfferingCard {
  id: string;
  order: number;
  icon: string;
  titleBg: string;
  titleEn: string;
  titleDe: string;
  descriptionBg: string;
  descriptionEn: string;
  descriptionDe: string;
  badgeBg: string;
  badgeEn: string;
  badgeDe: string;
  highlights: {
    bg: string[];
    en: string[];
    de: string[];
  };
  isActive: boolean;
}

export default function HomepageSettingsPage({
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

  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [cards, setCards] = useState<OfferingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'stats' | 'cards'>('general');
  const [editingCard, setEditingCard] = useState<OfferingCard | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    Promise.all([
      fetch('/api/homepage-settings').then(res => res.json()),
      fetch('/api/homepage-offering-cards').then(res => res.json())
    ])
      .then(([settingsData, cardsData]) => {
        if (!isMounted) return;
        if (settingsData?.settings) {
          setSettings(settingsData.settings);
        }
        if (cardsData?.cards) {
          setCards(cardsData.cards);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Грешка при зареждане на настройките.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/homepage-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Настройките са запазени успешно!');
        if (data.settings) {
          setSettings(data.settings);
        }
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError(data.error || 'Грешка при запазване на настройките.');
      }
    } catch (error) {
      setError('Грешка при връзка със сървъра.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCard = async (card: OfferingCard) => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const url = card.id ? `/api/homepage-offering-cards/${card.id}` : '/api/homepage-offering-cards';
      const method = card.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Картата е запазена успешно!');
        if (data.card) {
          if (card.id) {
            setCards(cards.map(c => c.id === card.id ? data.card : c));
          } else {
            setCards([...cards, data.card]);
          }
        }
        setShowCardModal(false);
        setEditingCard(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError(data.error || 'Грешка при запазване на картата.');
      }
    } catch (error) {
      setError('Грешка при връзка със сървъра.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази карта?')) return;
    
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/homepage-offering-cards/${cardId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCards(cards.filter(c => c.id !== cardId));
        setMessage('Картата е изтрита успешно!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Грешка при изтриване на картата.');
      }
    } catch (error) {
      setError('Грешка при връзка със сървъра.');
    } finally {
      setSaving(false);
    }
  };

  const updateHighlightValue = (localeKey: 'bg' | 'en' | 'de', index: number, value: string) => {
    if (!editingCard) return;

    const nextHighlights = {
      ...editingCard.highlights,
      [localeKey]: editingCard.highlights[localeKey].map((item, idx) => (idx === index ? value : item))
    };

    setEditingCard({
      ...editingCard,
      highlights: nextHighlights
    });
  };

  const addHighlightRow = (localeKey: 'bg' | 'en' | 'de') => {
    if (!editingCard) return;

    setEditingCard({
      ...editingCard,
      highlights: {
        ...editingCard.highlights,
        [localeKey]: [...editingCard.highlights[localeKey], '']
      }
    });
  };

  const removeHighlightRow = (localeKey: 'bg' | 'en' | 'de', index: number) => {
    if (!editingCard) return;

    setEditingCard({
      ...editingCard,
      highlights: {
        ...editingCard.highlights,
        [localeKey]: editingCard.highlights[localeKey].filter((_, idx) => idx !== index)
      }
    });
  };

  if (status === 'loading' || loading || !settings) {
    return <LoadingScreen locale={locale} />;
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${locale}/admin`)}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <span>←</span>
            <span>Назад към Dashboard</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Настройки на началната страница</h1>
          <p className="text-gray-400 mt-2">
            Управлявай съдържанието на секцията "Предложения" на началната страница.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'general'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Общи настройки
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'stats'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Статистики
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'cards'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Карти ({cards.length})
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 text-green-200 px-4 py-2">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 px-4 py-2">
            {error}
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Общи настройки</h2>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  saving
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {saving ? 'Запазване...' : 'Запази'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Section Label */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Етикет на секцията (БГ)</label>
                  <input
                    type="text"
                    value={settings.sectionLabelBg}
                    onChange={(e) => setSettings({ ...settings, sectionLabelBg: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Етикет на секцията (EN)</label>
                  <input
                    type="text"
                    value={settings.sectionLabelEn}
                    onChange={(e) => setSettings({ ...settings, sectionLabelEn: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Етикет на секцията (DE)</label>
                  <input
                    type="text"
                    value={settings.sectionLabelDe}
                    onChange={(e) => setSettings({ ...settings, sectionLabelDe: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Заглавие (БГ)</label>
                  <input
                    type="text"
                    value={settings.titleBg}
                    onChange={(e) => setSettings({ ...settings, titleBg: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Заглавие (EN)</label>
                  <input
                    type="text"
                    value={settings.titleEn}
                    onChange={(e) => setSettings({ ...settings, titleEn: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Заглавие (DE)</label>
                  <input
                    type="text"
                    value={settings.titleDe}
                    onChange={(e) => setSettings({ ...settings, titleDe: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Подзаглавие (БГ)</label>
                  <input
                    type="text"
                    value={settings.subtitleBg}
                    onChange={(e) => setSettings({ ...settings, subtitleBg: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Подзаглавие (EN)</label>
                  <input
                    type="text"
                    value={settings.subtitleEn}
                    onChange={(e) => setSettings({ ...settings, subtitleEn: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Подзаглавие (DE)</label>
                  <input
                    type="text"
                    value={settings.subtitleDe}
                    onChange={(e) => setSettings({ ...settings, subtitleDe: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Описание (БГ)</label>
                  <textarea
                    value={settings.descriptionBg}
                    onChange={(e) => setSettings({ ...settings, descriptionBg: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Описание (EN)</label>
                  <textarea
                    value={settings.descriptionEn}
                    onChange={(e) => setSettings({ ...settings, descriptionEn: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Описание (DE)</label>
                  <textarea
                    value={settings.descriptionDe}
                    onChange={(e) => setSettings({ ...settings, descriptionDe: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* Mood Text */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Текст за настроение (БГ)</label>
                  <textarea
                    value={settings.moodTextBg}
                    onChange={(e) => setSettings({ ...settings, moodTextBg: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Текст за настроение (EN)</label>
                  <textarea
                    value={settings.moodTextEn}
                    onChange={(e) => setSettings({ ...settings, moodTextEn: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Текст за настроение (DE)</label>
                  <textarea
                    value={settings.moodTextDe}
                    onChange={(e) => setSettings({ ...settings, moodTextDe: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Основен призив (БГ)</label>
                  <input
                    type="text"
                    value={settings.ctaPrimaryBg}
                    onChange={(e) => setSettings({ ...settings, ctaPrimaryBg: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Основен призив (EN)</label>
                  <input
                    type="text"
                    value={settings.ctaPrimaryEn}
                    onChange={(e) => setSettings({ ...settings, ctaPrimaryEn: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Основен призив (DE)</label>
                  <input
                    type="text"
                    value={settings.ctaPrimaryDe}
                    onChange={(e) => setSettings({ ...settings, ctaPrimaryDe: e.target.value })}
                    className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Статистики</h2>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  saving
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {saving ? 'Запазване...' : 'Запази'}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Български</h3>
                {settings.stats.bg.map((stat, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = { ...settings.stats };
                        newStats.bg[index].label = e.target.value;
                        setSettings({ ...settings, stats: newStats });
                      }}
                      placeholder="Label"
                      className="rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = { ...settings.stats };
                        newStats.bg[index].value = e.target.value;
                        setSettings({ ...settings, stats: newStats });
                      }}
                      placeholder="Value"
                      className="rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newStats = { ...settings.stats };
                    newStats.bg.push({ label: '', value: '' });
                    setSettings({ ...settings, stats: newStats });
                  }}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  + Добави статистика
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">English</h3>
                {settings.stats.en.map((stat, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = { ...settings.stats };
                        newStats.en[index].label = e.target.value;
                        setSettings({ ...settings, stats: newStats });
                      }}
                      placeholder="Label"
                      className="rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = { ...settings.stats };
                        newStats.en[index].value = e.target.value;
                        setSettings({ ...settings, stats: newStats });
                      }}
                      placeholder="Value"
                      className="rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newStats = { ...settings.stats };
                    newStats.en.push({ label: '', value: '' });
                    setSettings({ ...settings, stats: newStats });
                  }}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  + Add stat
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Deutsch</h3>
                {settings.stats.de.map((stat, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = { ...settings.stats };
                        newStats.de[index].label = e.target.value;
                        setSettings({ ...settings, stats: newStats });
                      }}
                      placeholder="Label"
                      className="rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const newStats = { ...settings.stats };
                        newStats.de[index].value = e.target.value;
                        setSettings({ ...settings, stats: newStats });
                      }}
                      placeholder="Value"
                      className="rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newStats = { ...settings.stats };
                    newStats.de.push({ label: '', value: '' });
                    setSettings({ ...settings, stats: newStats });
                  }}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  + Statistik hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards Tab */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Карти</h2>
              <button
                onClick={() => {
                  setEditingCard({
                    id: '',
                    order: cards.length,
                    icon: '🍸',
                    titleBg: '',
                    titleEn: '',
                    titleDe: '',
                    descriptionBg: '',
                    descriptionEn: '',
                    descriptionDe: '',
                    badgeBg: '',
                    badgeEn: '',
                    badgeDe: '',
                    highlights: { bg: [], en: [], de: [] },
                    isActive: true
                  });
                  setShowCardModal(true);
                }}
                className="px-6 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition-all"
              >
                + Добави карта
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{card.icon}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCard(card);
                          setShowCardModal(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-gray-700 text-white hover:bg-gray-600 text-sm"
                      >
                        Редактирай
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-1 rounded-lg bg-red-900/50 text-red-200 hover:bg-red-900/70 text-sm"
                      >
                        Изтрий
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{card.titleBg}</h3>
                  <p className="text-gray-400 text-sm mb-2">{card.descriptionBg.substring(0, 100)}...</p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs text-gray-500">Badge: {card.badgeBg}</span>
                    <span className="text-xs text-gray-500">Order: {card.order}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Modal */}
        {showCardModal && editingCard && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingCard.id ? 'Редактирай карта' : 'Добави карта'}
                </h3>
                <button
                  onClick={() => {
                    setShowCardModal(false);
                    setEditingCard(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Икона (емоджи)</label>
                    <input
                      type="text"
                      value={editingCard.icon}
                      onChange={(e) => setEditingCard({ ...editingCard, icon: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Позиция (подредба)</label>
                    <input
                      type="number"
                      value={editingCard.order}
                      onChange={(e) => setEditingCard({ ...editingCard, order: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Заглавие (BG)</label>
                    <input
                      type="text"
                      value={editingCard.titleBg}
                      onChange={(e) => setEditingCard({ ...editingCard, titleBg: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Заглавие (EN)</label>
                    <input
                      type="text"
                      value={editingCard.titleEn}
                      onChange={(e) => setEditingCard({ ...editingCard, titleEn: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Заглавие (DE)</label>
                    <input
                      type="text"
                      value={editingCard.titleDe}
                      onChange={(e) => setEditingCard({ ...editingCard, titleDe: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Описание (BG)</label>
                    <textarea
                      value={editingCard.descriptionBg}
                      onChange={(e) => setEditingCard({ ...editingCard, descriptionBg: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Описание (EN)</label>
                    <textarea
                      value={editingCard.descriptionEn}
                      onChange={(e) => setEditingCard({ ...editingCard, descriptionEn: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Описание (DE)</label>
                    <textarea
                      value={editingCard.descriptionDe}
                      onChange={(e) => setEditingCard({ ...editingCard, descriptionDe: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Бадж (BG)</label>
                    <input
                      type="text"
                      value={editingCard.badgeBg}
                      onChange={(e) => setEditingCard({ ...editingCard, badgeBg: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Бадж (EN)</label>
                    <input
                      type="text"
                      value={editingCard.badgeEn}
                      onChange={(e) => setEditingCard({ ...editingCard, badgeEn: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Бадж (DE)</label>
                    <input
                      type="text"
                      value={editingCard.badgeDe}
                      onChange={(e) => setEditingCard({ ...editingCard, badgeDe: e.target.value })}
                      className="w-full rounded-xl border border-gray-700 bg-black/40 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Акценти (едно поле = един акцент)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['bg', 'en', 'de'] as Array<'bg' | 'en' | 'de'>).map((localeKey) => (
                      <div key={localeKey}>
                        <label className="block text-xs text-gray-400 mb-2 uppercase">{localeKey}</label>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            {editingCard.highlights[localeKey].map((highlight, idx) => (
                              <div
                                key={`${localeKey}-${idx}`}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  value={highlight}
                                  onChange={(e) => updateHighlightValue(localeKey, idx, e.target.value)}
                                  className="flex-1 min-w-0 rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                  placeholder="Въведи акцент"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeHighlightRow(localeKey, idx)}
                                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-red-900/50 text-red-200 hover:bg-red-900/70 text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => addHighlightRow(localeKey)}
                            className="text-gray-400 hover:text-white text-sm block"
                          >
                            + Добави акцент
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleSaveCard(editingCard)}
                    disabled={saving}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                      saving
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {saving ? 'Запазване...' : 'Запази'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCardModal(false);
                      setEditingCard(null);
                    }}
                    className="px-6 py-3 rounded-xl font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-all"
                  >
                    Отказ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

