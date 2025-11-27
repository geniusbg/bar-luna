'use client';

import Image from 'next/image';
import { useLockScroll } from '@/lib/use-lock-scroll';

interface LoadingScreenProps {
  locale?: string;
}

export default function LoadingScreen({ locale = 'bg' }: LoadingScreenProps) {
  // Lock scroll when loading screen is visible
  useLockScroll(true);

  return (
    <div 
      className="fixed bg-black flex items-center justify-center z-50"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
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
        <p className="text-white text-3xl font-medium">
          {locale === 'bg' ? 'Зареждане...' : locale === 'en' ? 'Loading...' : 'Wird geladen...'}
        </p>
      </div>
    </div>
  );
}

