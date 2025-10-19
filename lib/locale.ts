import { cookies } from 'next/headers';

export type Locale = 'bg' | 'en' | 'de';

export const defaultLocale: Locale = 'bg';
export const locales: Locale[] = ['bg', 'en', 'de'];

// Get locale from query parameter or cookie
export async function getLocale(searchParams?: { lang?: string }): Promise<Locale> {
  // 1. Check query parameter
  if (searchParams?.lang && locales.includes(searchParams.lang as Locale)) {
    return searchParams.lang as Locale;
  }

  // 2. Check cookie
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale')?.value;
    if (localeCookie && locales.includes(localeCookie as Locale)) {
      return localeCookie as Locale;
    }
  } catch (error) {
    console.error('Error reading locale cookie:', error);
  }

  // 3. Default to Bulgarian
  return defaultLocale;
}

// Client-side locale detection
export function getClientLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  // Check URL parameter
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  if (lang && locales.includes(lang as Locale)) {
    return lang as Locale;
  }

  // Check cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'locale' && locales.includes(value as Locale)) {
      return value as Locale;
    }
  }

  return defaultLocale;
}

// Set locale in cookie
export function setLocaleCookie(locale: Locale) {
  if (typeof window === 'undefined') return;
  document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
}

// Get localized text based on current locale
export function getLocalizedText(
  locale: Locale,
  texts: { bg: string; en: string; de: string }
): string {
  return texts[locale] || texts[defaultLocale];
}

