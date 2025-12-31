/**
 * Safe App URL helper
 * Validates and provides safe access to NEXT_PUBLIC_APP_URL
 */

import { validateAppUrl } from './env-validation';

let cachedAppUrl: string | null = null;

/**
 * Get validated app URL
 * Validates the URL and caches it for performance
 */
export function getAppUrl(): string {
  if (cachedAppUrl) {
    return cachedAppUrl;
  }

  // Validate on first access
  cachedAppUrl = validateAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  return cachedAppUrl;
}

/**
 * Build a full URL using the app URL
 * @param path - Path to append (e.g., '/api/push/send')
 */
export function buildAppUrl(path: string): string {
  const baseUrl = getAppUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

