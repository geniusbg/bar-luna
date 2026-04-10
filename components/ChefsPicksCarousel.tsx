'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Price from '@/components/Price';

interface Product {
  id: string;
  nameBg: string;
  nameEn: string;
  nameDe: string;
  descriptionBg?: string | null;
  descriptionEn?: string | null;
  descriptionDe?: string | null;
  priceBgn: number;
  imageUrl?: string | null;
  categoryId: string;
  category: {
    nameBg: string;
    nameEn: string;
    nameDe: string;
  };
}

interface ChefsPicksCarouselProps {
  products: Product[];
  locale: string;
}

export default function ChefsPicksCarousel({ products, locale }: ChefsPicksCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = 288; // w-72 = 18rem = 288px
    const gap = 24; // gap-6 = 1.5rem = 24px
    const scrollAmount = cardWidth + gap;
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="mt-16 md:mt-24">
      <div className="text-center mb-10 md:mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
          {locale === 'bg' ? 'Избрани от нас' : locale === 'en' ? "Chef's Picks" : 'Unsere Auswahl'}
        </h2>
        <p className="text-gray-400 text-lg">
          {locale === 'bg' 
            ? 'Специални предложения и любими вкусове' 
            : locale === 'en' 
            ? 'Special selections and favorite flavors'
            : 'Besondere Auswahl und Lieblingsgeschmäcker'}
        </p>
      </div>

      <div className="relative">
        {/* Left Arrow - Desktop only */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-black/80 hover:bg-black border border-white/20 rounded-full text-white hover:text-gray-200 transition-all shadow-lg"
            aria-label={locale === 'bg' ? 'Предишни' : locale === 'en' ? 'Previous' : 'Zurück'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Carousel container */}
        <div className="relative overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => {
              const productName = locale === 'bg' ? product.nameBg : locale === 'en' ? product.nameEn : product.nameDe;
              const categoryName = locale === 'bg' ? product.category.nameBg : locale === 'en' ? product.category.nameEn : product.category.nameDe;
              
              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-64 md:w-72 snap-center group"
                >
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl overflow-hidden hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
                    {product.imageUrl ? (
                      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-900/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={productName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-black/20 flex items-center justify-center">
                            <Image
                              src={locale === 'de' ? '/bg/luna-logo.svg' : `/${locale}/luna-logo.svg`}
                              alt="LUNA Logo"
                              width={200}
                              height={200}
                              className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] object-contain opacity-70"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">{categoryName}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{productName}</h3>
                      {(product.descriptionBg || product.descriptionEn || product.descriptionDe) && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                          {locale === 'bg' ? product.descriptionBg : 
                           locale === 'en' ? product.descriptionEn : 
                           product.descriptionDe}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <Price
                          priceBgn={Number(product.priceBgn)}
                          className="text-2xl font-bold text-white"
                          showBoth={true}
                          inline={true}
                        />
                        <Link
                          href={`/${locale}/menu?category=${product.categoryId}&product=${product.id}`}
                          className="px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors min-h-[48px] flex items-center justify-center"
                        >
                          {locale === 'bg' ? 'Виж' : locale === 'en' ? 'View' : 'Ansehen'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Arrow - Desktop only */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-black/80 hover:bg-black border border-white/20 rounded-full text-white hover:text-gray-200 transition-all shadow-lg"
            aria-label={locale === 'bg' ? 'Следващи' : locale === 'en' ? 'Next' : 'Weiter'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        
        {/* Scroll hint - Mobile only */}
        {products.length > 3 && (
          <div className="text-center mt-6 md:hidden">
            <p className="text-gray-400 text-sm">
              {locale === 'bg' ? '← Плъзни за повече →' : locale === 'en' ? '← Scroll for more →' : '← Scrollen für mehr →'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

