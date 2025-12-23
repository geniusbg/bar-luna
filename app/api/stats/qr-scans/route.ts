import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Set date range
    const fromDate = dateFrom ? new Date(dateFrom) : new Date();
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = dateTo ? new Date(dateTo) : new Date();
    toDate.setHours(23, 59, 59, 999);

    // Get scans grouped by date
    const scans = await prisma.qrScan.findMany({
      where: {
        scannedAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      select: {
        scannedAt: true,
        tableNumber: true
      },
      orderBy: {
        scannedAt: 'asc'
      }
    });

    // Group scans by date
    const scansByDate = new Map<string, number>();
    scans.forEach(scan => {
      const dateKey = scan.scannedAt.toISOString().split('T')[0];
      scansByDate.set(dateKey, (scansByDate.get(dateKey) || 0) + 1);
    });

    // Get scans by table
    const scansByTable = await prisma.qrScan.groupBy({
      by: ['tableNumber'],
      where: {
        scannedAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Convert to array format
    const dailyData = Array.from(scansByDate.entries()).map(([date, count]) => ({
      date,
      scans: count
    })).sort((a, b) => a.date.localeCompare(b.date));

    const tableData = scansByTable.map(item => ({
      tableNumber: item.tableNumber,
      scans: item._count.id
    }));

    return NextResponse.json({
      daily: dailyData,
      byTable: tableData,
      total: scans.length
    });
  } catch (error) {
    console.error('Error fetching QR scan stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


