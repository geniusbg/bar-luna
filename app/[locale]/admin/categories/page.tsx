'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Toast from '@/components/Toast';
import CategoryModal from '@/components/CategoryModal';
import LoadingScreen from '@/components/LoadingScreen';

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
    return <LoadingScreen locale={locale} />;
  }

  const renderCategoryTree = (parentId: string | null, depth = 0) => {
    const children = categories
      .filter((c: any) => (c.parentCategoryId ?? null) === parentId)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    if (children.length === 0) return null;

    return (
      <div className={depth === 0 ? 'space-y-6' : 'space-y-3'}>
        {children.map((cat: any) => {
          const hasChildren = categories.some((c: any) => c.parentCategoryId === cat.id);
          const isRoot = depth === 0;

          return (
            <div key={cat.id} className="space-y-3">
              <div
                className={[
                  'malts-card transition-all',
                  isRoot
                    ? 'p-6 border-2 border-[var(--malts-hairline)] hover:border-[var(--malts-accent-tint-border)]'
                    : 'p-4 border border-[var(--malts-hairline)] hover:border-[var(--malts-accent-tint-border)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={isRoot ? 'font-bold text-xl mb-4 flex items-center gap-2' : 'font-semibold text-lg mb-2 flex items-center gap-2'}>
                      <span className="text-[var(--malts-accent)]" aria-hidden>
                        {isRoot ? '📁' : '└─'}
                      </span>
                      <span className="text-[var(--malts-ink)]">{cat.nameBg}</span>
                    </h3>

                    <div className={isRoot ? 'space-y-2 mb-4' : 'space-y-1 mb-3'}>
                      <div className="flex items-center gap-2">
                        <span className="malts-subtle text-xs uppercase w-8">EN:</span>
                        <span className="malts-muted text-sm">{cat.nameEn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="malts-subtle text-xs uppercase w-8">RO:</span>
                        <span className="malts-muted text-sm">{cat.nameRo}</span>
                      </div>
                    </div>

                    <div className={isRoot ? 'mb-4 pt-4 border-t border-[var(--malts-hairline)]' : 'mb-3 pt-3 border-t border-[var(--malts-hairline)]'}>
                      <div className="flex justify-between items-center">
                        <span className="malts-subtle text-xs">Slug</span>
                        <span className="malts-muted text-sm font-mono">{cat.slug}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="malts-subtle text-xs">Подредба</span>
                        <span className="malts-muted text-sm">{cat.order}</span>
                      </div>
                      {hasChildren && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="malts-subtle text-xs">Подкатегории</span>
                          <span className="malts-muted text-sm">
                            {categories.filter((c: any) => c.parentCategoryId === cat.id).length}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="flex-1 px-4 py-2 malts-btn-secondary rounded-lg text-sm font-semibold transition-all"
                      >
                        Редактирай
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nameBg)}
                        className="px-4 py-2 malts-btn-danger rounded-lg text-sm font-semibold transition-all"
                      >
                        Изтрий
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {hasChildren && (
                <div className="ml-6 pl-6 border-l-2 border-[var(--malts-hairline)]">
                  {renderCategoryTree(cat.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
        <h1 className="text-3xl md:text-4xl font-bold">Категории</h1>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3 malts-btn-primary rounded-lg font-semibold transition-all"
        >
          + Добави категория
        </button>
      </div>

      {/* List */}
      <div className="malts-card p-4 md:p-8">
        {categories.length === 0 ? (
          <p className="malts-muted">Няма категории. Добави първата категория!</p>
        ) : (
          <div>{renderCategoryTree(null, 0)}</div>
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

