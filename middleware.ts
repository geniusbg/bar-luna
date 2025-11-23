import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'always',
  localeDetection: false // Винаги използвай defaultLocale (bg) вместо browser detection
});

export default async function middleware(request: NextRequest) {
  // Apply i18n middleware first
  const response = intlMiddleware(request);
  
  // Check authentication for admin and staff routes (except login pages)
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.includes('/admin');
  const isStaffRoute = pathname.includes('/staff');
  const isLoginPage = pathname.includes('/login');
  
  // Only check auth for admin/staff routes that are NOT login pages
  if ((isAdminRoute || isStaffRoute) && !isLoginPage) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
    });
    
    if (!token) {
      // No token, redirect to appropriate login
      const locale = pathname.split('/')[1] || 'bg';
      if (isAdminRoute) {
        return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
      }
      if (isStaffRoute) {
        return NextResponse.redirect(new URL(`/${locale}/staff/login`, request.url));
      }
    } else {
      const userRole = token.role;
      
      // Check role-based access
      if (isAdminRoute && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        // Redirect STAFF to staff panel
        if (userRole === 'STAFF') {
          const locale = pathname.split('/')[1] || 'bg';
          return NextResponse.redirect(new URL(`/${locale}/staff`, request.url));
        }
        // Redirect others to admin login
        const locale = pathname.split('/')[1] || 'bg';
        return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
      }
      
      if (isStaffRoute && userRole !== 'STAFF') {
        // Allow ADMIN/SUPER_ADMIN to access staff routes (for management purposes)
        // Only redirect non-authenticated users or users without proper roles
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
          const locale = pathname.split('/')[1] || 'bg';
          return NextResponse.redirect(new URL(`/${locale}/staff/login`, request.url));
        }
        // ADMIN/SUPER_ADMIN can access staff routes - don't redirect
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - _next (Next.js internals)
    // - Static files (uploads, images, etc)
    // - PWA files (manifest, service worker, icons)
    // - /t (QR redirect short links)
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|t|manifest.*\.json|sw\.js|luna-icon|luna-logo|smartphone.*\.png).*)',
  ]
};


