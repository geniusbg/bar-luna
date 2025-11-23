'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Toast from '@/components/Toast';

function CallWaiterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tableNumber = searchParams.get('table');
  
  // Get locale from URL path
  const locale = pathname.split('/')[1] || 'bg';

  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const callWaiter = async (callType: string) => {
    // Prevent duplicate calls
    if (calling) return;
    
    setCalling(true);

    try {
      // Get localized message
      const messages = {
        payment_cash: {
          bg: 'Плащане с брой',
          en: 'Payment with cash',
          de: 'Zahlung mit Bargeld'
        },
        payment_card: {
          bg: 'Плащане с карта',
          en: 'Payment with card',
          de: 'Zahlung mit Karte'
        },
        help: {
          bg: 'Нужна помощ',
          en: 'Need help',
          de: 'Brauche Hilfe'
        }
      };

      const message = messages[callType as keyof typeof messages][locale as 'bg' | 'en' | 'de'];

      const response = await fetch('/api/waiter-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber || '0'),
          callType,
          message
        })
      });

      if (response.ok) {
        setCalled(true);
        setTimeout(() => {
          router.back();
        }, 3000);
      } else {
        const errorMsg = locale === 'bg' ? '❌ Грешка при повикване' : 
                        locale === 'en' ? '❌ Error calling waiter' : 
                        '❌ Fehler beim Anrufen des Kellners';
        setToast({ message: errorMsg, type: 'error' });
      }
    } catch (error) {
      const errorMsg = locale === 'bg' ? '❌ Грешка при повикване' : 
                      locale === 'en' ? '❌ Error calling waiter' : 
                      '❌ Fehler beim Anrufen des Kellners';
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setCalling(false);
    }
  };

  if (called) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-8">✅</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {locale === 'bg' ? 'Сервитьорът е повикан!' : 
             locale === 'en' ? 'Waiter has been called!' : 
             'Kellner wurde gerufen!'}
          </h1>
          <p className="text-xl text-gray-200">
            {locale === 'bg' ? 'Маса' : locale === 'en' ? 'Table' : 'Tisch'} {tableNumber}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              {locale === 'bg' ? 'Повикай сервитьор' : 
               locale === 'en' ? 'Call Waiter' : 
               'Kellner rufen'}
            </h1>
            <p className="text-2xl text-gray-200">
              {locale === 'bg' ? 'Маса' : locale === 'en' ? 'Table' : 'Tisch'} {tableNumber}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Cash */}
            <button
              onClick={() => callWaiter('payment_cash')}
              disabled={calling}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 hover:bg-white/20 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calling ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-200">
                    {locale === 'bg' ? 'Изпращане...' : locale === 'en' ? 'Sending...' : 'Wird gesendet...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">💵</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {locale === 'bg' ? 'Плащане с брой' : 
                     locale === 'en' ? 'Payment with Cash' : 
                     'Zahlung mit Bargeld'}
                  </h2>
                  <p className="text-gray-200">
                    {locale === 'bg' ? 'Сервитьорът ще дойде с бележката' : 
                     locale === 'en' ? 'Waiter will come with the bill' : 
                     'Kellner kommt mit der Rechnung'}
                  </p>
                </>
              )}
            </button>

            {/* Payment Card */}
            <button
              onClick={() => callWaiter('payment_card')}
              disabled={calling}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 hover:bg-white/20 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calling ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-200">
                    {locale === 'bg' ? 'Изпращане...' : locale === 'en' ? 'Sending...' : 'Wird gesendet...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">💳</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {locale === 'bg' ? 'Плащане с карта' : 
                     locale === 'en' ? 'Payment with Card' : 
                     'Zahlung mit Karte'}
                  </h2>
                  <p className="text-gray-200">
                    {locale === 'bg' ? 'Сервитьорът ще донесе POS терминал' : 
                     locale === 'en' ? 'Waiter will bring POS terminal' : 
                     'Kellner bringt POS-Terminal'}
                  </p>
                </>
              )}
            </button>

            {/* General Help */}
            <button
              onClick={() => callWaiter('help')}
              disabled={calling}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 hover:bg-white/20 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed md:col-span-2"
            >
              {calling ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-200">
                    {locale === 'bg' ? 'Изпращане...' : locale === 'en' ? 'Sending...' : 'Wird gesendet...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">🙋</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {locale === 'bg' ? 'Нужна ми е помощ' : 
                     locale === 'en' ? 'I Need Help' : 
                     'Ich brauche Hilfe'}
                  </h2>
                  <p className="text-gray-200">
                    {locale === 'bg' ? 'Сервитьорът ще дойде веднага' : 
                     locale === 'en' ? 'Waiter will come immediately' : 
                     'Kellner kommt sofort'}
                  </p>
                </>
              )}
            </button>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              ← {locale === 'bg' ? 'Назад към менюто' : 
                   locale === 'en' ? 'Back to Menu' : 
                   'Zurück zum Menü'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="logo-container h-64 w-64 md:h-96 md:w-96 mx-auto mb-10 animate-pulse-glow">
          <img
            src="/bg/luna-logo.svg"
            alt="LUNA Logo"
            className="h-64 w-64 md:h-96 md:w-96"
          />
        </div>
        <p className="text-white text-3xl font-medium">
          {locale === 'bg' ? 'Зареждане...' : locale === 'en' ? 'Loading...' : 'Laden...'}
        </p>
      </div>
    </div>
  );
}

export default function CallWaiterPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CallWaiterContent />
    </Suspense>
  );
}
