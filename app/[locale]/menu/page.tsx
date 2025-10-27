'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';

export default function MenuPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu')
      ]);

      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();

      setCategories(categoriesData.categories || []);
      setProducts(productsData.products || []);
      
      // Set first category as active
      if (categoriesData.categories && categoriesData.categories.length > 0) {
        setActiveCategory(categoriesData.categories[0].id);
      }
      
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="logo-container h-80 w-80 md:h-[28rem] md:w-[28rem] mx-auto mb-10 animate-pulse-glow">
            <Image
              src="/bg/luna-logo.svg"
              alt="LUNA Logo"
              width={448}
              height={448}
              className="h-80 w-80 md:h-[28rem] md:w-[28rem]"
              priority
            />
          </div>
          <p className="text-white text-3xl font-medium">
            {locale === 'bg' ? 'Зареждане...' : locale === 'en' ? 'Loading...' : 'Laden...'}
          </p>
        </div>
      </main>
    );
  }

  const categoryProducts = products.filter((p: any) => p.categoryId === activeCategory);

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Header with gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black py-12 md:py-16 border-b border-gray-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/10 via-black to-black"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {locale === 'bg' ? '🍸 Нашето Меню' : locale === 'en' ? '🍸 Our Menu' : '🍸 Unser Menü'}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6">
              {locale === 'bg' ? 'Открийте нашата селекция от напитки и деликатеси' : 
               locale === 'en' ? 'Discover our selection of drinks and delicacies' : 
               'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten'}
            </p>

            {/* Dual Currency Info */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900/50 border border-gray-700 rounded-full text-gray-300 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">
                {locale === 'bg' ? 'Цени в' : locale === 'en' ? 'Prices in' : 'Preise in'} <span className="font-bold text-white">BGN / EUR</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">

        {/* Category Tabs - Sticky on scroll */}
        <div className="sticky top-16 z-30 bg-black/95 backdrop-blur-lg border-y border-gray-800 py-4 -mx-4 px-4 mb-8">
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar">
            <div className="flex gap-3 min-w-max mx-auto justify-center px-4">
              {categories.map((category: any) => {
                const categoryName = locale === 'bg' ? category.nameBg : 
                                   locale === 'en' ? category.nameEn : 
                                   category.nameDe;
                const isActive = category.id === activeCategory;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Desktop: Multi-row grid */}
          <div className="hidden md:block">
            <div className="flex flex-wrap gap-3 justify-center max-w-6xl mx-auto">
              {categories.map((category: any) => {
                const categoryName = locale === 'bg' ? category.nameBg : 
                                   locale === 'en' ? category.nameEn : 
                                   category.nameDe;
                const isActive = category.id === activeCategory;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {categoryProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-300 text-xl">
              {locale === 'bg' ? 'Няма продукти в тази категория' : 
               locale === 'en' ? 'No products in this category' : 
               'Keine Produkte in dieser Kategorie'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product: any) => {
              const productName = locale === 'bg' ? product.nameBg : locale === 'en' ? product.nameEn : product.nameDe;
              const productDesc = locale === 'bg' ? product.descriptionBg : locale === 'en' ? product.descriptionEn : product.descriptionDe;

              return (
                <div
                  key={product.id}
                  className={`group relative bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl overflow-hidden hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1 ${
                    !product.isAvailable ? 'opacity-60' : ''
                  }`}
                >
                  {/* Unavailable Badge */}
                  {!product.isAvailable && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg">
                      {locale === 'bg' ? '✕ Не е наличен' : 
                       locale === 'en' ? '✕ Unavailable' : 
                       '✕ Nicht verfügbar'}
                    </div>
                  )}
                  
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className={`relative h-56 overflow-hidden bg-black ${
                      !product.isAvailable ? 'grayscale' : ''
                    }`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={productName}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-200 transition-colors">
                      {productName}
                    </h3>
                    
                    {productDesc && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {productDesc}
                      </p>
                    )}
                    
                    {/* Price - with gradient background */}
                    <div className="pt-4 border-t border-gray-700/50">
                      <Price
                        priceBgn={Number(product.priceBgn)}
                        className="text-2xl font-bold text-white"
                        unit={product.unit}
                        quantity={product.quantity}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
