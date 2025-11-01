'use client';

import { useEffect, useState } from 'react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>; // Returns true on success
  category?: any; // For editing existing category
}

export default function CategoryModal({ isOpen, onClose, onSubmit, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name_bg: '',
    name_en: '',
    name_de: '',
    slug: '',
    order: 0
  });

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name_bg: category.nameBg || '',
          name_en: category.nameEn || '',
          name_de: category.nameDe || '',
          slug: category.slug || '',
          order: category.order || 0
        });
      } else {
        setFormData({
          name_bg: '',
          name_en: '',
          name_de: '',
          slug: '',
          order: 0
        });
      }
    }
  }, [isOpen, category]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    // Only close modal if submission was successful
    if (success) {
      onClose();
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
                onChange={(e) => setFormData({ ...formData, name_bg: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Name (EN) *</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">Name (DE) *</label>
              <input
                type="text"
                value={formData.name_de}
                onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Slug (URL)
                <span className="ml-2 text-sm text-gray-400 font-normal">(cocktails, coffee, food...)</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
              />
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
                className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all flex-1"
              >
                {category ? 'Обнови' : 'Добави'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
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

