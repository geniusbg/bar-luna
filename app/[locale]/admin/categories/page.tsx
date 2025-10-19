'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name_bg: '',
    name_en: '',
    name_de: '',
    slug: '',
    order: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data.categories || []);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingId 
      ? `/api/categories/${editingId}` 
      : '/api/categories';
    
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      loadCategories();
      resetForm();
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name_bg: category.nameBg,
      name_en: category.nameEn,
      name_de: category.nameDe,
      slug: category.slug,
      order: category.order
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Сигурен ли си, че искаш да изтриеш "${name}"?`)) {
      return;
    }

    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadCategories();
    } else {
      alert('Грешка при изтриване на категорията');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name_bg: '',
      name_en: '',
      name_de: '',
      slug: '',
      order: 0
    });
  };

  if (loading) {
    return (
      <div className="text-white text-2xl">Зареждане...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 md:mb-8">Категории</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editingId ? 'Редактирай категория' : 'Добави категория'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Име (БГ) *</label>
              <input
                type="text"
                value={formData.name_bg}
                onChange={(e) => setFormData({ ...formData, name_bg: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
                required
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
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all"
              >
                {editingId ? 'Обнови' : 'Добави'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  Отказ
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Съществуващи категории ({categories.length})
          </h2>
          
          {categories.length === 0 ? (
            <p className="text-gray-200">Няма категории. Добави първата категория!</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category: any) => (
                <div
                  key={category.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{category.nameBg}</h3>
                      <p className="text-gray-300 text-sm">
                        EN: {category.nameEn} • DE: {category.nameDe}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Slug: {category.slug} • Подредба: {category.order}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg text-sm font-medium transition-all"
                    >
                      Редактирай
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.nameBg)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Изтрий
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

