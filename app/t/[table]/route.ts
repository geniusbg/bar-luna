import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const tableNumber = parseInt(params.table);

    if (isNaN(tableNumber)) {
      return NextResponse.redirect(new URL('/bg/menu', request.url));
    }

    // Find table and increment scan count
    const table = await prisma.barTable.findUnique({
      where: { tableNumber }
    });

    if (!table) {
      return NextResponse.redirect(new URL('/bg/menu', request.url));
    }

    // Check if table is active
    if (!table.isActive) {
      return NextResponse.redirect(new URL('/bg/menu', request.url));
    }

    // Increment scan count and update last scanned timestamp
    await prisma.barTable.update({
      where: { id: table.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date()
      }
    });

    // Get redirect URL (default to order page)
    const redirectUrl = table.redirectUrl || `/order?table=${tableNumber}`;
    
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

