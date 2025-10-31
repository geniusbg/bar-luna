'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher-client';
import { playSound } from '@/lib/sound';
import Toast from '@/components/Toast';
import Price from '@/components/Price';
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater';
import { 
  isPushSupported, 
  isSubscribed, 
  subscribeToPush,
  showTestNotification,
  getPushSupportDetails
} from '@/lib/push-notifications';

export default function StaffDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [ordersTab, setOrdersTab] = useState<'active' | 'completed'>('active');
  const [callsTab, setCallsTab] = useState<'active' | 'completed'>('active');
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Loading state
  const [initialLoading, setInitialLoading] = useState(true);
  
  // PWA & Push states
  const [isPWA, setIsPWA] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Ref to prevent multiple simultaneous refreshes
  const isRefreshingRef = useRef(false);

  // ONE-TIME SETUP: PWA, Push, Service Worker (separate useEffect to prevent re-registration)
  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
    };
    checkPWA();

    // Check push subscription status
    const checkPush = async () => {
      const subscribed = await isSubscribed();
      setPushEnabled(subscribed);
    };
    checkPush();


    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
      console.log('📱 PWA install prompt ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []); // Empty deps - run ONCE on mount

  // DATA & PUSHER SETUP (separate useEffect for data loading and real-time)
  useEffect(() => {

    // Load initial data
    async function loadData() {
      try {
        const [allOrdersRes, callsRes] = await Promise.all([
          fetch('/api/orders/all'),
          fetch('/api/waiter-call/all')
        ]);

        const ordersData = await allOrdersRes.json();
        const callsData = await callsRes.json();

        setOrders(ordersData.orders || []);
        setWaiterCalls(callsData.calls || []);
        
        // Show loading for 2 seconds
        setTimeout(() => {
          setInitialLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Load data error:', error);
        setInitialLoading(false);
      }
    }
    loadData();

    // Setup Pusher real-time
    const pusher = getPusherClient();
    const channel = pusher.subscribe('staff-channel');

    // New order notification
    channel.bind('new-order', (data: any) => {
      console.log('🔔 New order received:', data);

      // Play sound (MP3 or generated beep)
      playSound('order');

      // Add to notifications queue
      setNotifications(prev => [...prev, {
        id: `order-${data.orderId}-${Date.now()}`,
        type: 'order',
        title: `НОВА ПОРЪЧКА #${data.orderNumber}`,
        message: `Маса ${data.tableNumber}`,
        data,
        urgent: false
      }]);

      // Add new order to state instead of reloading
      setOrders(prev => [data, ...prev]);
    });

    // Waiter call notification
    channel.bind('waiter-call', (data: any) => {
      console.log('🔔 Waiter called:', data);

      // Play urgent sound (MP3 or generated alert)
      playSound('urgent');

      // Add to notifications queue
      setNotifications(prev => [...prev, {
        id: `call-${data.callId}-${Date.now()}`,
        type: 'call',
        title: `🚨 МАСА ${data.tableNumber}`,
        message: data.callType === 'payment_cash' ? 'Плащане с брой' : 
                 data.callType === 'payment_card' ? 'Плащане с карта' : 'Нужна помощ',
        data,
        urgent: true
      }]);

      // Add new call to state
      const newCall = {
        id: data.callId,
        tableNumber: data.tableNumber,
        callType: data.callType,
        message: data.message,
        status: 'pending',
        createdAt: data.timestamp
      };
      setWaiterCalls(prev => [newCall, ...prev]);
    });

    // Order status change notification
    channel.bind('order-status-change', (data: any) => {
      console.log('🔄 Order status changed:', data);
      
      // Update order in state
      setOrders(prev => prev.map(order => 
        order.id === data.orderId 
          ? { ...order, status: data.status }
          : order
      ));
    });

    // Waiter call status change notification
    channel.bind('call-status-change', (data: any) => {
      // Update call in state (silently, don't show toast - it's from another device)
      setWaiterCalls(prev => prev.map(call => 
        call.id === data.callId 
          ? { ...call, status: data.status }
          : call
      ));
    });

    // Smart refresh on visibility change (for iOS when returning from background)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        
        try {
          const [ordersRes, callsRes] = await Promise.all([
            fetch('/api/orders/all'),
            fetch('/api/waiter-call/all')
          ]);

          const ordersData = await ordersRes.json();
          const callsData = await callsRes.json();

          // Just update data, let Pusher handle new notifications
          setOrders(ordersData.orders || []);
          setWaiterCalls(callsData.calls || []);
          
          console.log('✅ Data refreshed');
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          // Reset flag after 2 seconds to prevent rapid re-triggers
          setTimeout(() => {
            isRefreshingRef.current = false;
          }, 2000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('staff-channel');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty deps - setup once, use refs for state access

  const updateOrderStatus = async (orderId: string, status: string) => {
    setLoadingActions(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId 
              ? { 
                  ...order, 
                  status,
                  completedAt: status === 'completed' ? new Date().toISOString() : order.completedAt
                } 
              : order
          )
        );
        
        const statusMessages: Record<string, string> = {
          'preparing': 'Поръчка започната',
          'ready': 'Поръчка готова',
          'completed': 'Поръчка завършена'
        };
        
        setToast({ 
          message: statusMessages[status] || 'Статус обновен', 
          type: 'success' 
        });
      } else {
        setToast({ message: 'Грешка при обновяване', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при връзка', type: 'error' });
    } finally {
      setLoadingActions(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const acknowledgeCall = async (callId: string) => {
    setLoadingActions(prev => ({ ...prev, [callId]: true }));
    
    try {
      const response = await fetch(`/api/waiter-call/${callId}/acknowledge`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setWaiterCalls(prev =>
          prev.map(call =>
            call.id === callId ? { ...call, status: 'acknowledged' } : call
          )
        );
        setToast({ message: 'Потвърдено - отивате', type: 'success' });
      } else {
        setToast({ message: 'Грешка при потвърждаване', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при връзка', type: 'error' });
    } finally {
      setLoadingActions(prev => ({ ...prev, [callId]: false }));
    }
  };

  const completeCall = async (callId: string) => {
    setLoadingActions(prev => ({ ...prev, [`complete_${callId}`]: true }));
    
    try {
      const response = await fetch(`/api/waiter-call/${callId}/complete`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setWaiterCalls(prev =>
          prev.map(call =>
            call.id === callId 
              ? { ...call, status: 'completed', completedAt: new Date().toISOString() } 
              : call
          )
        );
        setToast({ message: 'Повикване завършено', type: 'success' });
      } else {
        setToast({ message: 'Грешка при завършване', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при връзка', type: 'error' });
    } finally {
      setLoadingActions(prev => ({ ...prev, [`complete_${callId}`]: false }));
    }
  };

  const dismissNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  // PWA Install handler
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setToast({ message: 'App инсталиран успешно! 🎉', type: 'success' });
      setShowPWAPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  // Enable Push Notifications
  const handleEnablePush = async () => {
    try {
      // Check support first
      const details = getPushSupportDetails();
      
      if (!details.isSupported) {
        if (details.isIOS && !details.isHTTPS) {
          setToast({ 
            message: '⚠️ iOS изисква HTTPS за Push! Работи на production с https://', 
            type: 'error' 
          });
          return;
        }
        
        setToast({ message: 'Push notifications не се поддържат на това устройство', type: 'error' });
        return;
      }

      await subscribeToPush();
      setPushEnabled(true);
      setToast({ message: 'Push notifications активирани! 🔔', type: 'success' });
      
      // Show test notification
      setTimeout(() => showTestNotification(), 1000);
    } catch (error: any) {
      console.error('Enable push error:', error);
      setToast({ message: `Грешка: ${error.message}`, type: 'error' });
    }
  };

  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';

  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    if (confirm('Сигурни ли сте, че искате да излезете?')) {
      await signOut({ redirect: false });
      
      const currentOrigin = window.location.origin;
      const loginUrl = `${currentOrigin}/${locale}/staff/login`;
      window.location.href = loginUrl;
    }
  };

  // Prevent back button after logout
  useEffect(() => {
    const handlePopState = (e: any) => {
      // Don't redirect if offline
      if (typeof window !== 'undefined' && (window as any).__isOffline) {
        return;
      }
      
      // Clear session if user tries to go back after logout
      if (!session) {
        window.history.pushState(null, '', window.location.href);
        window.location.href = `/${locale}/staff/login`;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session, locale]);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Don't redirect if offline - offline banner will handle it
    if (typeof window !== 'undefined' && (window as any).__isOffline) {
      return;
    }
    
    if (!initialLoading && !session) {
      window.location.href = `/${locale}/staff/login`;
    }
  }, [session, initialLoading, locale]);

  // Show loading screen
  if (initialLoading || !session) {
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
    <div className="min-h-screen bg-gray-900">
      <ServiceWorkerUpdater />
      
      <div className="pt-4 md:pt-8 px-8 pb-8">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Notification Popups - Stacked on Mobile, Grid on Desktop */}
      {notifications.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-8">
          <div className={`flex flex-col md:grid gap-2 md:gap-4 w-full max-h-full overflow-y-auto md:overflow-visible ${
            notifications.length === 1 ? 'md:grid-cols-1' :
            notifications.length === 2 ? 'md:grid-cols-2' :
            notifications.length <= 4 ? 'md:grid-cols-2 md:grid-rows-2' :
            notifications.length <= 6 ? 'md:grid-cols-3 md:grid-rows-2' :
            'md:grid-cols-3 md:grid-rows-3'
          } md:h-full md:items-center md:justify-items-center md:content-center`}>
            {notifications.slice(0, 9).map((notif, index) => (
              <div
                key={notif.id}
                className={`animate-bounce-in w-full ${
                  notifications.length === 1 ? 'max-w-3xl' :
                  notifications.length <= 4 ? 'max-w-xl' :
                  'max-w-md'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`relative rounded-xl shadow-2xl border-2 md:border-4 p-4 md:p-8 ${
                  notif.urgent 
                    ? 'bg-red-600 border-red-400 animate-pulse' 
                    : 'bg-white text-black border-gray-300'
                }`}>
                  {/* Badge showing position in queue */}
                  {notifications.length > 1 && (
                    <div className={`absolute top-2 md:top-3 right-2 md:right-3 px-2 md:px-3 py-1 rounded-full font-bold text-xs md:text-sm ${
                      notif.urgent ? 'bg-white/30 text-white' : 'bg-black/20 text-black'
                    }`}>
                      {index + 1}/{notifications.length}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl md:text-4xl">
                        {notif.type === 'order' ? '🔔' : '🚨'}
                      </div>
                      <h3 className={`font-bold leading-tight flex-1 ${
                        notif.urgent ? 'text-white' : 'text-black'
                      } text-base md:text-2xl`}>
                        {notif.title}
                      </h3>
                    </div>
                    <p className={`font-semibold leading-tight ${
                      notif.urgent ? 'text-white' : 'text-black'
                    } text-sm md:text-lg`}>
                      {notif.message}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className={`flex-1 rounded-lg font-bold transition-all shadow-lg px-4 py-3 text-base md:text-lg ${
                        notif.urgent 
                          ? 'bg-white text-red-600 hover:bg-gray-100' 
                          : 'bg-black text-white hover:bg-gray-900'
                      }`}
                    >
                      ✓ OK
                    </button>
                    
                    {notifications.length > 1 && index === 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className={`rounded-lg font-bold transition-all whitespace-nowrap px-3 py-3 text-sm md:text-base ${
                          notif.urgent 
                            ? 'bg-white/20 text-white hover:bg-white/30' 
                            : 'bg-black/20 text-black hover:bg-black/30'
                        }`}
                      >
                        Всички
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8">
        {/* Logo Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
          {/* Left - Logo */}
          <div className="h-16 md:h-24 overflow-hidden flex items-center">
            <Image 
              src="/bg/logo_luna2.svg" 
              alt="L.U.N.A." 
              width={240}
              height={240}
              className="w-auto h-full object-contain"
              priority
            />
          </div>

          {/* Right - Title & PWA Status & User Menu */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right">
              <h1 className="text-xl md:text-4xl font-bold text-white">Staff Dashboard</h1>
              <p className="text-gray-400 text-sm">Real-time поръчки и известия</p>
            </div>

            <div className="hidden md:flex gap-3">
              {/* PWA Install Button */}
              {!isPWA && showPWAPrompt && (
              <button
                onClick={handleInstallPWA}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2"
              >
                📱 Инсталирай App
              </button>
            )}

            {/* Push Enable Button */}
            {isPWA && !pushEnabled && isPushSupported() && (
              <button
                onClick={handleEnablePush}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 animate-pulse"
              >
                🔔 Активирай Push
              </button>
            )}

              {/* Status Indicators */}
              {isPWA && pushEnabled && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-200">PWA & Push Active</span>
                  </div>
                </div>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                    {(session?.user as any)?.name?.[0] || 'S'}
                  </div>
                  <span className="text-white font-medium hidden lg:block">
                    {(session?.user as any)?.name || 'Staff'}
                  </span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-white font-semibold">{(session?.user as any)?.name}</p>
                      <p className="text-sm text-gray-400">{(session?.user as any)?.email}</p>
                      <span className="mt-1 inline-block px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                        {(session?.user as any)?.role}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span>
                      Изход
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile PWA Buttons & User Menu */}
        <div className="md:hidden flex flex-col gap-2">
          {!isPWA && showPWAPrompt && (
            <button
              onClick={handleInstallPWA}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              📱 Инсталирай App
            </button>
          )}

          {isPWA && !pushEnabled && isPushSupported() && (
            <button
              onClick={handleEnablePush}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 animate-pulse text-sm"
            >
              🔔 Активирай Push
            </button>
          )}
          
          {isPWA && pushEnabled && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-200">PWA & Push Active</span>
              </div>
            </div>
          )}

          {/* Mobile User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                  {(session?.user as any)?.name?.[0] || 'S'}
                </div>
                <span className="text-white font-medium">
                  {(session?.user as any)?.name || 'Staff'}
                </span>
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
                <div className="mb-3 pb-3 border-b border-gray-700">
                  <p className="text-white font-semibold">{(session?.user as any)?.name}</p>
                  <p className="text-sm text-gray-400">{(session?.user as any)?.email}</p>
                  <span className="mt-1 inline-block px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                    {(session?.user as any)?.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>🚪</span>
                  Изход
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waiter Calls Section with Tabs */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            🔔 Повиквания
          </h2>
          
          {/* Tabs for Calls */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setCallsTab('active')}
              className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base ${
                callsTab === 'active'
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Активни ({waiterCalls.filter(c => c.status !== 'completed').length})
            </button>
            <button
              onClick={() => setCallsTab('completed')}
              className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base ${
                callsTab === 'completed'
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Завършени ({waiterCalls.filter(c => c.status === 'completed').length})
            </button>
          </div>
        </div>
        
        {callsTab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiterCalls
              .filter(call => call.status !== 'completed')
              .map(call => (
              <div
                key={call.id}
                className={`rounded-xl p-4 md:p-6 border-2 ${
                  call.callType.includes('payment')
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-yellow-500/20 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      Маса {call.tableNumber}
                    </h3>
                    <p className="text-base md:text-lg text-gray-200">
                      {call.message}
                    </p>
                    {call.createdAt && (
                      <p className="text-xs md:text-sm text-gray-400 mt-1">
                        {new Date(call.createdAt).toLocaleString('bg-BG', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl md:text-3xl">
                    {call.callType.includes('payment') ? '💰' : '🆘'}
                  </div>
                </div>
                {call.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => acknowledgeCall(call.id)}
                      disabled={loadingActions[call.id]}
                      className="px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      {loadingActions[call.id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">...</span>
                        </>
                      ) : (
                        'Отивам'
                      )}
                    </button>
                    <button
                      onClick={() => completeCall(call.id)}
                      disabled={loadingActions[`complete_${call.id}`]}
                      className="px-3 md:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      {loadingActions[`complete_${call.id}`] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">...</span>
                        </>
                      ) : (
                        'Завърши'
                      )}
                    </button>
                  </div>
                )}
                {call.status === 'acknowledged' && (
                  <button
                    onClick={() => completeCall(call.id)}
                    disabled={loadingActions[`complete_${call.id}`]}
                    className="w-full px-3 md:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    {loadingActions[`complete_${call.id}`] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">...</span>
                      </>
                    ) : (
                      <>✓ Завърши</>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Completed Calls */}
        {callsTab === 'completed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiterCalls
              .filter(call => call.status === 'completed')
              .map(call => (
              <div
                key={call.id}
                className="rounded-xl p-6 border-2 bg-gray-700/50 border-green-500/50 opacity-75"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Маса {call.tableNumber}
                    </h3>
                    <p className="text-lg text-gray-200">
                      {call.message}
                    </p>
                    {call.createdAt && (
                      <p className="text-sm text-gray-400 mt-1">
                        Заявено: {new Date(call.createdAt).toLocaleString('bg-BG', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-3xl">
                    {call.callType.includes('payment') ? '💰' : '🆘'}
                  </div>
                </div>
                <div className="text-center text-green-300 font-semibold">
                  ✓ Завършено
                </div>
                {call.completedAt && (
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    Завършено: {new Date(call.completedAt).toLocaleString('bg-BG', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Section with Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            📋 Поръчки
          </h2>
          
          {/* Tabs */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setOrdersTab('active')}
              className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base ${
                ordersTab === 'active'
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Активни ({orders.filter((o: any) => o.status !== 'completed').length})
            </button>
            <button
              onClick={() => setOrdersTab('completed')}
              className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all text-sm md:text-base ${
                ordersTab === 'completed'
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Завършени ({orders.filter((o: any) => o.status === 'completed').length})
            </button>
          </div>
        </div>
        
        {/* Active Orders */}
        {ordersTab === 'active' && (
          orders.filter((o: any) => o.status !== 'completed').length === 0 ? (
            <div className="text-center py-20 bg-gray-800 rounded-xl">
              <p className="text-gray-200 text-xl">Няма активни поръчки</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders
                .filter((order: any) => order.status !== 'completed')
                .map((order: any) => (
                <div
                  key={order.id}
                  className="bg-gray-800 rounded-xl p-4 md:p-6 border-2 border-gray-700"
                >
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-lg md:text-2xl font-bold text-white">
                        Поръчка #{order.orderNumber}
                      </div>
                      <div className="text-base md:text-lg text-gray-300">
                        Маса {order.tableNumber}
                      </div>
                      {order.createdAt && (
                        <div className="text-xs md:text-sm text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleString('bg-BG', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                    <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap ${
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      order.status === 'preparing' ? 'bg-blue-500/20 text-blue-300' :
                      order.status === 'ready' ? 'bg-green-500/20 text-green-300' : ''
                    }`}>
                      {order.status === 'pending' ? 'Нова' :
                       order.status === 'preparing' ? 'В процес' :
                       order.status === 'ready' ? 'Готова' : order.status}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-3 md:mb-4 space-y-1 md:space-y-2">
                    {order.items && order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-gray-200 text-sm md:text-base">
                        <span className="truncate mr-2">{item.quantity}x {item.productName}</span>
                        <Price priceBgn={Number(item.priceBgn)} className="text-gray-200 whitespace-nowrap" />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 pt-2 md:pt-3 mb-3 md:mb-4">
                    <div className="flex justify-between text-base md:text-xl font-bold text-white">
                      <span>Общо:</span>
                      <Price priceBgn={Number(order.totalBgn)} className="text-base md:text-xl font-bold text-white" />
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={loadingActions[order.id]}
                        className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        {loadingActions[order.id] ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Приготвяме</span>
                        )}
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        disabled={loadingActions[order.id]}
                        className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        {loadingActions[order.id] ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Готова</span>
                        )}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        disabled={loadingActions[order.id]}
                        className="col-span-2 px-3 md:px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        {loadingActions[order.id] ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          '✓ Завърши'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        
        {/* Completed Orders */}
        {ordersTab === 'completed' && (
          orders.filter((o: any) => o.status === 'completed').length === 0 ? (
            <div className="text-center py-20 bg-gray-800 rounded-xl">
              <p className="text-gray-200 text-xl">Няма завършени поръчки днес</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders
                .filter((order: any) => order.status === 'completed')
                .map((order: any) => (
                <div
                  key={order.id}
                  className="bg-gray-800 rounded-xl p-6 border-2 border-green-500/50 opacity-75"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        Поръчка #{order.orderNumber}
                      </div>
                      <div className="text-lg text-gray-300">
                        Маса {order.tableNumber}
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-300">
                      ✓ Завършена
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 space-y-2">
                    {order.items && order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-gray-200">
                        <span>{item.quantity}x {item.productName}</span>
                        <Price priceBgn={Number(item.priceBgn)} className="text-gray-200" />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Общо:</span>
                      <Price priceBgn={Number(order.totalBgn)} className="text-xl font-bold text-white" />
                    </div>
                    {order.completedAt && (
                      <p className="text-sm text-gray-400 mt-2">
                        Завършена: {new Date(order.completedAt).toLocaleTimeString('bg-BG')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      </div>
    </div>
  );
}


