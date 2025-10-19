'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';
import Toast from '@/components/Toast';

interface CartItem {
  productId: string;
  name: string;
  priceBgn: number;
  quantity: number;
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table');

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');
        const data = await response.json();
        setCategories(data.categories || []);
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error loading menu:', error);
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
        name: product.nameBg,
        priceBgn: Number(product.priceBgn),
        quantity: 1
      }];
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

    setSubmitting(true);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber || '0'),
          items: cart
        })
      });

      if (response.ok) {
        const data = await response.json();
        setToast({ 
          message: `Поръчка #${data.orderNumber} изпратена успешно! Персоналът е информиран.`, 
          type: 'success' 
        });
        setCart([]);
        setShowCart(false);
      } else {
        setToast({ message: 'Грешка при изпращане на поръчка', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при връзка със сървъра', type: 'error' });
    } finally {
      setSubmitting(false);
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
      {/* Toast Notification */}
      {toast && (
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
            <div className="h-16 overflow-hidden flex items-center">
              <Image 
                src="/bg/logo_luna2.svg" 
                alt="L.U.N.A." 
                width={192}
                height={192}
                className="w-auto h-full object-contain"
                priority
              />
            </div>
            
            {tableNumber && (
              <div className="flex-1 text-center">
                <p className="text-white font-bold text-xl">Маса {tableNumber}</p>
              </div>
            )}

            <button
              onClick={() => setShowCart(!showCart)}
              className="relative px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all text-sm"
            >
              🛒 Количка
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter - Sticky */}
      <div className="sticky top-[3.5rem] z-30 bg-black/95 backdrop-blur-lg border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-3 min-w-max">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
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
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {category.nameBg} ({count})
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

            return (
              <div key={category.id} className="mb-16">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1 w-8 bg-white rounded-full"></div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{category.nameBg}</h2>
                  <div className="flex-1 h-px bg-gray-800"></div>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {categoryProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className={`group relative bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl overflow-hidden hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 ${
                      !product.isAvailable ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Unavailable Badge */}
                    {!product.isAvailable && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg">
                        Не е наличен
                      </div>
                    )}
                    
                    {/* Product Image */}
                    {product.imageUrl && (
                      <div className={`relative h-40 overflow-hidden bg-black ${
                        !product.isAvailable ? 'grayscale' : ''
                      }`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.nameBg}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                        {product.nameBg}
                      </h3>
                      
                      {/* Price and Add Button */}
                      <div className="flex justify-between items-center gap-3 pt-3 border-t border-gray-700/50">
                        <Price
                          priceBgn={Number(product.priceBgn)}
                          className="text-xl font-bold text-white"
                        />
                        <button
                          onClick={() => addToCart(product)}
                          disabled={!product.isAvailable}
                          className="px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-sm md:text-base"
                        >
                          {product.isAvailable ? '+ Добави' : 'Няма'}
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-900/95 rounded-t-3xl md:rounded-3xl w-full md:max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gradient-to-br from-gray-900 to-gray-900/95 backdrop-blur-lg z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">🛒 Вашата поръчка</h2>
                {cart.length > 0 && (
                  <p className="text-gray-400 text-sm mt-1">{cart.length} {cart.length === 1 ? 'артикул' : 'артикула'}</p>
                )}
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-2xl transition-all"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-300 text-xl mb-2">Количката е празна</p>
                  <p className="text-gray-400 text-sm">Добавете продукти за да направите поръчка</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-6">
                    {cart.map(item => (
                      <div key={item.productId} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 hover:border-gray-600 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-lg mb-1">{item.name}</h4>
                            <Price priceBgn={item.priceBgn} className="text-gray-300 text-sm" />
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                            title="Премахни"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-xl transition-all"
                          >
                            −
                          </button>
                          <div className="flex-1 text-center">
                            <span className="text-white font-bold text-xl">{item.quantity}</span>
                            <span className="text-gray-400 text-sm ml-2">бр.</span>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-10 h-10 bg-white hover:bg-gray-200 text-black rounded-xl font-bold text-xl transition-all"
                          >
                            +
                          </button>
                          <div className="flex-1 text-right">
                            <Price priceBgn={item.priceBgn * item.quantity} className="text-white font-bold text-lg" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-lg">Обща сума:</span>
                      <Price priceBgn={cartTotal} className="text-white font-bold text-3xl" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={submitOrder}
                    disabled={submitting}
                    className="w-full px-8 py-5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-500/20"
                  >
                    {submitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Изпращане...</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>Изпрати поръчка</span>
                      </>
                    )}
                  </button>

                  <p className="text-gray-400 text-sm text-center mt-4">
                    Поръчката ще бъде изпратена към персонала
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
            href={`/order/call-waiter?table=${tableNumber}`}
            className="block w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg text-center transition-all shadow-2xl"
          >
            🔔 Повикай сервитьор
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
