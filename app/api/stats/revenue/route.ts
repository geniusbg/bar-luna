import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const now = new Date();
    
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
    
    // Today's revenue
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        },
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
    
    // Daily revenue for the last 7 days (for chart)
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayRevenue = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          },
          status: 'completed'
        },
        _sum: {
          totalBgn: true
        },
        _count: true
      });
      
      const dateStr = dayStart.toISOString().split('T')[0];
      const revenue = Number(dayRevenue._sum.totalBgn || 0);
      const orders = dayRevenue._count;
      
      last7Days.push({
        date: dateStr,
        revenue: revenue,
        orders: orders
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

