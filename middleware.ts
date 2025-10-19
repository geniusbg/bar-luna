import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - _next (Next.js internals)
    // - Static files (uploads, images, etc)
    // - PWA files (manifest, service worker, icons)
    // - /order (QR code routes)
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|order|manifest.json|sw.js|icon-|badge-).*)',
  ]
};


