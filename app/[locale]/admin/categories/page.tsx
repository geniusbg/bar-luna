'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import CategoryModal from '@/components/CategoryModal';

export default function AdminCategoriesPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data.categories || []);
    setLoading(false);
  }

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleModalSubmit = async (data: any) => {
    const url = editingCategory 
      ? `/api/categories/${editingCategory.id}` 
      : '/api/categories';
    
    const method = editingCategory ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      loadCategories();
      setToast({ 
        message: editingCategory ? '✅ Категорията е обновена успешно' : '✅ Категорията е добавена успешно', 
        type: 'success' 
      });
    } else {
      const errorData = await response.json();
      setToast({ 
        message: errorData.error || 'Грешка при запазване на категорията', 
        type: 'error' 
      });
    }
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
      setToast({ message: '✅ Категорията е изтрита успешно', type: 'success' });
    } else {
      const data = await response.json();
      setToast({ message: data.error || 'Грешка при изтриване на категорията', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="text-white text-2xl">Зареждане...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notification - hidden when offline */}
      {toast && typeof window !== 'undefined' && !(window as any).__isOffline && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Категории</h1>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all"
        >
          + Добави категория
        </button>
      </div>

      {/* List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-8">
        {categories.length === 0 ? (
          <p className="text-gray-200">Няма категории. Добави първата категория!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
              >
                {/* Category Name - Large */}
                <h3 className="text-white font-bold text-xl mb-4">{category.nameBg}</h3>
                
                {/* Translations */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs uppercase w-8">EN:</span>
                    <span className="text-gray-300 text-sm">{category.nameEn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs uppercase w-8">DE:</span>
                    <span className="text-gray-300 text-sm">{category.nameDe}</span>
                  </div>
                </div>

                {/* Slug and Order */}
                <div className="mb-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Slug</span>
                    <span className="text-gray-300 text-sm font-mono">{category.slug}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-xs">Подредба</span>
                    <span className="text-gray-300 text-sm">{category.order}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg text-sm font-semibold transition-all"
                  >
                    Редактирай
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.nameBg)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Изтрий
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        category={editingCategory}
      />
    </div>
  );
}

