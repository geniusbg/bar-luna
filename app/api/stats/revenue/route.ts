import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    const now = new Date();
    
    // Custom date range or default to today
    let customDateStart: Date | null = null;
    let customDateEnd: Date | null = null;
    
    if (dateFrom) {
      customDateStart = new Date(dateFrom);
      customDateStart.setHours(0, 0, 0, 0);
    }
    if (dateTo) {
      customDateEnd = new Date(dateTo);
      customDateEnd.setHours(23, 59, 59, 999);
    }
    
    // Today (00:00:00 to 23:59:59)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    // This week (Monday to Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    
    // This month (1st to last day)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    // Use custom date range if provided, otherwise use today/week/month
    const dateFilter = customDateStart && customDateEnd 
      ? { gte: customDateStart, lte: customDateEnd }
      : { gte: todayStart, lte: todayEnd };
    
    // Today's revenue (or custom range)
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: dateFilter,
        status: 'completed'
      },
      _sum: {
        totalBgn: true,
        totalEur: true
      },
      _count: true
    });
    
    // This week's revenue
    const weekRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: weekStart
        },
        status: 'completed'
      },
      _sum: {
        totalBgn: true,
        totalEur: true
      },
      _count: true
    });
    
    // This month's revenue
    const monthRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: monthStart
        },
        status: 'completed'
      },
      _sum: {
        totalBgn: true,
        totalEur: true
      },
      _count: true
    });
    
    // Daily revenue for the last 7 days or custom date range (for chart)
    // OPTIMIZED: Single query instead of multiple queries per day
    let dateRangeStart: Date;
    let dateRangeEnd: Date;
    
    if (customDateStart && customDateEnd) {
      dateRangeStart = customDateStart;
      dateRangeEnd = customDateEnd;
    } else {
      // Default: last 7 days
      dateRangeStart = new Date(now);
      dateRangeStart.setDate(now.getDate() - 6);
      dateRangeStart.setHours(0, 0, 0, 0);
      dateRangeEnd = new Date(now);
      dateRangeEnd.setHours(23, 59, 59, 999);
    }
    
    // Single optimized query: Group by date using raw SQL for better performance
    const dailyStats = await prisma.$queryRaw<Array<{
      date: Date;
      revenue: number;
      orders: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_bgn), 0)::numeric as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= ${dateRangeStart}
        AND created_at <= ${dateRangeEnd}
        AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;
    
    // Create a map for quick lookup
    const statsMap = new Map<string, { revenue: number; orders: number }>();
    dailyStats.forEach(stat => {
      const dateStr = stat.date.toISOString().split('T')[0];
      statsMap.set(dateStr, {
        revenue: Number(stat.revenue),
        orders: Number(stat.orders)
      });
    });
    
    // Fill in all days in range (including days with 0 revenue)
    const last7Days = [];
    const daysDiff = Math.ceil((dateRangeEnd.getTime() - dateRangeStart.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const dayStart = new Date(dateRangeStart);
      dayStart.setDate(dateRangeStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      
      if (dayStart > dateRangeEnd) break;
      
      const dateStr = dayStart.toISOString().split('T')[0];
      const stats = statsMap.get(dateStr) || { revenue: 0, orders: 0 };
      
      last7Days.push({
        date: dateStr,
        revenue: stats.revenue,
        orders: stats.orders
      });
    }
    
    // Hourly distribution for today (peak hours)
    const hourlyOrders = await prisma.$queryRaw<Array<{ hour: number; count: bigint; revenue: number }>>`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count,
        SUM(total_bgn) as revenue
      FROM orders
      WHERE created_at >= ${todayStart}
        AND created_at <= ${todayEnd}
        AND status = 'completed'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;
    
    const hourlyStats = hourlyOrders.map(h => ({
      hour: Number(h.hour),
      orders: Number(h.count),
      revenue: Number(h.revenue)
    }));

    return NextResponse.json({
      success: true,
      today: {
        revenue: Number(todayRevenue._sum.totalBgn || 0),
        revenueEur: Number(todayRevenue._sum.totalEur || 0),
        orders: todayRevenue._count
      },
      week: {
        revenue: Number(weekRevenue._sum.totalBgn || 0),
        revenueEur: Number(weekRevenue._sum.totalEur || 0),
        orders: weekRevenue._count
      },
      month: {
        revenue: Number(monthRevenue._sum.totalBgn || 0),
        revenueEur: Number(monthRevenue._sum.totalEur || 0),
        orders: monthRevenue._count
      },
      last7Days,
      hourlyStats
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get revenue stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch revenue statistics',
      details: error.message 
    }, { status: 500 });
  }
}

