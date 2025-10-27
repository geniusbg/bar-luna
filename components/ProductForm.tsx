'use client';

import { useState } from 'react';
import { Category } from '@/lib/types';
import { bgnToEur } from '@/lib/currency';
import ImageUpload from './ImageUpload';

interface ProductFormProps {
  categories: Category[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  locale: string;
}

export default function ProductForm({ categories, initialData, onSubmit, locale }: ProductFormProps) {
  const [formData, setFormData] = useState(initialData || {
    name_bg: '',
    name_en: '',
    name_de: '',
    description_bg: '',
    description_en: '',
    description_de: '',
    category_id: categories[0]?.id || '',
    price_bgn: 0,
    is_available: true,
    is_hidden: false,
    is_featured: false,
    image_url: '',
    order: 0
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Calculate EUR price
    const dataToSubmit = {
      ...formData,
      price_eur: bgnToEur(formData.price_bgn)
    };

    try {
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">Категория</label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
          required
        >
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_bg || cat.nameBg || ''}
            </option>
          ))}
        </select>
      </div>

      {/* Names */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Име (БГ) *</label>
          <input
            type="text"
            name="name_bg"
            value={formData.name_bg}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Name (EN) *</label>
          <input
            type="text"
            name="name_en"
            value={formData.name_en}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Name (DE) *</label>
          <input
            type="text"
            name="name_de"
            value={formData.name_de}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Описание (БГ)</label>
          <textarea
            name="description_bg"
            value={formData.description_bg}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Description (EN)</label>
          <textarea
            name="description_en"
            value={formData.description_en}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Beschreibung (DE)</label>
          <textarea
            name="description_de"
            value={formData.description_de}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
          />
        </div>
      </div>

      {/* Price and Order */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Цена (BGN) *</label>
          <input
            type="number"
            name="price_bgn"
            value={formData.price_bgn}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
          <p className="text-gray-400 text-sm mt-1">
            EUR: €{bgnToEur(formData.price_bgn).toFixed(2)}
          </p>
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Подредба
            <span className="ml-2 text-sm text-gray-400 font-normal">
              (по-малко число = показва се по-рано)
            </span>
          </label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            placeholder="0, 1, 2, 3..."
          />
          <p className="text-sm text-gray-400 mt-1">
            Използвай за да контролираш реда на продуктите в менюто
          </p>
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">
            Снимка на продукта
          </label>
          <p className="text-gray-400 text-sm mb-4">
            💡 Избери ЕДИН от двата начина:
          </p>
        </div>

        {/* Option 1: Upload local file */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold mb-3">Вариант 1: Upload от компютъра</h3>
          <ImageUpload
            currentImageUrl={formData.image_url}
            onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
            bucket="product-images"
          />
          <p className="text-gray-400 text-xs mt-2">
            Снимките се запазват в /public/uploads/ и се достъпват чрез /uploads/filename.jpg
          </p>
        </div>

        {/* Option 2: External URL */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold mb-3">Вариант 2: Външен URL (от интернет)</h3>
          <input
            type="text"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-gray-400 text-xs mt-2">
            Ако използваш upload (Вариант 1), това поле ще се попълни автоматично
          </p>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Видимост и статус</h3>
          <div className="space-y-3">
            <label className="flex items-start gap-3 text-white cursor-pointer">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500"
              />
              <div>
                <span className="font-semibold">✅ Налично</span>
                <p className="text-sm text-gray-300 mt-1">
                  Махни отметката ако продукта е временно неналичен. Ще се показва в менюто с избледнял ефект и "Не е наличен" етикет.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 text-white cursor-pointer">
              <input
                type="checkbox"
                name="is_hidden"
                checked={formData.is_hidden}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="font-semibold">🚫 Скрит</span>
                <p className="text-sm text-gray-300 mt-1">
                  Продуктът НЕ ще се показва в менюто. Използвай за продукти които временно не предлагаш или са в подготовка.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 text-white cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-700 text-yellow-600 focus:ring-yellow-500"
              />
              <div>
                <span className="font-semibold">⭐ Препоръчано</span>
                <p className="text-sm text-gray-300 mt-1">
                  Продуктът ще има звезда икона за да се откроява като специална препоръка.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'Запазване...' : 'Запази'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
        >
          Отказ
        </button>
      </div>
    </form>
  );
}


