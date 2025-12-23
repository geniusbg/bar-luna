import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecuritySettings } from '@/lib/security-settings';
import { createTableSession } from '@/lib/table-sessions';

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
    const scanDate = new Date();
    await prisma.$transaction([
      prisma.barTable.update({
        where: { id: barTable.id },
        data: {
          scanCount: { increment: 1 },
          lastScannedAt: scanDate
        }
      }),
      prisma.qrScan.create({
        data: {
          tableId: barTable.id,
          tableNumber: barTable.tableNumber,
          scannedAt: scanDate
        }
      })
    ]);

    const securitySettings = await getSecuritySettings();
    const sessionDurationHours = securitySettings.sessionDurationHours || 3;
    const sessionDurationMs = sessionDurationHours * 60 * 60 * 1000;
    const { token: sessionToken } = await createTableSession(tableNumber, sessionDurationHours);

    // Get redirect URL (default to order page with BG locale)
    const baseRedirectUrl = barTable.redirectUrl || `/bg/order?table=${tableNumber}`;
    
    const isAbsoluteUrl = /^https?:\/\//i.test(baseRedirectUrl);

    // Build absolute URL using baseUrl when needed
    if (!isAbsoluteUrl) {
      // Relative URL - use baseUrl from environment
      const absoluteUrl = new URL(baseRedirectUrl, baseUrl);
      const response = NextResponse.redirect(absoluteUrl);
      response.cookies.set({
        name: 'table_session',
        value: sessionToken,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(sessionDurationMs / 1000)
      });
      return response;
    }
    
    // If it's already an absolute URL, redirect directly
    const response = NextResponse.redirect(baseRedirectUrl);
    response.cookies.set({
      name: 'table_session',
      value: sessionToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(sessionDurationMs / 1000)
    });
    return response;

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

