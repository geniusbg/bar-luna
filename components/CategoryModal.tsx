'use client';

import { useEffect, useState } from 'react';
import { useLockScroll } from '@/lib/use-lock-scroll';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>; // Returns true on success
  category?: any; // For editing existing category
  categories?: any[]; // All categories for parent selection
}

export default function CategoryModal({ isOpen, onClose, onSubmit, category, categories = [] }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name_bg: '',
    name_en: '',
    name_de: '',
    order: 0,
    parent_category_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [translatingField, setTranslatingField] = useState<'name_en' | 'name_de' | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Lock scroll when modal is open (backdrop locked, modal can scroll)
  useLockScroll(isOpen);


  const handleTranslate = async (field: 'name_en' | 'name_de', targetLang: 'en' | 'de') => {
    const source = formData.name_bg.trim();
    if (!source) {
      setTranslationError('Моля, въведете име на български, за да използвате автоматичен превод.');
      return;
    }

    setTranslationError(null);
    setTranslatingField(field);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: source,
          targetLang
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      if (data?.text) {
        setFormData((prev) => ({
          ...prev,
          [field]: data.text
        }));
      } else {
        setTranslationError('Неуспешно получаване на превода. Опитайте отново.');
      }
    } catch (error) {
      setTranslationError('Неуспешен превод. Моля, опитайте отново.');
    } finally {
      setTranslatingField(null);
    }
  };

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (!isOpen) return;
    if (category) {
      setFormData({
        name_bg: category.nameBg || '',
        name_en: category.nameEn || '',
        name_de: category.nameDe || '',
        order: category.order || 0,
        parent_category_id: category.parentCategoryId || ''
      });
    } else {
      setFormData({
        name_bg: '',
        name_en: '',
        name_de: '',
        order: 0,
        parent_category_id: ''
      });
    }
  }, [isOpen, category]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await onSubmit(formData);
      // Only close modal if submission was successful
      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {category ? 'Редактирай категория' : 'Добави нова категория'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Име (БГ) *</label>
              <input
                type="text"
                value={formData.name_bg}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name_bg: e.target.value
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-300 font-semibold">Name (EN) *</label>
                <button
                  type="button"
                  onClick={() => handleTranslate('name_en', 'en')}
                  disabled={!formData.name_bg || translatingField === 'name_en'}
                  className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
                >
                  {translatingField === 'name_en' ? 'Превеждам...' : 'Авто превод'}
                </button>
              </div>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name_en: e.target.value
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-gray-300 font-semibold">Name (DE) *</label>
                <button
                  type="button"
                  onClick={() => handleTranslate('name_de', 'de')}
                  disabled={!formData.name_bg || translatingField === 'name_de'}
                  className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
                >
                  {translatingField === 'name_de' ? 'Превеждам...' : 'Авто превод'}
                </button>
              </div>
              <input
                type="text"
                value={formData.name_de}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name_de: e.target.value
                  }))
                }
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>

            {translationError && (
              <p className="text-sm text-red-400">{translationError}</p>
            )}

            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Родителска категория
                <span className="ml-2 text-sm text-gray-400 font-normal">(остави празно за главна категория)</span>
              </label>
              <select
                value={formData.parent_category_id}
                onChange={(e) => setFormData({ ...formData, parent_category_id: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
              >
                <option value="">-- Главна категория --</option>
                {categories
                  .filter((c: any) => !c.parentCategoryId && c.id !== category?.id) // Only parent categories, exclude self
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBg}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Подредба
                <span className="ml-2 text-sm text-gray-400 font-normal">(по-малко = показва се по-рано)</span>
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {category ? 'Обновяване...' : 'Добавяне...'}
                  </span>
                ) : (
                  category ? 'Обнови' : 'Добави'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отказ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

