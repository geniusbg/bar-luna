import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table: tableParam } = await params;
    const tableNumber = parseInt(tableParam);

    // Get base URL from environment or request
    const getBaseUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (envUrl) return envUrl;
      
      const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https://' : 'http://';
      const host = request.headers.get('host') || request.url.split('/')[2];
      return protocol + host;
    };
    
    const baseUrl = getBaseUrl();

    if (isNaN(tableNumber)) {
      return NextResponse.redirect(new URL('/bg/menu', baseUrl));
    }

    // Find table and increment scan count
    const barTable = await prisma.barTable.findUnique({
      where: { tableNumber }
    });

    if (!barTable) {
      return NextResponse.redirect(new URL('/bg/menu', baseUrl));
    }

    // Check if table is active
    if (!barTable.isActive) {
      return NextResponse.redirect(new URL('/bg/menu', baseUrl));
    }

    // Increment scan count and update last scanned timestamp
    await prisma.barTable.update({
      where: { id: barTable.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date()
      }
    });

    // Generate session token (valid for 3 hours)
    const now = Date.now();
    const expiresAt = now + (3 * 60 * 60 * 1000); // 3 hours
    const sessionToken = `table_session_${tableNumber}_${now}_${expiresAt}`;

    // Get redirect URL (default to order page with BG locale)
    const baseRedirectUrl = barTable.redirectUrl || `/bg/order?table=${tableNumber}`;
    
    // Add session token to redirect URL
    const separator = baseRedirectUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${baseRedirectUrl}${separator}session=${encodeURIComponent(sessionToken)}`;
    
    // Build absolute URL using baseUrl
    if (redirectUrl.startsWith('/')) {
      // Relative URL - use baseUrl from environment
      const absoluteUrl = new URL(redirectUrl, baseUrl);
      return NextResponse.redirect(absoluteUrl);
    }
    
    // If it's already an absolute URL, redirect directly
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('QR redirect error:', error);
    const getBaseUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (envUrl) return envUrl;
      
      const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https://' : 'http://';
      const host = request.headers.get('host') || request.url.split('/')[2];
      return protocol + host;
    };
    return NextResponse.redirect(new URL('/bg/menu', getBaseUrl()));
  }
}

