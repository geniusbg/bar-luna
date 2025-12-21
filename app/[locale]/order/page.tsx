'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Toast from '@/components/Toast';
import { getPusherClient } from '@/lib/pusher-client';
import LoadingScreen from '@/components/LoadingScreen';
import { useLockScroll } from '@/lib/use-lock-scroll';

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
  const initialTableNumber = searchParams.get('table');
  const [tableNumber, setTableNumber] = useState<string | null>(initialTableNumber);
  
  // Get locale from URL path
  const locale = pathname.split('/')[1] || 'bg';

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; persistent?: boolean } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  
  // Lock scroll when cart modal is open (backdrop locked, cart can scroll)
  useLockScroll(showCart);
  const [isOffline, setIsOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'auto-rejected' | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [approvalConfig, setApprovalConfig] = useState<{ threshold: number; windowMinutes: number; autoRejectMinutes?: number } | null>(null);

  const approvalThresholdValue = approvalConfig?.threshold ?? 5;
  const approvalWindowValue = approvalConfig?.windowMinutes ?? 5;
  const autoRejectMinutesValue = approvalConfig?.autoRejectMinutes ?? 30;

  const approvalPollRef = useRef<NodeJS.Timeout | null>(null);
  const approvalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const approvalStatusRef = useRef<'pending' | 'approved' | 'rejected' | 'auto-rejected' | null>(null);
  const orderIdRef = useRef<string | null>(null);

  useEffect(() => {
    let hideTimer: NodeJS.Timeout | null = null;

    if (loading) {
      setShowLoadingScreen(true);
    } else {
      hideTimer = setTimeout(() => {
        setShowLoadingScreen(false);
      }, 3000);
    }

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [loading]);

  useEffect(() => {
    approvalStatusRef.current = approvalStatus;
  }, [approvalStatus]);

  useEffect(() => {
    orderIdRef.current = orderId;
  }, [orderId]);

  const clearApprovalPolling = useCallback(() => {
    if (approvalPollRef.current) {
      clearInterval(approvalPollRef.current);
      approvalPollRef.current = null;
    }
    if (approvalTimeoutRef.current) {
      clearTimeout(approvalTimeoutRef.current);
      approvalTimeoutRef.current = null;
    }
  }, []);

  const handleApprovalStatusUpdate = useCallback(
    (status: 'approved' | 'rejected' | 'auto-rejected', data?: { items?: { productName: string; quantity: number }[]; reason?: string }) => {
      clearApprovalPolling();
      setApprovalStatus(status);

      const itemsList = data?.items && data.items.length
        ? '\n\n' + data.items.map(item => `${item.quantity}x ${item.productName}`).join('\n')
        : '';

      if (status === 'approved') {
        const message =
          (locale === 'bg'
            ? '✅ Поръчката е одобрена!'
            : locale === 'en'
            ? '✅ Order approved!'
            : '✅ Bestellung genehmigt!') + itemsList;

        setToast({ message, type: 'success' });
        setCart([]);
        setShowCart(false);
      } else if (status === 'rejected') {
        const rejectionMessage =
          (locale === 'bg'
            ? '❌ Поръчката е отхвърлена'
            : locale === 'en'
            ? '❌ Order rejected'
            : '❌ Bestellung abgelehnt') + (data?.reason ? `: ${data.reason}` : '') + itemsList;

        setToast({ message: rejectionMessage, type: 'error' });
      } else if (status === 'auto-rejected') {
        const autoMessage =
          (locale === 'bg'
            ? `⏱️ Поръчката беше автоматично отхвърлена след ${autoRejectMinutesValue} минути`
            : locale === 'en'
            ? `⏱️ Order was automatically rejected after ${autoRejectMinutesValue} minutes`
            : `⏱️ Bestellung wurde nach ${autoRejectMinutesValue} Minuten automatisch abgelehnt`) +
          (data?.reason ? `: ${data.reason}` : '') +
          itemsList;

        setToast({ message: autoMessage, type: 'error' });
      }

      setTimeout(() => {
        setRequiresApproval(false);
        setApprovalStatus(null);
        setOrderId(null);
        setApprovalConfig(null);
      }, 3000);
    },
    [autoRejectMinutesValue, clearApprovalPolling, locale]
  );

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

  // Save session token from URL to localStorage
  const getSessionMessageForReason = useCallback((reason?: string) => {
    const messages: Record<string, { bg: string; en: string; de: string }> = {
      missing: {
        bg: 'Сесията е изтекла. Моля, сканирайте QR кода от масата отново.',
        en: 'Your session has expired. Please scan the table QR code again.',
        de: 'Ihre Sitzung ist abgelaufen. Bitte scannen Sie den QR-Code erneut.'
      },
      expired: {
        bg: 'Сесията е изтекла. Моля, сканирайте QR кода от масата отново.',
        en: 'Your session has expired. Please scan the table QR code again.',
        de: 'Ihre Sitzung ist abgelaufen. Bitte scannen Sie den QR-Code erneut.'
      },
      revoked: {
        bg: 'Сесията е невалидна. Моля, сканирайте QR кода от масата отново.',
        en: 'Your session is no longer valid. Please scan the table QR code again.',
        de: 'Ihre Sitzung ist nicht mehr gültig. Bitte scannen Sie den QR-Code erneut.'
      },
      invalid: {
        bg: 'Невалидна сесия. Моля, сканирайте QR кода от масата отново.',
        en: 'Invalid session. Please scan the table QR code again.',
        de: 'Ungültige Sitzung. Bitte scannen Sie den QR-Code erneut.'
      },
      default: {
        bg: 'Моля, сканирайте QR кода от масата, за да продължите.',
        en: 'Please scan the table QR code to continue.',
        de: 'Bitte scannen Sie den QR-Code am Tisch, um fortzufahren.'
      }
    };

    const localeMessages = messages[reason ?? 'default'] || messages.default;
    return localeMessages[locale as 'bg' | 'en' | 'de'] || messages.default.bg;
  }, [locale]);

  const validateSession = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setSessionStatus('checking');
    }

    try {
      const response = await fetch('/api/table-session/validate', {
        method: 'POST',
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (data.tableNumber) {
          setTableNumber(String(data.tableNumber));
        }
        setSessionStatus('valid');
        setSessionMessage(null);
        return { ok: true as const, tableNumber: data.tableNumber };
      }

      const message = getSessionMessageForReason(data.reason);
      setSessionStatus('invalid');
      setSessionMessage(message);
      setTableNumber(null);
      return { ok: false as const, reason: data.reason };
    } catch {
      const message = getSessionMessageForReason('missing');
      setSessionStatus('invalid');
      setSessionMessage(message);
      setTableNumber(null);
      return { ok: false as const, reason: 'missing' };
    }
  }, [getSessionMessageForReason]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams.get('session')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('session');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      clearApprovalPolling();
    };
  }, [clearApprovalPolling]);

  // Listen for order status and approval updates via Pusher
  useEffect(() => {
    if (!tableNumber) return;

    const pusher = getPusherClient();
    const tableChannel = pusher.subscribe(`table-${tableNumber}`);

    const statusHandler = (data: any) => {
      console.log('📢 Order status update received:', data);

      const itemsList =
        data.items && data.items.length
          ? '\n\n' + data.items.map((item: any) => `${item.quantity}x ${item.productName}`).join('\n')
          : '';

      let message = '';
      let type: 'success' | 'error' = 'success';

      switch (data.status) {
        case 'pending':
          message =
            (locale === 'bg'
              ? `🔄 Поръчка #${data.orderNumber} е приета и се подготвя`
              : locale === 'en'
              ? `🔄 Order #${data.orderNumber} accepted and being prepared`
              : `🔄 Bestellung #${data.orderNumber} akzeptiert und wird vorbereitet`) + itemsList;
          break;
        case 'preparing':
          message =
            (locale === 'bg'
              ? `👨‍🍳 Поръчка #${data.orderNumber} се приготвя`
              : locale === 'en'
              ? `👨‍🍳 Order #${data.orderNumber} is being prepared`
              : `👨‍🍳 Bestellung #${data.orderNumber} wird vorbereitet`) + itemsList;
          break;
        case 'ready':
          message =
            (locale === 'bg'
              ? `✅ Поръчка #${data.orderNumber} е готова!`
              : locale === 'en'
              ? `✅ Order #${data.orderNumber} is ready!`
              : `✅ Bestellung #${data.orderNumber} ist fertig!`) + itemsList;
          break;
        case 'completed':
          message =
            (locale === 'bg'
              ? `✅ Поръчка #${data.orderNumber} е завършена`
              : locale === 'en'
              ? `✅ Order #${data.orderNumber} completed`
              : `✅ Bestellung #${data.orderNumber} abgeschlossen`) + itemsList;
          break;
        case 'cancelled':
          message =
            (locale === 'bg'
              ? `❌ Поръчка #${data.orderNumber} е отменена${data.cancellationReason ? ': ' + data.cancellationReason : ''}`
              : locale === 'en'
              ? `❌ Order #${data.orderNumber} cancelled${data.cancellationReason ? ': ' + data.cancellationReason : ''}`
              : `❌ Bestellung #${data.orderNumber} storniert${data.cancellationReason ? ': ' + data.cancellationReason : ''}`) + itemsList;
          type = 'error';
          break;
        default:
          return;
      }

      setToast({ message, type });
    };

    const approvalHandler = (data: any) => {
      console.log('📢 Order approval status received:', data);
      
      // Only process if this is for the current pending order
      if (orderIdRef.current && data?.orderId && data.orderId !== orderIdRef.current) {
        console.log('⚠️ Approval status for different order, ignoring');
        return;
      }
      
      // Process approval status update
      const status = data?.status as 'approved' | 'rejected' | 'auto-rejected';
      if (status && ['approved', 'rejected'].includes(status)) {
        handleApprovalStatusUpdate(status, {
          items: data.items,
          reason: data.reason
        });
      }
    };

    const waiterCallHandler = (data: any) => {
      console.log('📢 Waiter call status received:', data);
      
      let message = '';
      let type: 'success' | 'error' = 'success';
      
      if (data.status === 'acknowledged') {
        message = locale === 'bg'
          ? '✅ Сервитьорът е уведомен и ще дойде скоро'
          : locale === 'en'
          ? '✅ Waiter has been notified and will arrive soon'
          : '✅ Der Kellner wurde benachrichtigt und wird bald kommen';
      } else if (data.status === 'completed') {
        const callTypeText = data.callType === 'payment_cash'
          ? (locale === 'bg' ? 'Плащане с брой' : locale === 'en' ? 'Payment with cash' : 'Zahlung mit Bargeld')
          : data.callType === 'payment_card'
          ? (locale === 'bg' ? 'Плащане с карта' : locale === 'en' ? 'Payment with card' : 'Zahlung mit Karte')
          : (locale === 'bg' ? 'Помощ' : locale === 'en' ? 'Help' : 'Hilfe');
        
        message = locale === 'bg'
          ? `✅ ${callTypeText} - завършено`
          : locale === 'en'
          ? `✅ ${callTypeText} - completed`
          : `✅ ${callTypeText} - abgeschlossen`;
      }
      
      if (message) {
        setToast({ message, type, persistent: true });
      }
    };

    tableChannel.bind('order-status-update', statusHandler);
    tableChannel.bind('order-approval-status', approvalHandler);
    tableChannel.bind('waiter-call-status', waiterCallHandler);

    return () => {
      tableChannel.unbind('order-status-update', statusHandler);
      tableChannel.unbind('order-approval-status', approvalHandler);
      tableChannel.unbind('waiter-call-status', waiterCallHandler);
      pusher.unsubscribe(`table-${tableNumber}`);
    };
  }, [handleApprovalStatusUpdate, locale, tableNumber]);

  // Reset scroll position immediately when component mounts and while the loading screen is visible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Force scroll to top immediately on mount
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Also try scrollTo with different methods
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };
    
    resetScroll();
    
    // Reset on loading screen visibility change
    if (showLoadingScreen) {
      resetScroll();
      // Also use requestAnimationFrame to ensure it happens after render
      requestAnimationFrame(() => {
        resetScroll();
      });
    }
  }, [showLoadingScreen]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu')
        ]);
        
        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();
        
        setCategories(categoriesData.categories || []);
        setProducts(productsData.products || []);
        
        // Set initial active category
        if (categoriesData.categories && categoriesData.categories.length > 0) {
          const firstParent = categoriesData.categories.find((c: any) => !c.parentCategoryId);
          if (firstParent) {
            setActiveCategory(firstParent.id);
            const firstSub = categoriesData.categories.find((c: any) => c.parentCategoryId === firstParent.id);
            if (firstSub) {
              setActiveSubCategory(firstSub.id);
            } else {
              setActiveSubCategory('');
            }
          }
        }
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

  const pollApprovalStatus = useCallback(
    (orderId: string) => {
      clearApprovalPolling();

      // Fallback polling only every 60 seconds (Pusher is primary method)
      // This ensures we still get updates even if Pusher connection fails
      approvalPollRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}/approval-status`);
          if (response.ok) {
            const data = await response.json();
            if (data.status && data.status !== 'pending') {
              console.log('📡 Fallback poll detected approval status change:', data.status);
              handleApprovalStatusUpdate(data.status as 'approved' | 'rejected' | 'auto-rejected', data);
            }
          }
        } catch (error) {
          console.log('Approval poll failed:', error);
        }
      }, 60000); // 60 seconds instead of 10 - Pusher is primary

      // Auto-reject timeout (still needed as safety mechanism)
      approvalTimeoutRef.current = setTimeout(() => {
        if (approvalStatusRef.current === 'pending') {
          handleApprovalStatusUpdate('auto-rejected');
        }
      }, autoRejectMinutesValue * 60 * 1000);
    },
    [autoRejectMinutesValue, clearApprovalPolling, handleApprovalStatusUpdate]
  );

  const submitOrder = async () => {
    if (cart.length === 0) return;
    
    // Prevent duplicate submissions
    if (submitting) return;
    
    setSubmitting(true);

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
      setSubmitting(false);
      return;
    }

    try {
      const sessionCheck = await validateSession({ silent: true });
      if (!sessionCheck.ok) {
        setToast({ 
          message: getSessionMessageForReason(sessionCheck.reason),
          type: 'error' 
        });
        setSubmitting(false);
        return;
      }

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

      const responseData = await response.json();

      if (!response.ok) {
        // Handle 409 Conflict - pending approval exists
        if (response.status === 409) {
          setToast({ 
            message: responseData.error || 'Има изчакваща поръчка за одобрение',
            type: 'error' 
          });
          setSubmitting(false);
          return;
        }
        
        // Handle 401 Unauthorized - session expired
        if (response.status === 401) {
          const message = getSessionMessageForReason(responseData.reason);
          setSessionStatus('invalid');
          setSessionMessage(message);
          setToast({ 
            message,
            type: 'error' 
          });
          setSubmitting(false);
          return;
        }
        
        // Handle 429 Rate Limit - too many orders
        if (response.status === 429) {
          let errorMsg = responseData.error || 'Твърде много поръчки';
          if (responseData.details) {
            errorMsg += `\n${responseData.details}`;
          }
          setToast({ 
            message: errorMsg,
            type: 'error' 
          });
          setSubmitting(false);
          return;
        }
        
        // Handle other errors
        setToast({ 
          message: responseData.error || responseData.details || 'Грешка при създаване на поръчка',
          type: 'error' 
        });
        setSubmitting(false);
        return;
      }

      setApprovalConfig(responseData.approvalConfig ?? null);

      // Success - check if approval is required
      if (responseData.requiresApproval) {
        setRequiresApproval(true);
        setApprovalStatus('pending');
        setOrderId(responseData.orderId);
        pollApprovalStatus(responseData.orderId);

        setToast({ 
          message: locale === 'bg' 
            ? '⚠️ Поръчката изисква одобрение от администратор'
            : locale === 'en'
            ? '⚠️ Order requires admin approval'
            : '⚠️ Bestellung erfordert Admin-Genehmigung',
          type: 'error' 
        });
      } else {
        setToast({ 
          message: locale === 'bg' 
            ? `✅ Поръчка #${responseData.orderNumber} е създадена успешно!`
            : locale === 'en'
            ? `✅ Order #${responseData.orderNumber} created successfully!`
            : `✅ Bestellung #${responseData.orderNumber} erfolgreich erstellt!`,
          type: 'success' 
        });
        setCart([]);
        setShowCart(false);
      }
      
      setSubmitting(false);
    } catch (error: any) {
      console.error('Submit order error:', error);
      setToast({ 
        message: locale === 'bg' 
          ? 'Грешка при създаване на поръчка. Моля, опитайте отново.'
          : locale === 'en'
          ? 'Error creating order. Please try again.'
          : 'Fehler beim Erstellen der Bestellung. Bitte versuchen Sie es erneut.',
        type: 'error' 
      });
      setSubmitting(false);
    }
  };

  const sessionOverlayTitle = sessionStatus === 'checking'
    ? (locale === 'bg'
        ? 'Проверка на сесията...'
        : locale === 'en'
        ? 'Verifying your session...'
        : 'Sitzung wird überprüft...')
    : (locale === 'bg'
        ? 'Сесията е изтекла'
        : locale === 'en'
        ? 'Session expired'
        : 'Sitzung abgelaufen');

  const sessionOverlayBody = sessionStatus === 'checking'
    ? (locale === 'bg'
        ? 'Моля, изчакайте докато проверим връзката със системата.'
        : locale === 'en'
        ? 'Please wait while we verify the connection to the system.'
        : 'Bitte warten Sie, während wir die Verbindung überprüfen.')
    : (sessionMessage || getSessionMessageForReason());

  if (showLoadingScreen) {
    return <LoadingScreen locale={locale} />;
  }

  return (
    <main className="min-h-screen bg-black pb-32">
      {/* Toast Notifications - hidden when server is offline */}
      {toast && !isOffline && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          persistent={true}
          locale={locale}
        />
      )}

      {/* Approval Banner */}
      {requiresApproval && (
        <div className="bg-yellow-100 border-b-4 border-yellow-400 text-yellow-800 p-4 sticky top-0 z-50">
          <div className="container mx-auto">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <p className="font-semibold text-lg mb-2">
                  {locale === 'bg' ? 'Поръчката изисква одобрение' : 
                   locale === 'en' ? 'Order requires approval' : 
                   'Bestellung erfordert Genehmigung'}
                </p>
                <p className="text-sm mb-2">
                  {locale === 'bg' 
                    ? `Направени са ${approvalThresholdValue} поръчки за последните ${approvalWindowValue} минути. Заради съображения за сигурност и превантивно действие при потенциално неправомерни действия и хакерски атаки, тази поръчка изисква одобрение.`
                    : locale === 'en'
                    ? `${approvalThresholdValue} orders have been placed in the last ${approvalWindowValue} minutes. Due to security concerns and preventive action against potentially unauthorized actions and hacking attacks, this order requires approval.`
                    : `${approvalThresholdValue} Bestellungen wurden in den letzten ${approvalWindowValue} Minuten aufgegeben. Aufgrund von Sicherheitsbedenken und präventiven Maßnahmen gegen möglicherweise unbefugte Aktionen und Hacking-Angriffe erfordert diese Bestellung eine Genehmigung.`}
                </p>
                {approvalStatus === 'pending' && (
                  <p className="text-sm font-medium">
                    {locale === 'bg' 
                      ? '⏳ Очакване на одобрение от администратор...'
                      : locale === 'en'
                      ? '⏳ Waiting for admin approval...'
                      : '⏳ Warten auf Admin-Genehmigung...'}
                  </p>
                )}
                {approvalStatus === 'approved' && (
                  <p className="text-sm font-medium text-green-700">
                    {locale === 'bg' 
                      ? '✅ Поръчката е одобрена!'
                      : locale === 'en'
                      ? '✅ Order approved!'
                      : '✅ Bestellung genehmigt!'}
                  </p>
                )}
                {approvalStatus === 'rejected' && (
                  <p className="text-sm font-medium text-red-700">
                    {locale === 'bg' 
                      ? '❌ Поръчката е отхвърлена'
                      : locale === 'en'
                      ? '❌ Order rejected'
                      : '❌ Bestellung abgelehnt'}
                  </p>
                )}
                {approvalStatus === 'auto-rejected' && (
                  <p className="text-sm font-medium text-red-600">
                    {locale === 'bg'
                      ? `⏱️ Поръчката беше автоматично отхвърлена след ${autoRejectMinutesValue} минути`
                      : locale === 'en'
                      ? `⏱️ Order was automatically rejected after ${autoRejectMinutesValue} minutes`
                      : `⏱️ Bestellung wurde nach ${autoRejectMinutesValue} Minuten automatisch abgelehnt`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
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

      {/* Category Filter */}
      <div className="bg-black/95 backdrop-blur-lg border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          {/* Get parent categories and subcategories */}
          {(() => {
            const parentCategories = categories.filter((c: any) => !c.parentCategoryId);
            const subCategories = categories.filter((c: any) => c.parentCategoryId === activeCategory);
            const displayCategoryId = activeSubCategory || activeCategory;
            const categoryProducts = products.filter((p: any) => p.categoryId === displayCategoryId);
            
            const handleCategorySelect = (categoryId: string) => {
              setActiveCategory(categoryId);
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
              <>
                {/* Parent Categories - Mobile */}
                <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar mb-3">
                  <div className="flex gap-3 min-w-max">
                    {parentCategories.map((category: any) => {
                      const categoryName = locale === 'bg' ? category.nameBg : locale === 'en' ? category.nameEn : category.nameDe;
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
                
                {/* Parent Categories - Desktop */}
                <div className="hidden md:block mb-3">
                  <div className="flex flex-wrap gap-3 justify-center max-w-6xl mx-auto">
                    {parentCategories.map((category: any) => {
                      const categoryName = locale === 'bg' ? category.nameBg : locale === 'en' ? category.nameEn : category.nameDe;
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
                    {/* Mobile */}
                    <div className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar">
                      <div className="flex gap-2 min-w-max">
                        {subCategories.map((subCategory: any) => {
                          const subCategoryName = locale === 'bg' ? subCategory.nameBg : locale === 'en' ? subCategory.nameEn : subCategory.nameDe;
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
                    
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <div className="flex flex-wrap gap-2 justify-center max-w-6xl mx-auto">
                        {subCategories.map((subCategory: any) => {
                          const subCategoryName = locale === 'bg' ? subCategory.nameBg : locale === 'en' ? subCategory.nameEn : subCategory.nameDe;
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
              </>
            );
          })()}
        </div>
      </div>

      {/* Menu */}
      <div className="container mx-auto px-4 py-8">
        {(() => {
          const displayCategoryId = activeSubCategory || activeCategory;
          const categoryProducts = products.filter((p: any) => p.categoryId === displayCategoryId);
          
          if (categoryProducts.length === 0) {
            return (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-300 text-xl">
                  {locale === 'bg' ? 'Няма продукти в тази категория' : 
                   locale === 'en' ? 'No products in this category' : 
                   'Keine Produkte in dieser Kategorie'}
                </p>
              </div>
            );
          }
          
          // Get category name for display
          const currentCategory = categories.find((c: any) => c.id === displayCategoryId);
          const categoryName = currentCategory 
            ? (locale === 'bg' ? currentCategory.nameBg : locale === 'en' ? currentCategory.nameEn : currentCategory.nameDe)
            : '';
          
          return (
            <div className="mb-16">
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
                      
                      {product.descriptionBg || product.descriptionEn || product.descriptionDe ? (
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed break-words whitespace-pre-wrap">
                          {locale === 'bg' && product.descriptionBg ? product.descriptionBg :
                           locale === 'en' && product.descriptionEn ? product.descriptionEn :
                           locale === 'de' && product.descriptionDe ? product.descriptionDe :
                           product.descriptionBg || product.descriptionEn || product.descriptionDe}
                        </p>
                      ) : null}
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                        <Price
                          priceBgn={Number(product.priceBgn)}
                          className="text-2xl font-bold text-white"
                          showBoth={true}
                          inline={true}
                        />
                        <button
                          onClick={() => addToCart(product)}
                          className="px-6 py-2 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all text-sm md:text-base"
                        >
                          {locale === 'bg' ? '+ Добави' : locale === 'en' ? '+ Add' : '+ Hinzufügen'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
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
                  {/* Approval Banner in Cart Modal */}
                  {requiresApproval && (
                    <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg mb-2 text-yellow-200">
                            {locale === 'bg' ? 'Поръчката изисква одобрение' : 
                             locale === 'en' ? 'Order requires approval' : 
                             'Bestellung erfordert Genehmigung'}
                          </p>
                          <p className="text-sm mb-2 text-yellow-100">
                            {locale === 'bg' 
                              ? `Направени са ${approvalThresholdValue} поръчки за последните ${approvalWindowValue} минути. Заради съображения за сигурност и превантивно действие при потенциално неправомерни действия и хакерски атаки, тази поръчка изисква одобрение.`
                              : locale === 'en'
                              ? `${approvalThresholdValue} orders have been placed in the last ${approvalWindowValue} minutes. Due to security concerns and preventive action against potentially unauthorized actions and hacking attacks, this order requires approval.`
                              : `${approvalThresholdValue} Bestellungen wurden in den letzten ${approvalWindowValue} Minuten aufgegeben. Aufgrund von Sicherheitsbedenken und präventiven Maßnahmen gegen möglicherweise unbefugte Aktionen und Hacking-Angriffe erfordert diese Bestellung eine Genehmigung.`}
                          </p>
                          {approvalStatus === 'pending' && (
                            <p className="text-sm font-medium text-yellow-200">
                              {locale === 'bg' 
                                ? '⏳ Очакване на одобрение от администратор...'
                                : locale === 'en'
                                ? '⏳ Waiting for admin approval...'
                                : '⏳ Warten auf Admin-Genehmigung...'}
                            </p>
                          )}
                          {approvalStatus === 'approved' && (
                            <p className="text-sm font-medium text-green-300">
                              {locale === 'bg' 
                                ? '✅ Поръчката е одобрена!'
                                : locale === 'en'
                                ? '✅ Order approved!'
                                : '✅ Bestellung genehmigt!'}
                            </p>
                          )}
                          {approvalStatus === 'rejected' && (
                            <p className="text-sm font-medium text-red-300">
                              {locale === 'bg' 
                                ? '❌ Поръчката е отхвърлена'
                                : locale === 'en'
                                ? '❌ Order rejected'
                                : '❌ Bestellung abgelehnt'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                    disabled={submitting || cart.length === 0}
                    className="w-full px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{locale === 'bg' ? 'Изпращане...' : locale === 'en' ? 'Sending...' : 'Wird gesendet...'}</span>
                      </>
                    ) : (
                      <>
                        ✅ {locale === 'bg' ? 'Изпрати поръчка' : locale === 'en' ? 'Send Order' : 'Bestellung senden'}
                      </>
                    )}
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

      {sessionStatus !== 'valid' && (
        <div className="fixed inset-0 z-[60] bg-black/95 px-6 flex items-center justify-center text-center">
          <div className="max-w-2xl">
            <div className="text-6xl mb-6">
              {sessionStatus === 'checking' ? '🔄' : '🔒'}
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{sessionOverlayTitle}</h2>
            <p className="text-gray-300 text-lg mb-8 whitespace-pre-line">
              {sessionOverlayBody}
            </p>

            {sessionStatus === 'invalid' ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => validateSession()}
                  className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  🔄 {locale === 'bg' ? 'Провери отново' : locale === 'en' ? 'Check again' : 'Erneut prüfen'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all"
                >
                  ↻ {locale === 'bg' ? 'Обнови страницата' : locale === 'en' ? 'Refresh page' : 'Seite neu laden'}
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function OrderPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  
  return (
    <Suspense fallback={<LoadingScreen locale={locale} />}>
      <OrderPageContent />
    </Suspense>
  );
}


