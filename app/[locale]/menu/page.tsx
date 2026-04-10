'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';
import LoadingScreen from '@/components/LoadingScreen';
import { getChildrenOf, getCategoryName, resolveCategoryPath } from '@/lib/category-navigation';

function MenuPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split('/')[1] || 'bg';
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('');
  const [activeSubSubCategory, setActiveSubSubCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [menuSettings, setMenuSettings] = useState<{
    titleBg: string;
    titleEn: string;
    titleRo: string;
    subtitleBg: string;
    subtitleEn: string;
    subtitleRo: string;
    backgroundImageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoadProgress(8);
      const categoriesRes = await fetch('/api/categories');
      setLoadProgress(33);
      const productsRes = await fetch('/api/menu');
      setLoadProgress(66);
      const settingsRes = await fetch('/api/menu-settings');
      setLoadProgress(92);

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
          titleBg: '🍽️ Нашето Меню',
          titleEn: '🍽️ Our Menu',
          titleRo: '🍸 Meniul nostru',
          subtitleBg: 'Открийте нашата селекция от напитки и деликатеси',
          subtitleEn: 'Discover our selection of drinks and delicacies',
          subtitleRo: 'Descoperă selecția noastră de băuturi și delicatese',
          backgroundImageUrl: null
        });
      }
      
      // Check URL params for category and product
      const categoryParam = searchParams.get('category');
      const productParam = searchParams.get('product');
      const cats: any[] = categoriesData.categories || [];

      if (categoryParam && cats.some((c: any) => c.id === categoryParam)) {
        const path = resolveCategoryPath(cats, categoryParam);
        if (path[0]) setActiveCategory(path[0]);
        setActiveSubCategory(path[1] ?? '');
        setActiveSubSubCategory(path[2] ?? '');
      } else if (cats.length > 0) {
        const firstParent = cats.find((c: any) => !c.parentCategoryId);
        if (firstParent) {
          setActiveCategory(firstParent.id);
          const subs = getChildrenOf(cats, firstParent.id);
          if (subs[0]) {
            setActiveSubCategory(subs[0].id);
            const subSubs = getChildrenOf(cats, subs[0].id);
            setActiveSubSubCategory(subSubs[0]?.id ?? '');
          } else {
            setActiveSubCategory('');
            setActiveSubSubCategory('');
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
            productElement.classList.add('ring-2', 'ring-[var(--malts-accent)]', 'ring-opacity-60');
            setTimeout(() => {
              productElement.classList.remove('ring-2', 'ring-[var(--malts-accent)]', 'ring-opacity-60');
            }, 2000);
          }
        }, 500);
      }
      
      setLoadProgress(100);
      setLoading(false);
    }

    loadData();
  }, [searchParams]);

  if (loading) {
    return <LoadingScreen locale={locale} progress={loadProgress} />;
  }

  const parentCategories = categories.filter((c: any) => !c.parentCategoryId);
  const subCategories = getChildrenOf(categories, activeCategory);
  const subSubCategories = activeSubCategory ? getChildrenOf(categories, activeSubCategory) : [];

  const displayCategoryId = activeSubSubCategory || activeSubCategory || activeCategory;
  const categoryProducts = products.filter((p: any) => p.categoryId === displayCategoryId);

  const breadcrumbIds = resolveCategoryPath(categories, displayCategoryId).filter(Boolean);

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    const subs = getChildrenOf(categories, categoryId);
    if (subs[0]) {
      setActiveSubCategory(subs[0].id);
      const ss = getChildrenOf(categories, subs[0].id);
      setActiveSubSubCategory(ss[0]?.id ?? '');
    } else {
      setActiveSubCategory('');
      setActiveSubSubCategory('');
    }
  };

  const handleSubCategorySelect = (subCategoryId: string) => {
    setActiveSubCategory(subCategoryId);
    const ss = getChildrenOf(categories, subCategoryId);
    setActiveSubSubCategory(ss[0]?.id ?? '');
  };

  const handleSubSubCategorySelect = (id: string) => {
    setActiveSubSubCategory(id);
  };

  return (
    <main className="min-h-screen malts-surface text-[var(--malts-ink)]">
      {/* Hero Header with gradient */}
      <div 
        className="relative overflow-hidden bg-gradient-to-br from-[#ebe4dc] via-[#e4dcd0] to-[#dcd4c8] py-12 md:py-16 border-b-4 border-[#c41e3a]/35"
        style={{
          backgroundImage: menuSettings?.backgroundImageUrl 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${menuSettings.backgroundImageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--malts-ink)] mb-4 malts-display">
              {menuSettings 
                ? (locale === 'bg' ? menuSettings.titleBg : locale === 'en' ? menuSettings.titleEn : menuSettings.titleRo)
                : (locale === 'bg' ? '🍽️ Нашето Меню' : locale === 'en' ? '🍽️ Our Menu' : '🍸 Meniul nostru')
              }
            </h1>
            <p className="text-lg md:text-xl malts-muted mb-6">
              {menuSettings
                ? (locale === 'bg' ? menuSettings.subtitleBg : locale === 'en' ? menuSettings.subtitleEn : menuSettings.subtitleRo)
                : (locale === 'bg' ? 'Открийте нашата селекция от напитки и деликатеси' : 
                   locale === 'en' ? 'Discover our selection of drinks and delicacies' : 
                   'Descoperă selecția noastră de băuturi și delicatese')
              }
            </p>

            {/* Dual Currency Info */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[rgba(245,240,230,0.72)] border border-[var(--malts-hairline)] rounded-full text-[var(--malts-ink)] backdrop-blur-sm shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">
                {locale === 'bg' ? 'Цени в' : locale === 'en' ? 'Prices in' : 'Prețuri în'}{' '}
                <span className="font-bold text-[var(--malts-ink)]">EUR / BGN</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm malts-muted flex flex-wrap items-center gap-1 malts-breadcrumb-font">
          {breadcrumbIds.map((bid, i) => {
            const cat = categories.find((c: any) => c.id === bid);
            if (!cat) return null;
            const label = getCategoryName(cat, locale);
            return (
              <span key={bid} className="flex items-center gap-1">
                {i > 0 && <span className="text-[var(--malts-subtle)] px-1">/</span>}
                <span className={i === breadcrumbIds.length - 1 ? 'font-semibold text-[var(--malts-ink)]' : ''}>{label}</span>
              </span>
            );
          })}
        </nav>

        {/* Category Tabs - Sticky on scroll */}
        <div className="sticky top-16 z-30 bg-[var(--malts-paper)]/95 backdrop-blur-lg border-y border-[var(--malts-hairline)] py-4 -mx-4 px-4 mb-4">
          {/* Parent Categories - Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar mb-3">
            <div className="flex gap-3 min-w-max mx-auto justify-center px-4">
              {parentCategories.map((category: any) => {
                const categoryName = locale === 'bg' ? category.nameBg : 
                                   locale === 'en' ? category.nameEn : 
                                   category.nameRo;
                const isActive = category.id === activeCategory;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--malts-accent)] text-[#f5f0e6] shadow-md scale-[1.02]'
                        : 'bg-[rgba(245,240,230,0.85)] text-[var(--malts-ink)] hover:bg-[rgba(245,240,230,0.95)] border border-[var(--malts-hairline)] shadow-sm'
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
                                   category.nameRo;
                const isActive = category.id === activeCategory;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--malts-accent)] text-[#f5f0e6] shadow-md scale-[1.02]'
                        : 'bg-[rgba(245,240,230,0.85)] text-[var(--malts-ink)] hover:bg-[rgba(245,240,230,0.95)] border border-[var(--malts-hairline)] shadow-sm'
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
                                          subCategory.nameRo;
                    const isActive = subCategory.id === activeSubCategory;
                    
                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => handleSubCategorySelect(subCategory.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                          isActive
                            ? 'bg-[var(--malts-accent)] text-[#f5f0e6] border-2 border-[var(--malts-accent)]'
                            : 'bg-[var(--malts-card)] text-[var(--malts-ink)] hover:bg-[var(--malts-card-hover)] border border-[var(--malts-hairline)]'
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
                                          subCategory.nameRo;
                    const isActive = subCategory.id === activeSubCategory;
                    
                    return (
                      <button
                        key={subCategory.id}
                        onClick={() => handleSubCategorySelect(subCategory.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap text-sm ${
                          isActive
                            ? 'bg-[var(--malts-accent)] text-[#f5f0e6] border-2 border-[var(--malts-accent)]'
                            : 'bg-[var(--malts-card)] text-[var(--malts-ink)] hover:bg-[var(--malts-card-hover)] border border-[var(--malts-hairline)]'
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

          {subSubCategories.length > 0 && (
            <>
              <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar mt-3">
                <div className="flex gap-2 min-w-max mx-auto justify-center px-4">
                  {subSubCategories.map((sub: any) => {
                    const name = getCategoryName(sub, locale);
                    const isActive = sub.id === activeSubSubCategory;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubSubCategorySelect(sub.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                          isActive
                            ? 'bg-[var(--malts-accent)] text-[#f5f0e6]'
                            : 'bg-amber-50/90 text-[var(--malts-ink)] border border-amber-200/80'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="hidden md:block mt-3">
                <div className="flex flex-wrap gap-2 justify-center max-w-6xl mx-auto">
                  {subSubCategories.map((sub: any) => {
                    const name = getCategoryName(sub, locale);
                    const isActive = sub.id === activeSubSubCategory;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubSubCategorySelect(sub.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                          isActive
                            ? 'bg-[var(--malts-accent)] text-[#f5f0e6]'
                            : 'bg-amber-50/90 text-[var(--malts-ink)] border border-amber-200/80'
                        }`}
                      >
                        {name}
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
              <p className="malts-muted text-xl">
              {locale === 'bg' ? 'Няма продукти в тази категория' : 
               locale === 'en' ? 'No products in this category' : 
               'Nu există produse în această categorie'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product: any) => {
              const productName = locale === 'bg' ? product.nameBg : locale === 'en' ? product.nameEn : product.nameRo;
              const productDesc = locale === 'bg' ? product.descriptionBg : locale === 'en' ? product.descriptionEn : product.descriptionRo;

              return (
                <div
                  id={`product-${product.id}`}
                  key={product.id}
                  className={`group relative malts-card rounded-2xl overflow-hidden shadow-sm hover:border-[var(--malts-accent)]/40 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                    !product.isAvailable ? 'opacity-60' : ''
                  }`}
                >
                  {product.isPromoted && (
                    <div className="h-1.5 w-full bg-gradient-to-r from-[var(--malts-accent)] to-amber-600/90" aria-hidden />
                  )}
                  {product.isPromoted && (
                    <div className="absolute top-4 left-3 z-10 bg-[var(--malts-accent)] text-[#f5f0e6] px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                      {locale === 'bg' ? 'Промо' : locale === 'en' ? 'Promo' : 'Promo'}
                    </div>
                  )}
                  {/* Unavailable Badge */}
                  {!product.isAvailable && (
                    <div className="absolute top-3 right-3 bg-[var(--malts-danger)] text-[#f5f0e6] px-3 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg">
                      {locale === 'bg' ? '✕ Не е наличен' : 
                       locale === 'en' ? '✕ Unavailable' : 
                       '✕ Indisponibil'}
                    </div>
                  )}
                  
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className={`relative h-56 overflow-hidden ${
                      !product.isAvailable ? 'grayscale' : ''
                    }`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={productName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--malts-ink)] mb-2 group-hover:text-[var(--malts-accent)] transition-colors">
                      {productName}
                    </h3>
                    
                    {productDesc && (
                      <p className="malts-muted text-sm mb-4 leading-relaxed break-words whitespace-pre-wrap">
                        {productDesc}
                      </p>
                    )}
                    
                    {/* Price and Unit */}
                    <div className="pt-4 border-t border-[var(--malts-hairline)] flex justify-between items-center gap-2">
                      <div className="flex flex-col items-start gap-0.5">
                        {product.basePriceBgn != null && (
                          <span className="text-[var(--malts-subtle)] line-through text-sm">
                            {Number(product.basePriceBgn).toFixed(2)} лв
                          </span>
                        )}
                        <Price
                          priceBgn={Number(product.priceBgn)}
                          className="text-2xl font-bold text-[var(--malts-ink)]"
                          showBoth={true}
                          inline={true}
                        />
                      </div>
                      {product.unit && product.quantity && (
                        <span className="text-sm malts-muted">
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
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  
  return (
    <Suspense fallback={<LoadingScreen locale={locale} />}>
      <MenuPageContent />
    </Suspense>
  );
}
