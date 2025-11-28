'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';

interface QRCodeSettings {
  backgroundColor: string;
  textColor: string;
  qrCodeColor: string;
  qrCodeSize: number;
  qrCodeMargin: number; // отстояние на QR кода (margin в px)
  orientation: 'portrait' | 'landscape';
  logoUrl?: string;
  useLogo: boolean;
  logoText: string;
  logoSize: number;
  logoMargin: number; // отстояние на логото (margin в px)
  scanTextBg: string;
  scanTextEn: string;
  scanTextSize: number; // размер на текста в px
  scanTextMargin: number; // отстояние на текста (margin в px)
  cardWidth: number; // в cm
  cardHeight: number; // в cm
}

const DEFAULT_SETTINGS: QRCodeSettings = {
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  qrCodeColor: '#000000',
  qrCodeSize: 400,
  qrCodeMargin: 0, // px
  orientation: 'portrait',
  logoUrl: '',
  useLogo: false,
  logoText: '𝐋.𝐔.𝐍.𝐀 🌙\nBar & Coffee - Русе',
  logoSize: 80,
  logoMargin: 0, // px
  scanTextBg: 'Сканирай за меню и поръчка',
  scanTextEn: 'Scan for menu & order',
  scanTextSize: 20, // px
  scanTextMargin: 0, // px
  cardWidth: 8.5, // cm
  cardHeight: 5.5 // cm
};

