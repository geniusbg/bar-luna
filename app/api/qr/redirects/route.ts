import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all QR redirect configurations
export async function GET() {
  try {
    const tables = await prisma.barTable.findMany({
      orderBy: { tableNumber: 'asc' },
      select: {
        id: true,
        tableNumber: true,
        tableName: true,
        isActive: true,
        redirectUrl: true,
        scanCount: true,
        lastScannedAt: true,
        qrCodeUrl: true
      }
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error fetching QR redirects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update QR redirect configuration
export async function PUT(request: Request) {
  try {
    const { tableNumber, redirectUrl, isActive, tableName } = await request.json();

    if (!tableNumber) {
      return NextResponse.json({ error: 'Table number required' }, { status: 400 });
    }

    const updateData: any = {};
    if (redirectUrl !== undefined) {
      updateData.redirectUrl = redirectUrl || null;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (tableName !== undefined) {
      updateData.tableName = tableName || null;
    }

    const table = await prisma.barTable.update({
      where: { tableNumber: parseInt(tableNumber) },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      table: {
        tableNumber: table.tableNumber,
        redirectUrl: table.redirectUrl,
        isActive: table.isActive,
        tableName: table.tableName
      }
    });
  } catch (error) {
    console.error('Error updating QR redirect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

