'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

const languageNames: Record<Locale, string> = {
  bg: 'БГ',
  en: 'EN',
  de: 'DE'
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split('/')[1] as Locale;

  const switchLocale = (newLocale: Locale) => {
    const pathWithoutLocale = pathname.split('/').slice(2).join('/');
    router.push(`/${newLocale}/${pathWithoutLocale}`);
  };

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-3 py-1 rounded-md transition-all ${
            currentLocale === locale
              ? 'bg-white text-black font-semibold'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
          }`}
        >
          {languageNames[locale]}
        </button>
      ))}
    </div>
  );
}


