'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { displayPrice } from '@/lib/currency';
import Toast from '@/components/Toast';

export default function AdminProductsPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/categories')
    ]);

    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();

    setProducts(productsData.products || []);
    setCategories(categoriesData.categories || []);
    setLoading(false);
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: any) => c.id === categoryId);
    return category ? category.nameBg : 'Unknown';
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Сигурен ли си, че искаш да изтриеш "${productName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reload products
        loadData();
        setToast({ message: '✅ Продуктът е изтрит успешно', type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Грешка при изтриване на продукта', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при изтриване на продукта', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="text-white text-2xl">Зареждане...</div>
    );
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Продукти</h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all text-center"
        >
          + Добави продукт
        </Link>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Всички ({products.length})
        </button>
        {categories.map((category: any) => {
          const count = products.filter(p => p.categoryId === category.id).length;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.nameBg} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Снимка</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Име</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Категория</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Цена</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Статус</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredProducts.map((product: any) => (
              <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  {product.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.nameBg}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.isFeatured && <span className="text-yellow-400">⭐</span>}
                    <span className="text-white font-medium">{product.nameBg}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-200">
                  {getCategoryName(product.categoryId)}
                </td>
                <td className="px-6 py-4 text-white">
                  <div className="flex flex-col">
                    <span className="font-semibold">{displayPrice(Number(product.priceBgn), 'BGN')}</span>
                    <span className="text-sm text-gray-300">{displayPrice(Number(product.priceBgn), 'EUR')}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {product.isHidden ? (
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-300 inline-block text-center">
                        🚫 Скрит
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm inline-block text-center ${
                        product.isAvailable 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {product.isAvailable ? '✅ Налично' : '⚠️ Не е наличен'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/admin/products/${product.id}/edit`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all"
                    >
                      Редактирай
                    </Link>
                    <button 
                      onClick={() => handleDelete(product.id, product.nameBg)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
                    >
                      Изтрий
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

