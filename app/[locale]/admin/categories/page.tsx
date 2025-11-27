'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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

  const handleModalSubmit = async (data: any): Promise<boolean> => {
    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Check if server is offline (503 or network error)
      if (response.status === 503 || !response.ok) {
        // Trigger offline banner
        if (typeof window !== 'undefined' && (window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        if (typeof window !== 'undefined' && (window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
        return false; // Keep modal open
      }

      if (response.ok) {
        loadCategories();
        setToast({ 
          message: editingCategory ? '✅ Категорията е обновена успешно' : '✅ Категорията е добавена успешно', 
          type: 'success' 
        });
        return true; // Close modal
      } else {
        const errorData = await response.json();
        setToast({ 
          message: errorData.error || 'Грешка при запазване на категорията', 
          type: 'error' 
        });
        return false; // Keep modal open
      }
    } catch (error: any) {
      // Network error or server offline
      if (error.name === 'TypeError' || error.message?.includes('fetch')) {
        // Trigger offline banner
        if (typeof window !== 'undefined' && (window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        if (typeof window !== 'undefined' && (window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
      }
      return false; // Keep modal open
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Сигурен ли си, че искаш да изтриеш "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });

      // Check if server is offline (503 or network error)
      if (response.status === 503) {
        // Trigger offline banner
        if (typeof window !== 'undefined' && (window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        if (typeof window !== 'undefined' && (window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
        return; // Don't show toast, offline banner will show
      }

      if (response.ok) {
        loadCategories();
        setToast({ message: '✅ Категорията е изтрита успешно', type: 'success' });
      } else {
        const data = await response.json().catch(() => ({ error: 'Грешка при изтриване на категорията' }));
        setToast({ message: data.error || 'Грешка при изтриване на категорията', type: 'error' });
      }
    } catch (error: any) {
      // Network error or server offline
      if (error.name === 'TypeError' || error.message?.includes('fetch')) {
        // Trigger offline banner
        if (typeof window !== 'undefined' && (window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        if (typeof window !== 'undefined' && (window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="logo-container h-64 w-64 md:h-96 md:w-96 mx-auto mb-10 animate-pulse-glow">
            <Image 
              src="/bg/luna-logo.svg"
              alt="LUNA Logo" 
              width={384}
              height={384}
              className="h-64 w-64 md:h-96 md:w-96"
              priority
            />
          </div>
          <p className="text-white text-3xl font-medium">Зареждане на категории...</p>
        </div>
      </div>
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
          <div className="space-y-6">
            {/* Group by parent categories */}
            {(() => {
              const parentCategories = categories.filter((c: any) => !c.parentCategoryId);
              const subCategories = categories.filter((c: any) => c.parentCategoryId);
              
              return (
                <>
                  {/* Parent Categories */}
                  {parentCategories.map((category: any) => {
                    const categorySubs = subCategories.filter((sc: any) => sc.parentCategoryId === category.id);
                    
                    return (
                      <div key={category.id} className="space-y-3">
                        {/* Parent Category Card */}
                        <div className="bg-gray-800 rounded-xl p-6 border-2 border-gray-600 hover:border-gray-500 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Category Name - Large */}
                              <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                                <span className="text-yellow-400">📁</span>
                                {category.nameBg}
                              </h3>
                              
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
                                {categorySubs.length > 0 && (
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-400 text-xs">Подкатегории</span>
                                    <span className="text-gray-300 text-sm">{categorySubs.length}</span>
                                  </div>
                                )}
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
                          </div>
                        </div>
                        
                        {/* Subcategories */}
                        {categorySubs.length > 0 && (
                          <div className="ml-6 pl-6 border-l-2 border-gray-700 space-y-3">
                            {categorySubs.map((subCategory: any) => (
                              <div
                                key={subCategory.id}
                                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                                      <span className="text-blue-400">└─</span>
                                      {subCategory.nameBg}
                                    </h4>
                                    
                                    <div className="space-y-1 mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs uppercase w-8">EN:</span>
                                        <span className="text-gray-300 text-xs">{subCategory.nameEn}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs uppercase w-8">DE:</span>
                                        <span className="text-gray-300 text-xs">{subCategory.nameDe}</span>
                                      </div>
                                    </div>

                                    <div className="mb-3 pt-3 border-t border-gray-700">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">Slug</span>
                                        <span className="text-gray-300 text-xs font-mono">{subCategory.slug}</span>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-gray-400 text-xs">Подредба</span>
                                        <span className="text-gray-300 text-xs">{subCategory.order}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleOpenEdit(subCategory)}
                                        className="flex-1 px-3 py-1.5 bg-white hover:bg-gray-200 text-black rounded-lg text-xs font-semibold transition-all"
                                      >
                                        Редактирай
                                      </button>
                                      <button
                                        onClick={() => handleDelete(subCategory.id, subCategory.nameBg)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all"
                                      >
                                        Изтрий
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        category={editingCategory}
        categories={categories}
      />
    </div>
  );
}

