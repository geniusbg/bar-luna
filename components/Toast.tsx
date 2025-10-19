'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    success: 'bg-green-500 border-green-400',
    error: 'bg-red-500 border-red-400',
    info: 'bg-blue-500 border-blue-400'
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div className="fixed top-24 right-8 z-[100] animate-slide-in">
      <div className={`${colors[type]} border-4 rounded-2xl p-6 shadow-2xl min-w-[300px] max-w-md`}>
        <div className="flex items-center gap-4">
          <div className="text-4xl text-white font-bold">
            {icons[type]}
          </div>
          <div className="flex-1">
            <p className="text-xl font-semibold text-white">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/70 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white animate-progress"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
}

