'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { displayPrice } from '@/lib/currency';
import Toast from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';

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
    if (!confirm(`Сигурен ли си, че искаш да изтриеш "${productName}"?\n\nАко продуктът има поръчки, ще бъде само скрит. Ако няма поръчки, ще бъде изтрит перманентно.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        // Reload products
        loadData();
        setToast({ message: `✅ ${data.message}`, type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Грешка при изтриване на продукта', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при изтриване на продукта', type: 'error' });
    }
  };

  if (loading) {
    return <LoadingScreen locale={locale} />;
  }

  const filteredProducts = products.filter(product => {
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      product.nameBg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameRo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--malts-ink)]">Продукти</h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="w-full sm:w-auto px-6 py-3 malts-btn-primary rounded-lg font-semibold transition-all text-center"
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
                ? 'bg-[var(--malts-accent)] text-[#f5f0e6]'
                : 'bg-[var(--malts-card)] text-[var(--malts-ink)] border border-[var(--malts-hairline)] hover:bg-[var(--malts-card-hover)]'
            }`}
          >
            Всички ({products.length})
          </button>
          {categories.map((category: any) => {
            const count = products.filter(p => p.categoryId === category.id && 
              (searchQuery === '' || 
                p.nameBg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.nameRo?.toLowerCase().includes(searchQuery.toLowerCase())
              )).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-[var(--malts-accent)] text-[#f5f0e6]'
                    : 'bg-[var(--malts-card)] text-[var(--malts-ink)] border border-[var(--malts-hairline)] hover:bg-[var(--malts-card-hover)]'
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
          className="malts-field"
        />
      </div>

      {/* Products Grid - Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product: any) => (
          <div
            key={product.id}
            className="malts-card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Product Image */}
            {product.imageUrl ? (
              <div className="relative h-48 overflow-hidden bg-[var(--malts-inset)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.nameBg}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-48 bg-[var(--malts-inset)] flex items-center justify-center">
                <svg className="w-16 h-16 text-[var(--malts-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Product Info */}
            <div className="p-4">
              {/* Name with Price and Status in one row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--malts-ink)] flex items-center gap-2 mb-1">
                    {product.isFeatured && <span className="text-yellow-400">⭐</span>}
                    {product.nameBg}
                  </h3>
                  <p className="malts-subtle text-xs">{getCategoryName(product.categoryId)}</p>
                </div>
                <div className="text-right ml-3">
                  <div className="text-xl font-bold text-[var(--malts-ink)]">{displayPrice(Number(product.priceBgn), 'BGN')}</div>
                  <div className="text-xs malts-subtle">{displayPrice(Number(product.priceBgn), 'EUR')}</div>
                  {product.unit && product.quantity && (
                    <div className="text-xs malts-subtle mt-1">
                      {product.quantity} {product.unit === 'pcs' ? 'бр.' : product.unit}
                    </div>
                  )}
                  <div className="mt-1">
                    {product.isHidden ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--malts-inset)] border border-[var(--malts-hairline)] text-[var(--malts-ink)] inline-block">
                        🚫 Скрит
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs inline-block ${
                        product.isAvailable 
                          ? 'bg-[rgba(22,101,52,0.12)] text-[var(--malts-success)] border border-[rgba(22,101,52,0.25)]'
                          : 'bg-[rgba(146,64,14,0.12)] text-[var(--malts-warning)] border border-[rgba(146,64,14,0.25)]'
                      }`}>
                        {product.isAvailable ? '✅ Налично' : '⚠️ Не е наличен'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {(() => {
                const description = 
                  (locale === 'bg' && product.descriptionBg) ||
                  (locale === 'en' && product.descriptionEn) ||
                  (locale === 'ro' && product.descriptionRo) ||
                  product.descriptionBg ||
                  product.descriptionEn ||
                  product.descriptionRo;
                
                return description ? (
                  <div className="mb-3">
                    <p className="malts-muted text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {description}
                    </p>
                  </div>
                ) : null;
              })()}

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/${locale}/admin/products/${product.id}/edit`}
                  className="flex-1 px-3 py-2 malts-btn-secondary rounded-lg text-sm font-semibold transition-all text-center"
                >
                  Редактирай
                </Link>
                <button
                  onClick={() => handleDelete(product.id, product.nameBg)}
                  className="flex-1 px-3 py-2 malts-btn-danger rounded-lg text-sm font-semibold transition-all"
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

