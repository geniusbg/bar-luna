/**
 * Safe App URL helper
 * Validates and provides safe access to NEXT_PUBLIC_APP_URL
 */

import { validateAppUrl } from './env-validation';
import { NextRequest } from 'next/server';

let cachedAppUrl: string | null = null;

/**
 * Get app URL from request headers (preferred for production)
 * Uses X-Forwarded-Proto and Host headers when available
 */
export function getAppUrlFromRequest(request: NextRequest): string {
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
  const host = request.headers.get('host') || request.nextUrl.host;
  return `${protocol}://${host}`;
}

/**
 * Get validated app URL
 * Validates the URL and caches it for performance
 * 
 * NOTE: This uses environment variable. For production with reverse proxy,
 * prefer using getAppUrlFromRequest() which uses request headers.
 */
export function getAppUrl(): string {
  if (cachedAppUrl) {
    return cachedAppUrl;
  }

  // Validate on first access
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // If URL contains localhost, don't cache it (it's likely wrong for production)
  if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    console.warn(
      '⚠️  NEXT_PUBLIC_APP_URL contains localhost. ' +
      'This may cause redirect issues in production. ' +
      'Consider using request headers instead or update the environment variable.'
    );
    // Still validate and return, but don't cache
    return validateAppUrl(envUrl);
  }

  cachedAppUrl = validateAppUrl(envUrl);
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

