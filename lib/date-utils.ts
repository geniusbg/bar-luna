/**
 * Date utilities for Bulgarian timezone (Europe/Sofia)
 * 
 * All functions use Europe/Sofia timezone to ensure consistent date/time handling
 * regardless of server or client timezone.
 */

const BULGARIAN_TIMEZONE = 'Europe/Sofia';
const BULGARIAN_LOCALE = 'bg-BG';

/**
 * Format a date to Bulgarian locale string with time
 * Example: "23.12.2025 г., 17:51"
 */
export function formatBulgarianDateTime(date: Date | string | null): string {
  if (!date) return 'Никога';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString(BULGARIAN_LOCALE, {
    timeZone: BULGARIAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date to Bulgarian locale date string (without time)
 * Example: "23.12.2025 г."
 */
export function formatBulgarianDate(date: Date | string | null): string {
  if (!date) return 'Никога';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(BULGARIAN_LOCALE, {
    timeZone: BULGARIAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date to Bulgarian locale with full date and time
 * Example: "23 декември 2025 г., 17:51"
 */
export function formatBulgarianDateTimeFull(date: Date | string | null): string {
  if (!date) return 'Никога';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(BULGARIAN_LOCALE, {
    timeZone: BULGARIAN_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date to Bulgarian locale with month name (for events)
 * Example: "23 декември 2025 г., 17:51"
 */
export function formatBulgarianDateWithMonth(date: Date | string | null): string {
  if (!date) return 'Никога';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(BULGARIAN_LOCALE, {
    timeZone: BULGARIAN_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time only in Bulgarian locale
 * Example: "17:51"
 */
export function formatBulgarianTime(date: Date | string | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString(BULGARIAN_LOCALE, {
    timeZone: BULGARIAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get current date/time in Bulgarian timezone
 * Returns a Date object that represents the current time in Sofia
 * 
 * Note: JavaScript Date objects are always stored in UTC internally.
 * PostgreSQL also stores timestamps in UTC.
 * This function returns the current UTC time, which will display correctly
 * when formatted with Bulgarian timezone using the formatBulgarian* functions.
 */
export function getBulgarianDateTime(): Date {
  // Simply return current time - PostgreSQL stores it as UTC
  // When we format it with timeZone: 'Europe/Sofia', JavaScript automatically
  // converts it to the correct Sofia time
  return new Date();
}

/**
 * Format date for a specific locale (bg, en, de) with month name
 * Used for events that need multilingual date formatting
 * Always uses Bulgarian timezone (Europe/Sofia) regardless of locale
 */
export function formatDateForLocale(
  date: Date | string | null,
  locale: 'bg' | 'en' | 'de'
): string {
  if (!date) {
    const noDateMap = {
      bg: 'Никога',
      en: 'Never',
      de: 'Nie'
    };
    return noDateMap[locale];
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeMap = {
    bg: 'bg-BG',
    en: 'en-US',
    de: 'de-DE'
  };
  
  return dateObj.toLocaleDateString(localeMap[locale], {
    timeZone: BULGARIAN_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Create a date range string in Bulgarian format
 * Example: "23.12.2025 г. - 24.12.2025 г." or "23.12.2025 г." if same day
 */
export function formatBulgarianDateRange(dateFrom: Date | string, dateTo: Date | string): string {
  const fromStr = formatBulgarianDate(dateFrom);
  const toStr = formatBulgarianDate(dateTo);
  
  if (fromStr === toStr) {
    return fromStr;
  }
  
  return `${fromStr} - ${toStr}`;
}
