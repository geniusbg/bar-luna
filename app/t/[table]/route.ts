import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table: tableParam } = await params;
    const tableNumber = parseInt(tableParam);

    if (isNaN(tableNumber)) {
      return NextResponse.redirect(new URL('/bg/menu', request.url));
    }

    // Find table and increment scan count
    const barTable = await prisma.barTable.findUnique({
      where: { tableNumber }
    });

    if (!barTable) {
      return NextResponse.redirect(new URL('/bg/menu', request.url));
    }

    // Check if table is active
    if (!barTable.isActive) {
      return NextResponse.redirect(new URL('/bg/menu', request.url));
    }

    // Increment scan count and update last scanned timestamp
    await prisma.barTable.update({
      where: { id: barTable.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date()
      }
    });

    // Get redirect URL (default to order page with BG locale)
    const redirectUrl = barTable.redirectUrl || `/bg/order?table=${tableNumber}`;
    
    // If it's a relative URL, use current domain
    if (redirectUrl.startsWith('/')) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    
    // If it's an absolute URL, redirect directly
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('QR redirect error:', error);
    return NextResponse.redirect(new URL('/bg/menu', request.url));
  }
}

