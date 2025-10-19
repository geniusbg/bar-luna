import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { tableNumber } = await request.json();

    if (!tableNumber) {
      return NextResponse.json({ error: 'Table number required' }, { status: 400 });
    }

    // Find table
    const table = await prisma.barTable.findUnique({
      where: { tableNumber: parseInt(tableNumber) }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Generate QR code URL
    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order?table=${tableNumber}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update table with QR code data
    await prisma.barTable.update({
      where: { id: table.id },
      data: {
        qrCodeUrl: qrUrl,
        qrCodeData: qrCodeDataUrl
      }
    });

    return NextResponse.json({
      qrCodeDataUrl,
      qrUrl,
      tableNumber,
      tableName: table.tableName
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate all QR codes at once
export async function GET() {
  try {
    const tables = await prisma.barTable.findMany({
      orderBy: { tableNumber: 'asc' }
    });

    const results = [];

    for (const table of tables) {
      const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order?table=${table.tableNumber}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2
      });

      await prisma.barTable.update({
        where: { id: table.id },
        data: {
          qrCodeUrl: qrUrl,
          qrCodeData: qrCodeDataUrl
        }
      });

      results.push({
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        qrCodeDataUrl
      });
    }

    return NextResponse.json({ tables: results, count: results.length });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


