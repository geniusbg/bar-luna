'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

const languageNames: Record<Locale, string> = {
  bg: 'БГ',
  en: 'EN',
  ro: 'RO',
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLocale = pathname.split('/')[1] as Locale;

  const switchLocale = (newLocale: Locale) => {
    const pathWithoutLocale = pathname.split('/').slice(2).join('/');
    const queryString = searchParams.toString();
    const newPath = `/${newLocale}/${pathWithoutLocale}${queryString ? `?${queryString}` : ''}`;
    router.push(newPath);
  };

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-3 py-1 rounded-md transition-all malts-lang-font ${
            currentLocale === locale
              ? 'bg-[var(--malts-accent)] text-[#f5f0e6] font-semibold'
              : 'bg-[var(--malts-card)] text-[var(--malts-ink)] border border-[var(--malts-hairline)] hover:bg-[var(--malts-card-hover)]'
          }`}
        >
          {languageNames[locale]}
        </button>
      ))}
    </div>
  );
}