// Logo Section Component with Collapsible functionality
function LogoSection({ settings, setSettings }: { settings: QRCodeSettings; setSettings: (s: QRCodeSettings) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🖼️</span>
          Лого настройки
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Лого или текст
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="useLogo"
                  checked={!settings.useLogo}
                  onChange={() => setSettings({ ...settings, useLogo: false })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-300">📝 Текст</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="useLogo"
                  checked={settings.useLogo}
                  onChange={() => setSettings({ ...settings, useLogo: true })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-300">🖼️ Лого (изображение)</span>
              </label>
            </div>
          </div>
          
          {!settings.useLogo ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Текст за лого
              </label>
              <textarea
                value={settings.logoText}
                onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="𝐋.𝐔.𝐍.𝐀 🌙&#10;Bar & Coffee - Русе"
              />
              <p className="text-xs text-gray-400 mt-1">Използвай нов ред (Enter) за нов ред в текста</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL на лого
                </label>
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/logo.png или /logo.png"
                />
                <p className="text-xs text-gray-400 mt-1">Въведи пълен URL или път към изображението</p>
              </div>
              
              {settings.logoUrl && settings.logoUrl.trim() !== '' && (
                <div className="space-y-4 pt-2 border-t border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Размер на логото (px)
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="800"
                        step="10"
                        value={settings.logoSize}
                        onChange={(e) => setSettings({ ...settings, logoSize: parseInt(e.target.value) || 80 })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Отстояние на логото (px)
                      </label>
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        step="1"
                        value={settings.logoMargin}
                        onChange={(e) => setSettings({ ...settings, logoMargin: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Preview на логото (фон: {settings.backgroundColor}):</p>
                    <div className="relative inline-block">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo preview" 
                        className="object-contain border-2 border-slate-600 rounded p-2"
                        style={{
                          backgroundColor: settings.backgroundColor,
                          maxWidth: `${settings.logoSize}px`,
                          maxHeight: `${settings.logoSize}px`,
                          width: `${settings.logoSize}px`,
                          height: `${settings.logoSize}px`
                        }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent && !parent.querySelector('.logo-error')) {
                            const errorMsg = document.createElement('div');
                            errorMsg.className = 'logo-error text-red-500 text-xs mt-1 p-2 border border-red-500 rounded bg-red-500/10';
                            errorMsg.textContent = `❌ Логото не може да се зареди: ${settings.logoUrl}`;
                            parent.appendChild(errorMsg);
                          }
                        }}
                        onLoad={() => {
                          const errorMsg = document.querySelector('.logo-error');
                          if (errorMsg) {
                            errorMsg.remove();
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 break-all">URL: {settings.logoUrl}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QRTable {
  id: string;
  tableNumber: number;
  tableName: string | null;
  isActive: boolean;
  redirectUrl: string | null;
  scanCount: number;
  lastScannedAt: string | null;
  qrCodeUrl: string | null;
}

export default function QRCodesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRedirectsModal, setShowRedirectsModal] = useState(false);
  const [settings, setSettings] = useState<QRCodeSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<QRCodeSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // QR Redirects modal state
  const [redirectTables, setRedirectTables] = useState<QRTable[]>([]);
  const [redirectsLoading, setRedirectsLoading] = useState(false);
  const [editingTable, setEditingTable] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTableName, setEditTableName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [redirectsToast, setRedirectsToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/qr/settings', {
          credentials: 'include' // Include cookies for authentication
        });
        const data = await response.json();
        
        if (data.success && data.settings) {
          const loadedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
          setSettings(loadedSettings);
          setSavedSettings(loadedSettings); // Track saved settings
        } else {
          // Use default settings if none exist in database
          setSettings(DEFAULT_SETTINGS);
          setSavedSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        // Error loading QR settings, use defaults
        setSettings(DEFAULT_SETTINGS);
        setSavedSettings(DEFAULT_SETTINGS);
      }
    };
    
    loadSettings();
    
    // Clean up any existing fallback messages
    const fallbacks = document.querySelectorAll('.logo-fallback');
    fallbacks.forEach(fb => fb.remove());
  }, []);

  // Load existing QR codes on mount
  useEffect(() => {
    loadExistingQRCodes();
  }, []);

  // Check if settings have been modified
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // Save settings to API
  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/qr/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        setSavedSettings(settings); // Update saved settings
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000); // Hide success message after 2 seconds
      } else {
        console.error('Failed to save QR settings:', response.status, response.statusText);
        alert('Грешка при запазване на настройките. Моля опитайте отново.');
      }
    } catch (error) {
      console.error('Error saving QR settings:', error);
      alert('Грешка при запазване на настройките. Моля опитайте отново.');
    } finally {
      setSaving(false);
    }
  };

  const loadExistingQRCodes = async () => {
    setLoading(true);
    try {
      // Fetch all tables from database
      const response = await fetch('/api/tables');
      const data = await response.json();
      
      if (data.tables && data.tables.length > 0) {
        // Filter tables that have QR codes already generated
        const tablesWithQR = data.tables.filter((t: any) => t.qrCodeDataUrl);
        
        if (tablesWithQR.length > 0) {
          setTables(tablesWithQR);
          setGenerated(true);
        }
      }
    } catch (error) {
      // Error loading QR codes
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async (confirmed: boolean = false) => {
    // Warn if there are unsaved changes
    if (hasUnsavedChanges && !confirmed) {
      const proceed = confirm('⚠️ Има незаписани промени в настройките. При генериране ще се използват текущите (незаписани) настройки.\n\nИскате ли да продължите?');
      if (!proceed) return;
    }

    if (generated && !confirmed) {
      setShowConfirmModal(true);
      return;
    }

    setLoading(true);
    setShowConfirmModal(false);
    try {
      // Use saved settings if no unsaved changes, otherwise use current settings
      const settingsToUse = hasUnsavedChanges ? settings : savedSettings;
      const response = await fetch('/api/qr/generate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            backgroundColor: settingsToUse.backgroundColor,
            textColor: settingsToUse.textColor,
            qrCodeColor: settingsToUse.qrCodeColor,
            qrCodeSize: settingsToUse.qrCodeSize
          }
        })
      });
      const data = await response.json();
      setTables(data.tables);
      setGenerated(true);
      // If unsaved changes were used, save them automatically after successful generation
      if (hasUnsavedChanges) {
        setSavedSettings(settings);
      }
    } catch (error) {
      // Error generating QR codes
    } finally {
      setLoading(false);
    }
  };

  const printAllQRCodes = () => {
    window.print();
  };

  // QR Redirects functions
  const loadRedirectTables = async () => {
    setRedirectsLoading(true);
    try {
      const response = await fetch('/api/qr/redirects');
      const data = await response.json();
      setRedirectTables(data.tables || []);
    } catch (error) {
      setRedirectsToast({ message: 'Грешка при зареждане', type: 'error' });
    } finally {
      setRedirectsLoading(false);
    }
  };

  const startEditingRedirect = (table: QRTable) => {
    setEditingTable(table.tableNumber);
    setEditUrl(table.redirectUrl || `/order?table=${table.tableNumber}`);
    setEditTableName(table.tableName || '');
    setEditIsActive(table.isActive);
  };

  const cancelEditingRedirect = () => {
    setEditingTable(null);
    setEditUrl('');
    setEditTableName('');
    setEditIsActive(true);
  };

  const saveRedirect = async (tableNumber: number) => {
    try {
      const response = await fetch('/api/qr/redirects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          redirectUrl: editUrl,
          tableName: editTableName || null,
          isActive: editIsActive
        })
      });

      if (response.ok) {
        setRedirectsToast({ message: '✅ Успешно запазено', type: 'success' });
        await loadRedirectTables();
        cancelEditingRedirect();
      } else {
        setRedirectsToast({ message: 'Грешка при запазване', type: 'error' });
      }
    } catch (error) {
      setRedirectsToast({ message: 'Грешка при запазване', type: 'error' });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никога';
    const date = new Date(dateString);
    return date.toLocaleString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadAllQRCodes = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      setLoading(true);
      
      const cards = document.querySelectorAll('.qr-card');
      if (cards.length === 0) return;
      
      // Temporarily remove borders for PDF generation
      const originalBorders: string[] = [];
      cards.forEach((card, index) => {
        const htmlCard = card as HTMLElement;
        originalBorders[index] = htmlCard.style.border || '';
        htmlCard.style.border = 'none';
        // Also remove border-4 class styling
        htmlCard.style.borderWidth = '0';
        htmlCard.style.borderStyle = 'none';
      });
      
      const pdf = new jsPDF({
        orientation: settings.orientation === 'portrait' ? 'portrait' : 'landscape',
        unit: 'cm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth(); // в cm
      const pageHeight = pdf.internal.pageSize.getHeight(); // в cm
      
      // Конвертираме cm в px за html2canvas (1cm ≈ 37.8px при 96 DPI)
      const cardWidthPx = settings.cardWidth * 37.8;
      const cardHeightPx = settings.cardHeight * 37.8;
      
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        
        // Запазваме оригиналния размер
        const originalWidth = card.style.width;
        const originalHeight = card.style.height;
        const originalBoxSizing = card.style.boxSizing;
        
        // Задаваме точния размер за изтегляне
        card.style.width = `${cardWidthPx}px`;
        card.style.height = `${cardHeightPx}px`;
        card.style.boxSizing = 'border-box';
        
        const canvas = await html2canvas(card, {
          backgroundColor: settings.backgroundColor,
          scale: 2,
          logging: false,
          useCORS: true,
          width: cardWidthPx,
          height: cardHeightPx,
          ignoreElements: (element) => {
            return element.classList.contains('no-print');
          }
        });
        
        // Възстановяваме оригиналния размер
        card.style.width = originalWidth;
        card.style.height = originalHeight;
        card.style.boxSizing = originalBoxSizing;
        
        const imgData = canvas.toDataURL('image/png');
        
        // Центрираме картата на страницата
        const x = (pageWidth - settings.cardWidth) / 2;
        const y = (pageHeight - settings.cardHeight) / 2;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', x, y, settings.cardWidth, settings.cardHeight);
      }
      
      // Restore original borders
      cards.forEach((card, index) => {
        const htmlCard = card as HTMLElement;
        if (originalBorders[index]) {
          htmlCard.style.border = originalBorders[index];
        } else {
          htmlCard.style.border = '';
          htmlCard.style.borderWidth = '';
          htmlCard.style.borderStyle = '';
        }
      });
      
      pdf.save(`qr-codes-${new Date().toISOString().split('T')[0]}.pdf`);
      setLoading(false);
    } catch (error) {
      // Error downloading QR codes
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 md:mb-8 no-print">
        <div className="mb-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">QR Кодове за маси</h1>
          {generated && tables.length > 0 && (
            <p className="text-gray-400 text-sm md:text-base">
              ✅ {tables.length} QR кода запазени в базата
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <button
            onClick={() => {
              setShowRedirectsModal(true);
              loadRedirectTables();
            }}
            className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-sm md:text-base"
          >
            🔗 Пренасочвания
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 md:px-6 py-2 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all text-sm md:text-base"
          >
            {showSettings ? '❌ Затвори настройки' : '⚙️ Настройки'}
          </button>
          <button
            onClick={() => generateQRCodes(false)}
            disabled={loading}
            className="px-4 md:px-6 py-2 md:py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all disabled:opacity-50 text-sm md:text-base"
          >
            {loading ? 'Генериране...' : generated ? '🔄 Регенерирай' : '✨ Генерирай'}
          </button>
          {generated && (
            <>
              <button
                onClick={downloadAllQRCodes}
                disabled={loading}
                className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 text-sm md:text-base"
              >
                {loading ? 'Изтегляне...' : '⬇️ Изтегли PDF'}
              </button>
              <button
                onClick={printAllQRCodes}
                className="px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all text-sm md:text-base"
              >
                🖨️ Принтирай
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 md:mb-8 bg-slate-800 rounded-xl border border-slate-700 p-4 md:p-6 no-print">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Настройки на QR кодове</h2>
          
          <div className="space-y-6">
            {/* Section 1: Colors */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                Цветове
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Row 1: Background Color | QR Code Color | Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цвят на фона
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* QR Code Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цвят на QR кода
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.qrCodeColor}
                  onChange={(e) => setSettings({ ...settings, qrCodeColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.qrCodeColor}
                  onChange={(e) => setSettings({ ...settings, qrCodeColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Цвят на буквите
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>

              </div>
            </div>

            {/* Section 2: Sizes and Spacing */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📐</span>
                Размери и отстояния
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Размер на QR кода (px)
                  </label>
                  <input
                    type="number"
                    min="200"
                    max="800"
                    step="50"
                    value={settings.qrCodeSize}
                    onChange={(e) => setSettings({ ...settings, qrCodeSize: parseInt(e.target.value) || 400 })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Отстояние на QR кода (px)
                  </label>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    step="1"
                    value={settings.qrCodeMargin}
                    onChange={(e) => setSettings({ ...settings, qrCodeMargin: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Размер на текста (px)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    step="1"
                    value={settings.scanTextSize}
                    onChange={(e) => setSettings({ ...settings, scanTextSize: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Отстояние на текста (px)
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    step="1"
                    value={settings.scanTextMargin}
                    onChange={(e) => setSettings({ ...settings, scanTextMargin: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Card Layout */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📄</span>
                Ориентация и размери на картата
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Ориентация на картата
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="orientation"
                        value="portrait"
                        checked={settings.orientation === 'portrait'}
                        onChange={(e) => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-300">📄 Портретна (продълговата / вертикална)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape"
                        checked={settings.orientation === 'landscape'}
                        onChange={(e) => setSettings({ ...settings, orientation: e.target.value as 'portrait' | 'landscape' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-300">🖼️ Ландшафтна (широка / хоризонтална)</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ширина на табелката (cm)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="20"
                      step="0.5"
                      value={settings.cardWidth}
                      onChange={(e) => setSettings({ ...settings, cardWidth: parseFloat(e.target.value) || 8.5 })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Използва се при принтиране и PDF изтегляне</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Височина на табелката (cm)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="15"
                      step="0.5"
                      value={settings.cardHeight}
                      onChange={(e) => setSettings({ ...settings, cardHeight: parseFloat(e.target.value) || 5.5 })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Използва се при принтиране и PDF изтегляне</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Scan Text */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Текстове за сканиране
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Текст за сканиране (Български)
                  </label>
                  <input
                    type="text"
                    value={settings.scanTextBg}
                    onChange={(e) => setSettings({ ...settings, scanTextBg: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Сканирай за меню и поръчка"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Текст за сканиране (English)
                  </label>
                  <input
                    type="text"
                    value={settings.scanTextEn}
                    onChange={(e) => setSettings({ ...settings, scanTextEn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Scan for menu & order"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Logo Settings - Collapsible */}
            <LogoSection settings={settings} setSettings={setSettings} />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700">
            {hasUnsavedChanges && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-300">
                  ⚠️ Има незаписани промени. Не забравяйте да натиснете "Запази" за да запазите настройките.
                </p>
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-sm text-green-300">
                  ✅ Настройките са запазени успешно!
                </p>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-400 flex-1">
                💡 Запазете настройките преди генериране/регенериране на QR кодовете. При генериране ще се използват запазените настройки.
              </p>
              <button
                onClick={handleSaveSettings}
                disabled={!hasUnsavedChanges || saving}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  hasUnsavedChanges && !saving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? 'Запазване...' : '💾 Запази'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">⚠️ Потвърждение</h3>
            <p className="text-gray-300 mb-6">
              Сигурни ли сте, че искате да регенерирате всички QR кодове? 
              Това ще презапише текущите QR кодове с новите настройки.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
              >
                Отказ
              </button>
              <button
                onClick={() => generateQRCodes(true)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
              >
                Да, регенерирай
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !generated && (
        <LoadingScreen locale="bg" />
      )}

      {!loading && !generated && (
        <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-gray-200 text-xl mb-4">
            Няма генерирани QR кодове
          </p>
          <p className="text-gray-400 text-sm mb-2">
            Кликнете "Генерирай QR кодове" за да създадете QR кодове за всички 30 маси
          </p>
          <p className="text-gray-400 text-sm">
            QR кодовете ще се запазят в базата данни и ще са достъпни винаги
          </p>
        </div>
      )}

      {generated && (
        <>
          <style jsx global>{`
            /* Mobile responsive styles - only for small screens */
            @media (max-width: 640px) {
              .qr-card {
                max-width: calc(100vw - 2rem) !important;
                width: auto !important;
                height: auto !important;
                aspect-ratio: ${settings.cardWidth} / ${settings.cardHeight} !important;
              }
            }
            
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .no-print,
              .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              .qr-card,
              .qr-card * {
                visibility: visible !important;
              }
              .grid {
                display: grid !important;
                grid-template-columns: ${settings.orientation === 'portrait' ? 'repeat(1, 1fr)' : 'repeat(1, 1fr)'} !important;
                gap: 1rem !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
              }
              .qr-card { 
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: auto !important;
                margin: 0 auto !important;
                width: ${settings.cardWidth}cm !important;
                height: ${settings.cardHeight}cm !important;
                max-width: ${settings.cardWidth}cm !important;
                max-height: ${settings.cardHeight}cm !important;
                box-sizing: border-box !important;
                background-color: ${settings.backgroundColor} !important;
                color: ${settings.textColor} !important;
                border: none !important;
                box-shadow: none !important;
                overflow: hidden !important;
              }
              .qr-card .flex-shrink-0 {
                flex-shrink: 0 !important;
              }
              .qr-card .flex-1 {
                flex: 1 !important;
              }
              .qr-card * {
                color: ${settings.textColor} !important;
              }
              .qr-card img {
                max-width: 100% !important;
                height: auto !important;
                border: none !important;
              }
              .qr-card p {
                margin: 0.125rem 0 !important;
                padding: 0 !important;
                line-height: 1.3 !important;
                white-space: normal !important;
                word-wrap: break-word !important;
                font-size: ${settings.scanTextSize}px !important;
              }
              .qr-card > div {
                margin-bottom: 0.5rem !important;
              }
              .qr-card > div:last-child {
                margin-bottom: 0 !important;
              }
              .qr-card .flex {
                gap: 0.5rem !important;
              }
              .qr-card .border-t-2 {
                margin-top: 0.75rem !important;
                padding-top: 0.5rem !important;
              }
              .qr-card .qr-code-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
              @page {
                size: ${settings.orientation === 'portrait' ? 'A4 portrait' : 'A4 landscape'};
                margin: 10mm;
              }
            }
          `}</style>

          <div className={`grid grid-cols-1 ${settings.orientation === 'portrait' ? 'sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3' : 'sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3'} gap-6 md:gap-8`}>
            {tables.map((table) => (
              <div
                key={`${table.tableNumber}-${settings.qrCodeSize}-${settings.orientation}`}
                className="qr-card"
                style={{ 
                  backgroundColor: settings.backgroundColor,
                  color: settings.textColor,
                  border: '2px dashed #9ca3af',
                  boxShadow: 'none',
                  margin: '0 auto',
                  width: `${settings.cardWidth}cm`,
                  height: `${settings.cardHeight}cm`,
                  maxWidth: `${settings.cardWidth}cm`,
                  maxHeight: `${settings.cardHeight}cm`,
                  padding: '1rem 1.5rem',
                  boxSizing: 'border-box',
                  display: settings.orientation === 'portrait' ? 'flex' : 'flex',
                  flexDirection: settings.orientation === 'portrait' ? 'column' : 'row',
                  alignItems: settings.orientation === 'portrait' ? 'stretch' : 'flex-start',
                  textAlign: settings.orientation === 'portrait' ? 'center' : 'left',
                  gap: settings.orientation === 'landscape' ? '1.5rem' : '0',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {settings.orientation === 'portrait' ? (
                  <>
                    {/* Logo */}
                    {settings.useLogo && settings.logoUrl && settings.logoUrl.trim() !== '' ? (
                      <div style={{ margin: `${settings.logoMargin}px`, paddingTop: '0', paddingBottom: '0', display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <img 
                          src={settings.logoUrl} 
                          alt="Logo" 
                          style={{ 
                            maxWidth: '100%', 
                            display: 'block',
                            width: `${settings.logoSize}px`,
                            height: 'auto',
                            margin: '0'
                          }}
                          onError={(e) => {
                            // Logo failed to load
                          }}
                          onLoad={(e) => {
                            // Logo loaded successfully
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ margin: `${settings.logoMargin}px`, paddingTop: '0', paddingBottom: '0' }}>
                        {settings.logoText.split('\n').map((line, i) => (
                          <div key={i} style={{ color: settings.textColor, margin: '0' }} className={i === 0 ? "text-2xl md:text-4xl font-bold" : "text-xs md:text-sm"}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* QR code */}
                    <div 
                      className="qr-code-container"
                      style={{ 
                        border: 'none',
                        padding: '0', 
                        margin: `${settings.qrCodeMargin}px`,
                        display: 'block', 
                        width: '100%', 
                        textAlign: 'center',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <img
                        src={table.qrCodeDataUrl}
                        alt={`QR Code Маса ${table.tableNumber}`}
                        style={{ 
                          border: 'none',
                          display: 'inline-block',
                          width: `${settings.qrCodeSize || 400}px`,
                          height: `${settings.qrCodeSize || 400}px`,
                          maxWidth: '100%',
                          objectFit: 'contain',
                          margin: '0',
                          backgroundColor: 'transparent',
                          borderRadius: '0'
                        }}
                      />
                    </div>
                    
                    {/* Scan instructions with border on top - pushed to bottom, full width */}
                    <div 
                      className="border-t-2 mt-auto" 
                      style={{ 
                        borderColor: settings.backgroundColor === '#000000' || settings.backgroundColor === '#000' ? '#374151' : '#cbd5e1', 
                        width: '100%',
                        marginLeft: '-1rem',
                        marginRight: '-1rem',
                        marginTop: `${settings.scanTextMargin}px`,
                        paddingTop: '0.025rem',
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className="flex items-center gap-3" style={{ width: '100%', minWidth: '0' }}>
                        <img 
                          src="/smartphone_10450488.png" 
                          alt="Smartphone" 
                          className="flex-shrink-0"
                          style={{ 
                            width: '4rem', 
                            height: '5rem', 
                            objectFit: 'contain'
                          }}
                        />
                        <div style={{ flex: '1 1 0%', minWidth: '0', width: '100%' }}>
                          <p style={{ 
                            color: settings.textColor, 
                            fontSize: `${settings.scanTextSize}px`,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            margin: '0',
                            padding: '0',
                            lineHeight: '1.3'
                          }} className="font-semibold mb-1">
                            {settings.scanTextBg}
                          </p>
                          <p style={{ 
                            color: settings.textColor, 
                            fontSize: `${settings.scanTextSize}px`,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            margin: '0',
                            padding: '0',
                            lineHeight: '1.3'
                          }} className="font-semibold">
                            {settings.scanTextEn}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      <div 
                        className="qr-code-container"
                        style={{ 
                          border: 'none',
                          backgroundColor: 'transparent',
                          padding: '0',
                          margin: `${settings.qrCodeMargin}px`,
                          borderRadius: '0'
                        }}
                      >
                        <img
                          src={table.qrCodeDataUrl}
                          alt={`QR Code Маса ${table.tableNumber}`}
                          style={{ 
                            border: 'none', 
                            display: 'block',
                            width: `${settings.qrCodeSize || 400}px`,
                            height: `${settings.qrCodeSize || 400}px`,
                            maxWidth: '100%',
                            objectFit: 'contain',
                            backgroundColor: 'transparent',
                            borderRadius: '0'
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      {/* Logo */}
                      {settings.useLogo && settings.logoUrl && settings.logoUrl.trim() !== '' ? (
                        <div style={{ margin: `${settings.logoMargin}px`, padding: '0' }}>
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo" 
                            className="object-contain"
                            style={{ 
                              maxWidth: '100%', 
                              display: 'block',
                              width: `${settings.logoSize}px`,
                              height: 'auto',
                              margin: '0',
                              padding: '0'
                            }}
                            onError={(e) => {
                              // Logo failed to load
                            }}
                            onLoad={(e) => {
                              // Logo loaded successfully
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ margin: `${settings.logoMargin}px`, padding: '0' }}>
                          {settings.logoText.split('\n').map((line, i) => (
                            <div key={i} style={{ color: settings.textColor, margin: '0', padding: '0' }} className={i === 0 ? "text-2xl md:text-4xl font-bold" : "text-xs md:text-sm"}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Scan instructions with border on top - pushed to bottom, full width - OUTSIDE flex div */}
                    <div 
                      className="border-t-2" 
                      style={{ 
                        borderColor: settings.backgroundColor === '#000000' || settings.backgroundColor === '#000' ? '#374151' : '#cbd5e1', 
                        position: 'absolute',
                        bottom: `${1 + settings.scanTextMargin / 16}rem`,
                        left: '0',
                        right: '0',
                        width: '100%',
                        paddingTop: '0.025rem',
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className="flex items-center gap-3" style={{ width: '100%', minWidth: '0' }}>
                        <img 
                          src="/smartphone_10450488.png" 
                          alt="Smartphone" 
                          className="flex-shrink-0"
                          style={{ 
                            width: '4rem', 
                            height: '5rem', 
                            objectFit: 'contain'
                          }}
                        />
                        <div style={{ flex: '1 1 0%', minWidth: '0', width: '100%' }}>
                          <p style={{ 
                            color: settings.textColor, 
                            fontSize: `${settings.scanTextSize}px`,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            margin: '0',
                            padding: '0',
                            lineHeight: '1.3'
                          }} className="font-semibold mb-1">
                            {settings.scanTextBg}
                          </p>
                          <p style={{ 
                            color: settings.textColor, 
                            fontSize: `${settings.scanTextSize}px`,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            margin: '0',
                            padding: '0',
                            lineHeight: '1.3'
                          }} className="font-semibold">
                            {settings.scanTextEn}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* QR Redirects Modal */}
      {showRedirectsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">🔗 Пренасочвания</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Управление на URL адресите на QR кодовете. Промените се прилагат веднага без да принтирате нови кодове.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRedirectsModal(false);
                  cancelEditingRedirect();
                }}
                className="text-white text-3xl hover:text-gray-300 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Toast Notification */}
            {redirectsToast && (
              <div className={`px-6 py-3 ${redirectsToast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {redirectsToast.message}
              </div>
            )}

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {redirectsLoading ? (
                <div className="text-center py-12">
                  <p className="text-white">Зареждане...</p>
                </div>
              ) : (
                <>
                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Всички маси</div>
                      <div className="text-3xl font-bold text-white">{redirectTables.length}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Активни</div>
                      <div className="text-3xl font-bold text-green-500">
                        {redirectTables.filter(t => t.isActive).length}
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Деактивирани</div>
                      <div className="text-3xl font-bold text-red-500">
                        {redirectTables.filter(t => !t.isActive).length}
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Общо сканирания</div>
                      <div className="text-3xl font-bold text-blue-500">
                        {redirectTables.reduce((sum, t) => sum + t.scanCount, 0)}
                      </div>
                    </div>
                  </div>

                  {/* Tables List */}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-950 border-b border-gray-800">
                          <tr>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Маса</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Статус</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">QR Link</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Redirect URL</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Сканирания</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Последно</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {redirectTables.map((table) => (
                            <tr key={table.id} className={!table.isActive ? 'opacity-50' : ''}>
                              <td className="px-4 py-3">
                                {editingTable === table.tableNumber ? (
                                  <input
                                    type="text"
                                    value={editTableName}
                                    onChange={(e) => setEditTableName(e.target.value)}
                                    placeholder={`Маса ${table.tableNumber}`}
                                    className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-white focus:outline-none"
                                  />
                                ) : (
                                  <>
                                    <div className="font-semibold text-white">
                                      Маса {table.tableNumber}
                                    </div>
                                    {table.tableName && (
                                      <div className="text-sm text-gray-400">{table.tableName}</div>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {editingTable === table.tableNumber ? (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editIsActive}
                                      onChange={(e) => setEditIsActive(e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-600"
                                    />
                                    <span className="text-white text-sm">
                                      {editIsActive ? 'Активна' : 'Спряна'}
                                    </span>
                                  </label>
                                ) : (
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    table.isActive
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {table.isActive ? '✓ Активна' : '✗ Спряна'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                  /t/{table.tableNumber}
                                </code>
                              </td>
                              <td className="px-4 py-3">
                                {editingTable === table.tableNumber ? (
                                  <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-white focus:outline-none"
                                    placeholder="/order?table=1"
                                  />
                                ) : (
                                  <code className="text-sm text-gray-300">
                                    {table.redirectUrl || `/order?table=${table.tableNumber}`}
                                  </code>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-white font-semibold">{table.scanCount}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-400">
                                {formatDate(table.lastScannedAt)}
                              </td>
                              <td className="px-4 py-3">
                                {editingTable === table.tableNumber ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => saveRedirect(table.tableNumber)}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                    >
                                      ✓ Запази
                                    </button>
                                    <button
                                      onClick={cancelEditingRedirect}
                                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                    >
                                      ✗ Откажи
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditingRedirect(table)}
                                    className="px-3 py-1 bg-white hover:bg-gray-200 text-black text-sm rounded transition-colors"
                                  >
                                    ✎ Редактирай
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-blue-400 font-semibold mb-2">💡 Как работят динамичните QR кодове?</h3>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li>• QR кодът винаги води към <code className="bg-blue-500/20 px-1 rounded">/t/[номер]</code> (кратък линк)</li>
                      <li>• Кратият линк redirect-ва към URL-а който сте настроили тук</li>
                      <li>• Можете да сменяте URL-а по всяко време без да принтирате нови кодове</li>
                      <li>• Можете да спрете временно маса като я деактивирате</li>
                      <li>• Статистиките показват колко пъти е сканиран всеки код</li>
                      <li>• <strong>Важно:</strong> Ако сменяте Redirect URL, не е нужно да регенерирате QR кода - той винаги води към /t/[номер]</li>
                      <li>• <strong>QR Link (/t/[номер]):</strong> Това е статичен URL който е вграден в QR кода. Ако искате да го промените, трябва да регенерирате QR кода.</li>
                      <li>• <strong>Redirect URL:</strong> Това е динамичен URL към който /t/[номер] пренасочва. Можете да го променяте по всяко време без да регенерирате QR кода.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


