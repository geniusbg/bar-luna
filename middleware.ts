// Validate environment variables early (server-side only)
import './middleware-env-validation';

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
  const pathname = request.nextUrl.pathname;
  
  // Handle routes without locale prefix (e.g., /staff, /admin)
  // Redirect them to default locale
  if (pathname.startsWith('/staff') || pathname.startsWith('/admin')) {
    // Check if pathname already has a locale prefix (e.g., /bg/staff)
    const firstSegment = pathname.split('/')[1];
    const hasLocalePrefix = locales.includes(firstSegment as any);
    
    if (!hasLocalePrefix) {
      // No locale prefix, redirect to default locale
      const newPath = `/${defaultLocale}${pathname}`;
      return NextResponse.redirect(new URL(newPath, request.url));
    }
  }
  
  // Apply i18n middleware
  const response = intlMiddleware(request);
  
  // Check authentication for admin and staff routes (except login pages)
  
  // If we're on a malformed login URL (e.g., /bg/staff/staff/login), redirect to correct one
  if (pathname.includes('/staff/staff/login') || pathname.includes('/admin/admin/login')) {
    const locale = pathname.split('/')[1] || 'bg';
    if (pathname.includes('/staff')) {
      return NextResponse.redirect(new URL(`/${locale}/staff/login`, request.url));
    }
    if (pathname.includes('/admin')) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
  }
  
  // More precise checks to avoid redirect loops and duplicate paths
  const isAdminLoginPage = /\/[a-z]{2}\/admin\/login$/.test(pathname) || pathname.endsWith('/admin/login');
  const isStaffLoginPage = /\/[a-z]{2}\/staff\/login$/.test(pathname) || pathname.endsWith('/staff/login');
  const isAdminRoute = pathname.includes('/admin') && !isAdminLoginPage;
  const isStaffRoute = pathname.includes('/staff') && !isStaffLoginPage;
  const isLoginPage = isAdminLoginPage || isStaffLoginPage;
  
  // Only check auth for admin/staff routes that are NOT login pages
  if ((isAdminRoute || isStaffRoute) && !isLoginPage) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not set in environment variables');
      // Redirect to login instead of throwing to avoid breaking the app
      const locale = pathname.split('/')[1] || 'bg';
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
    
    const token = await getToken({ 
      req: request,
      secret: secret
    });
    
    if (!token) {
      // No token, redirect to appropriate login
      const locale = pathname.split('/')[1] || 'bg';
      if (isAdminRoute) {
        const loginUrl = new URL(`/${locale}/admin/login`, request.url);
        return NextResponse.redirect(loginUrl);
      }
      if (isStaffRoute) {
        const loginUrl = new URL(`/${locale}/staff/login`, request.url);
        return NextResponse.redirect(loginUrl);
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


