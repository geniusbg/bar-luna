import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    
    const now = new Date();
    let dateFilter: any = {};
    
    if (period === 'today') {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      dateFilter = { gte: todayStart };
    } else if (period === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      dateFilter = { gte: weekStart };
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      dateFilter = { gte: monthStart };
    }
    
    // Table performance stats
    const tableStats = await prisma.order.groupBy({
      by: ['tableNumber'],
      where: {
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _sum: {
        totalBgn: true,
        totalEur: true
      },
      _count: true,
      _avg: {
        totalBgn: true
      },
      orderBy: {
        _sum: {
          totalBgn: 'desc'
        }
      }
    });
    
    // Get table details from BarTable
    const tablesWithDetails = await Promise.all(
      tableStats.map(async (stat) => {
        const table = await prisma.barTable.findUnique({
          where: { tableNumber: stat.tableNumber },
          select: {
            tableName: true,
            location: true,
            capacity: true
          }
        });
        
        return {
          tableNumber: stat.tableNumber,
          tableName: table?.tableName || `Маса ${stat.tableNumber}`,
          location: table?.location || 'unknown',
          capacity: table?.capacity || 4,
          ordersCount: stat._count,
          totalRevenue: Number(stat._sum.totalBgn || 0),
          totalRevenueEur: Number(stat._sum.totalEur || 0),
          avgOrderValue: Number(stat._avg.totalBgn || 0)
        };
      })
    );
    
    // Calculate total utilization
    const totalTables = await prisma.barTable.count({ where: { isActive: true } });
    const activeTablesCount = tableStats.length;
    const utilizationPercent = totalTables > 0 ? (activeTablesCount / totalTables) * 100 : 0;
    
    // Location performance
    const locationStats = tablesWithDetails.reduce((acc: any, table) => {
      const loc = table.location;
      if (!acc[loc]) {
        acc[loc] = {
          location: loc,
          tables: 0,
          orders: 0,
          revenue: 0
        };
      }
      acc[loc].tables++;
      acc[loc].orders += table.ordersCount;
      acc[loc].revenue += table.totalRevenue;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      period,
      tables: tablesWithDetails,
      summary: {
        totalTables,
        activeTables: activeTablesCount,
        utilizationPercent: Math.round(utilizationPercent * 10) / 10
      },
      locationPerformance: Object.values(locationStats)
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get tables stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tables statistics',
      details: error.message 
    }, { status: 500 });
  }
}

