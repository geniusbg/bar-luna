'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Toast from '@/components/Toast';

interface CartItem {
  productId: string;
  nameBg: string;
  nameEn: string;
  nameDe: string;
  priceBgn: number;
  quantity: number;
  unit?: string;
  productQuantity?: number;
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tableNumber = searchParams.get('table');
  
  // Get locale from URL path
  const locale = pathname.split('/')[1] || 'bg';

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Health check function
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Expose offline state for ConditionalNav to detect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__checkServerHealth = checkServerHealth;
    }
  }, []);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        setCategories(data.categories || []);
        setProducts(data.products || []);
      } catch (error) {
        // Error loading menu
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        nameBg: product.nameBg,
        nameEn: product.nameEn,
        nameDe: product.nameDe,
        priceBgn: Number(product.priceBgn),
        quantity: 1,
        unit: product.unit,
        productQuantity: product.quantity
      }];
    });

    // Show toast notification
    const productName = locale === 'bg' ? product.nameBg : locale === 'en' ? product.nameEn : product.nameDe;
    setToast({
      message: `${productName} ${locale === 'bg' ? 'добавено в кошницата' : locale === 'en' ? 'added to cart' : 'zum Warenkorb hinzugefügt'}`,
      type: 'success'
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.priceBgn * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;

    // Health check before submitting
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
      // Trigger offline banner with server down flag
      setIsOffline(true);
      if (typeof window !== 'undefined') {
        if ((window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        // Set server down flag
        if ((window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
      }
      setToast({ 
        message: 'Сървърът е недостъпен. Моля, опитайте отново след няколко секунди.', 
        type: 'error' 
      });
      return;
    }

    try {
      // Prepare items with productName for the API
      const orderItems = cart.map(item => ({
        productId: item.productId,
        productName: item.nameBg, // Always use Bulgarian name for orders
        priceBgn: item.priceBgn,
        quantity: item.quantity
      }));

        const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber || '0'),
          items: orderItems
        })
      });

      if (response.ok) {
        const successMsg = locale === 'bg' ? '✅ Поръчката е изпратена успешно!' : 
                          locale === 'en' ? '✅ Order sent successfully!' : 
                          '✅ Bestellung erfolgreich gesendet!';
        setToast({ message: successMsg, type: 'success' });
        setCart([]);
        setShowCart(false);
      } else {
        const errorMsg = locale === 'bg' ? '❌ Грешка при изпращане на поръчка' : 
                        locale === 'en' ? '❌ Error sending order' : 
                        '❌ Fehler beim Senden der Bestellung';
        setToast({ message: errorMsg, type: 'error' });
      }
    } catch (error) {
      const errorMsg = locale === 'bg' ? '❌ Грешка при изпращане на поръчка' : 
                      locale === 'en' ? '❌ Error sending order' : 
                      '❌ Fehler beim Senden der Bestellung';
      setToast({ message: errorMsg, type: 'error' });
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
          <p className="text-white text-3xl font-medium">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-32">
      {/* Toast Notifications - hidden when server is offline */}
      {toast && !isOffline && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-black/95 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center gap-4">
            <div className="h-16 md:h-24 overflow-hidden flex items-center">
              <Image 
                src="/bg/logo_luna2.svg" 
                alt="L.U.N.A." 
                width={192}
                height={192}
                className="w-auto h-full object-contain"
                priority
              />
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                {tableNumber && (
                  <div className="bg-white/10 px-3 py-1 rounded-full border border-white/20 -ml-2 md:ml-0">
                    <p className="text-white font-semibold text-sm whitespace-nowrap">
                      {locale === 'bg' ? 'Маса' : locale === 'en' ? 'Table' : 'Tisch'} {tableNumber}
                    </p>
                  </div>
                )}
                
                {/* Cart Button */}
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative px-4 py-2.5 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all text-sm md:text-base"
                >
                  🛒 {locale === 'bg' ? 'Количка' : locale === 'en' ? 'Cart' : 'Warenkorb'}
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center text-xs md:text-sm font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Language Switcher */}
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter - Sticky */}
      <div className="sticky top-[5rem] z-30 bg-black/95 backdrop-blur-lg border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar">
            <div className="flex gap-3 min-w-max">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
              >
                {locale === 'bg' ? 'Всички' : locale === 'en' ? 'All' : 'Alle'} ({products.length})
              </button>
              {categories.map((category: any) => {
                const count = products.filter(p => p.categoryId === category.id).length;
                const categoryName = locale === 'bg' ? category.nameBg : locale === 'en' ? category.nameEn : category.nameDe;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {categoryName} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Desktop: Multi-row grid */}
          <div className="hidden md:block">
            <div className="flex flex-wrap gap-3 justify-center max-w-6xl mx-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
              >
                {locale === 'bg' ? 'Всички' : locale === 'en' ? 'All' : 'Alle'} ({products.length})
              </button>
              {categories.map((category: any) => {
                const count = products.filter(p => p.categoryId === category.id).length;
                const categoryName = locale === 'bg' ? category.nameBg : locale === 'en' ? category.nameEn : category.nameDe;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {categoryName} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="container mx-auto px-4 py-8">
        {categories
          .filter(category => selectedCategory === 'all' || category.id === selectedCategory)
          .map(category => {
            const categoryProducts = products.filter(p => p.categoryId === category.id);
            if (categoryProducts.length === 0) return null;
            
            const categoryName = locale === 'bg' ? category.nameBg : locale === 'en' ? category.nameEn : category.nameDe;

            return (
              <div key={category.id} className="mb-16">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1 w-8 bg-white rounded-full"></div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{categoryName}</h2>
                  <div className="flex-1 h-px bg-gray-800"></div>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {categoryProducts.map((product: any) => {
                    const productName = locale === 'bg' ? product.nameBg : locale === 'en' ? product.nameEn : product.nameDe;
                    return (
                    <div
                      key={product.id}
                      className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-4 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300"
                    >
                      <h3 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                        {productName}
                      </h3>
                      
                      <div className="pt-3 border-t border-gray-700/50">
                        <div className="flex justify-between items-center gap-3">
                          <Price
                            priceBgn={Number(product.priceBgn)}
                            className="text-xl font-bold text-white"
                            showBoth={true}
                            inline={true}
                          />
                          {product.unit && product.quantity && (
                            <span className="text-sm text-gray-400">
                              {product.quantity} {product.unit === 'pcs' ? 'бр.' : product.unit}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full mt-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-xl font-bold transition-all text-sm md:text-base"
                        >
                          + {locale === 'bg' ? 'Добави' : locale === 'en' ? 'Add' : 'Hinzufügen'}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          <div className="bg-slate-800 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
              <h2 className="text-2xl font-bold text-white">
                {locale === 'bg' ? 'Вашата поръчка' : locale === 'en' ? 'Your Order' : 'Ihre Bestellung'}
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-white text-3xl hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {cart.length === 0 ? (
                <p className="text-gray-200 text-center py-8">
                  {locale === 'bg' ? 'Количката е празна' : locale === 'en' ? 'Cart is empty' : 'Warenkorb ist leer'}
                </p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => {
                      const itemName = locale === 'bg' ? item.nameBg : locale === 'en' ? item.nameEn : item.nameDe;
                      return (
                      <div key={item.productId} className="bg-slate-700 rounded-lg p-4 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-semibold">{itemName}</h4>
                          {item.unit && item.productQuantity && (
                            <span className="text-sm text-gray-400">
                              {item.productQuantity} {item.unit === 'pcs' ? 'бр.' : item.unit}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-300">{item.priceBgn.toFixed(2)} лв.</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-bold"
                            >
                              −
                            </button>
                            <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 bg-white hover:bg-gray-200 text-black rounded-lg font-bold"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="ml-2 text-red-400 hover:text-red-300"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-700 pt-4 mb-6">
                    <div className="flex justify-between items-center text-xl font-bold text-white">
                      <span>{locale === 'bg' ? 'Общо:' : locale === 'en' ? 'Total:' : 'Gesamt:'}</span>
                      <Price priceBgn={cartTotal} className="text-2xl" />
                    </div>
                  </div>

                  <button
                    onClick={submitOrder}
                    className="w-full px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-all"
                  >
                    ✅ {locale === 'bg' ? 'Изпрати поръчка' : locale === 'en' ? 'Send Order' : 'Bestellung senden'}
                  </button>

                  <p className="text-gray-300 text-sm text-center mt-4">
                    {locale === 'bg' ? 'Поръчката ще бъде изпратена към персонала' : 
                     locale === 'en' ? 'Order will be sent to staff' : 
                     'Bestellung wird an Personal gesendet'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call Waiter Button */}
      {tableNumber && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-40">
          <a
            href={`/${locale}/order/call-waiter?table=${tableNumber}`}
            className="block w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg text-center transition-all shadow-2xl"
          >
            🔔 {locale === 'bg' ? 'Повикай сервитьор' : 
                 locale === 'en' ? 'Call Waiter' : 
                 'Kellner rufen'}
          </a>
        </div>
      )}
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
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
          <p className="text-white text-3xl font-medium">Зареждане...</p>
        </div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}


