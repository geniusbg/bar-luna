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
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    if (!confirm(`Сигурен ли си, че искаш да скриеш "${productName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reload products
        loadData();
        setToast({ message: '✅ Продуктът е скрит успешно', type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Грешка при скриване на продукта', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при скриване на продукта', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="text-white text-2xl">Зареждане...</div>
    );
  }

  const filteredProducts = products.filter(product => {
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      product.nameBg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameDe?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

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
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Всички ({filteredProducts.length})
          </button>
          {categories.map((category: any) => {
            const count = products.filter(p => p.categoryId === category.id && 
              (searchQuery === '' || 
                p.nameBg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.nameDe?.toLowerCase().includes(searchQuery.toLowerCase())
              )).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
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
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Търси продукт..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {/* Products Grid - Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product: any) => (
          <div
            key={product.id}
            className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Product Image */}
            {product.imageUrl ? (
              <div className="relative h-48 overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.nameBg}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Product Info */}
            <div className="p-4">
              {/* Name with Price and Status in one row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                    {product.isFeatured && <span className="text-yellow-400">⭐</span>}
                    {product.nameBg}
                  </h3>
                  <p className="text-gray-400 text-xs">{getCategoryName(product.categoryId)}</p>
                </div>
                <div className="text-right ml-3">
                  <div className="text-xl font-bold text-white">{displayPrice(Number(product.priceBgn), 'BGN')}</div>
                  <div className="text-xs text-gray-400">{displayPrice(Number(product.priceBgn), 'EUR')}</div>
                  <div className="mt-1">
                    {product.isHidden ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-300 inline-block">
                        🚫 Скрит
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs inline-block ${
                        product.isAvailable 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {product.isAvailable ? '✅ Налично' : '⚠️ Не е наличен'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/${locale}/admin/products/${product.id}/edit`}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all text-center"
                >
                  Редактирай
                </Link>
                <button
                  onClick={() => handleDelete(product.id, product.nameBg)}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  Изтрий
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

