'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';
import LoadingScreen from '@/components/LoadingScreen';

function MenuPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split('/')[1] || 'bg';
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [menuSettings, setMenuSettings] = useState<{
    titleBg: string;
    titleEn: string;
    titleDe: string;
    subtitleBg: string;
    subtitleEn: string;
    subtitleDe: string;
    backgroundImageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      const [categoriesRes, productsRes, settingsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu'),
        fetch('/api/menu-settings')
      ]);

      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();
      const settingsData = await settingsRes.json();

      setCategories(categoriesData.categories || []);
      setProducts(productsData.products || []);
      
      if (settingsData.settings) {
        setMenuSettings(settingsData.settings);
      } else {
        // Fallback to defaults
        setMenuSettings({
          titleBg: '🍸 Нашето Меню',
          titleEn: '🍸 Our Menu',
          titleDe: '🍸 Unser Menü',
          subtitleBg: 'Открийте нашата селекция от напитки и деликатеси',
          subtitleEn: 'Discover our selection of drinks and delicacies',
          subtitleDe: 'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten',
          backgroundImageUrl: null
        });
      }
      
      // Check URL params for category and product
      const categoryParam = searchParams.get('category');
      const productParam = searchParams.get('product');
      
      // Set active category from URL or first category
      if (categoryParam && categoriesData.categories?.some((c: any) => c.id === categoryParam)) {
        const selectedCategory = categoriesData.categories.find((c: any) => c.id === categoryParam);
        if (selectedCategory?.parentCategoryId) {
          // If it's a subcategory, set parent as active and subcategory
          setActiveCategory(selectedCategory.parentCategoryId);
          setActiveSubCategory(categoryParam);
        } else {
          setActiveCategory(categoryParam);
          setActiveSubCategory('');
        }
      } else if (categoriesData.categories && categoriesData.categories.length > 0) {
        // Find first parent category
        const firstParent = categoriesData.categories.find((c: any) => !c.parentCategoryId);
        if (firstParent) {
          setActiveCategory(firstParent.id);
          // If parent has subcategories, select first one
          const firstSub = categoriesData.categories.find((c: any) => c.parentCategoryId === firstParent.id);
          if (firstSub) {
            setActiveSubCategory(firstSub.id);
          } else {
            setActiveSubCategory('');
          }
        }
      }
      
      // Scroll to product if specified
      if (productParam) {
        setTimeout(() => {
          const productElement = document.getElementById(`product-${productParam}`);
          if (productElement) {
            productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the product briefly
            productElement.classList.add('ring-2', 'ring-white', 'ring-opacity-50');
            setTimeout(() => {
              productElement.classList.remove('ring-2', 'ring-white', 'ring-opacity-50');
            }, 2000);
          }
        }, 500);
      }
      
      setLoading(false);
    }

    loadData();
  }, [searchParams]);

  if (loading) {
    return <LoadingScreen locale={locale} />;
  }

  // Get parent categories and subcategories
  const parentCategories = categories.filter((c: any) => !c.parentCategoryId);
  const subCategories = categories.filter((c: any) => c.parentCategoryId === activeCategory);
  
  // Determine which category to show products from
  const displayCategoryId = activeSubCategory || activeCategory;
  const categoryProducts = products.filter((p: any) => p.categoryId === displayCategoryId);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    // If category has subcategories, select first one, otherwise show parent's products
    const subs = categories.filter((c: any) => c.parentCategoryId === categoryId);
    if (subs.length > 0) {
      setActiveSubCategory(subs[0].id);
    } else {
      setActiveSubCategory('');
    }
  };
  
  const handleSubCategorySelect = (subCategoryId: string) => {
    setActiveSubCategory(subCategoryId);
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Header with gradient */}
      <div 
        className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black py-12 md:py-16 border-b border-gray-800"
        style={{
          backgroundImage: menuSettings?.backgroundImageUrl 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${menuSettings.backgroundImageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/10 via-black to-black"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {menuSettings 
                ? (locale === 'bg' ? menuSettings.titleBg : locale === 'en' ? menuSettings.titleEn : menuSettings.titleDe)
                : (locale === 'bg' ? '🍸 Нашето Меню' : locale === 'en' ? '🍸 Our Menu' : '🍸 Unser Menü')
              }
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6">
              {menuSettings
                ? (locale === 'bg' ? menuSettings.subtitleBg : locale === 'en' ? menuSettings.subtitleEn : menuSettings.subtitleDe)
                : (locale === 'bg' ? 'Открийте нашата селекция от напитки и деликатеси' : 
                   locale === 'en' ? 'Discover our selection of drinks and delicacies' : 
                   'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten')
              }
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
          {/* Parent Categories - Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar mb-3">
            <div className="flex gap-3 min-w-max mx-auto justify-center px-4">
              {parentCategories.map((category: any) => {
                const categoryName = locale === 'bg' ? category.nameBg : 
                                   locale === 'en' ? category.nameEn : 
                                   category.nameDe;
                const isActive = category.id === activeCategory;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
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
          
          {/* Parent Categories - Desktop: Multi-row grid */}
          <div className="hidden md:block mb-3">
            <div className="flex flex-wrap gap-3 justify-center max-w-6xl mx-auto">
              {parentCategories.map((category: any) => {
                const categoryName = locale === 'bg' ? category.nameBg : 
                                   locale === 'en' ? category.nameEn : 
                                   category.nameDe;
                const isActive = category.id === activeCategory;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
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
          
          {/* Subcategories - Only show if parent has subcategories */}
          {subCategories.length > 0 && (
            <>
              {/* Mobile: Horizontal scroll */}
              <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar">
                <div className="flex gap-2 min-w-max mx-auto justify-center px-4">
                  {subCategories.map((subCategory: any) => {
                    const subCategoryName = locale === 'bg' ? subCategory.nameBg : 
                                          locale === 'en' ? subCategory.nameEn : 
                                          subCategory.nameDe;
                    const isActive = subCategory.id === activeSubCategory;
                    
                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => handleSubCategorySelect(subCategory.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                          isActive
                            ? 'bg-gray-700 text-white border-2 border-white/50'
                            : 'bg-gray-800/30 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border border-gray-700/50'
                        }`}
                      >
                        {subCategoryName}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Desktop: Flex wrap */}
              <div className="hidden md:block">
                <div className="flex flex-wrap gap-2 justify-center max-w-6xl mx-auto">
                  {subCategories.map((subCategory: any) => {
                    const subCategoryName = locale === 'bg' ? subCategory.nameBg : 
                                          locale === 'en' ? subCategory.nameEn : 
                                          subCategory.nameDe;
                    const isActive = subCategory.id === activeSubCategory;
                    
                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => handleSubCategorySelect(subCategory.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                          isActive
                            ? 'bg-gray-700 text-white border-2 border-white/50'
                            : 'bg-gray-800/30 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300 border border-gray-700/50'
                        }`}
                      >
                        {subCategoryName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
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
                  id={`product-${product.id}`}
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
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed break-words whitespace-pre-wrap">
                        {productDesc}
                      </p>
                    )}
                    
                    {/* Price and Unit */}
                    <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center">
                      <Price
                        priceBgn={Number(product.priceBgn)}
                        className="text-2xl font-bold text-white"
                        showBoth={true}
                        inline={true}
                      />
                      {product.unit && product.quantity && (
                        <span className="text-sm text-gray-400">
                          {product.quantity} {product.unit === 'pcs' ? 'бр.' : product.unit}
                        </span>
                      )}
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

export default function MenuPage() {
  return (
    <Suspense fallback={
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
          <p className="text-white text-3xl font-medium">Зареждане...</p>
        </div>
      </main>
    }>
      <MenuPageContent />
    </Suspense>
  );
}
