'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallWaiterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get('table');

  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);

  const callWaiter = async (callType: string) => {
    setCalling(true);

    try {
      const response = await fetch('/api/waiter-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber || '0'),
          callType,
          message: callType === 'payment_cash' ? 'Плащане с брой' : callType === 'payment_card' ? 'Плащане с карта' : 'Нужна помощ'
        })
      });

      if (response.ok) {
        setCalled(true);
        setTimeout(() => {
          router.back();
        }, 3000);
      }
    } catch (error) {
      alert('❌ Грешка при повикване');
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
            Сервитьорът е повикан!
          </h1>
          <p className="text-xl text-gray-200">
            Маса {tableNumber}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Повикай сервитьор
            </h1>
            <p className="text-2xl text-gray-200">
              Маса {tableNumber}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Cash */}
            <button
              onClick={() => callWaiter('payment_cash')}
              disabled={calling}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 hover:bg-white/20 transition-all text-center disabled:opacity-50"
            >
              <div className="text-6xl mb-4">💵</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Плащане с брой
              </h2>
              <p className="text-gray-200">
                Сервитьорът ще дойде с бележката
              </p>
            </button>

            {/* Payment Card */}
            <button
              onClick={() => callWaiter('payment_card')}
              disabled={calling}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 hover:bg-white/20 transition-all text-center disabled:opacity-50"
            >
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Плащане с карта
              </h2>
              <p className="text-gray-200">
                Сервитьорът ще донесе POS терминал
              </p>
            </button>

            {/* General Help */}
            <button
              onClick={() => callWaiter('help')}
              disabled={calling}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 hover:bg-white/20 transition-all text-center disabled:opacity-50 md:col-span-2"
            >
              <div className="text-6xl mb-4">🙋</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Нужна ми е помощ
              </h2>
              <p className="text-gray-200">
                Сервитьорът ще дойде веднага
              </p>
            </button>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              ← Назад към менюто
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallWaiterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="logo-container h-64 w-64 md:h-96 md:w-96 mx-auto mb-10 animate-pulse-glow">
            <img
              src="/bg/luna-logo.svg"
              alt="LUNA Logo"
              className="h-64 w-64 md:h-96 md:w-96"
            />
          </div>
          <p className="text-white text-3xl font-medium">Зареждане...</p>
        </div>
      </div>
    }>
      <CallWaiterContent />
    </Suspense>
  );
}
