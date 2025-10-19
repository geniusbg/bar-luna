import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tables = await prisma.barTable.findMany({
      orderBy: { tableNumber: 'asc' }
    });

    // Format data for frontend
    const formattedTables = tables.map(table => ({
      tableNumber: table.tableNumber,
      tableName: table.tableName,
      qrCodeDataUrl: table.qrCodeData,
      qrCodeUrl: table.qrCodeUrl
    }));

    return NextResponse.json({ tables: formattedTables });
  } catch (error) {
    console.error('Get tables error:', error);
    return NextResponse.json({ error: 'Failed to get tables' }, { status: 500 });
  }
}

