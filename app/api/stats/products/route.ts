import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, all
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    const now = new Date();
    let dateFilter: any = {};
    
    // Custom date range takes priority
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter = { gte: startDate, lte: endDate };
    } else if (period === 'today') {
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
    
    // Top products by quantity sold
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          status: 'completed',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      },
      _sum: {
        quantity: true,
        priceBgn: true
      },
      _count: true,
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });
    
    // Get product details
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            nameBg: true,
            nameEn: true,
            nameDe: true,
            imageUrl: true,
            priceBgn: true,
            category: {
              select: {
                nameBg: true
              }
            }
          }
        });
        
        return {
          productId: item.productId,
          productName: item.productName,
          quantitySold: Number(item._sum.quantity || 0),
          revenue: Number(item._sum.priceBgn || 0),
          ordersCount: item._count,
          currentPrice: product ? Number(product.priceBgn) : 0,
          imageUrl: product?.imageUrl || null,
          category: product?.category?.nameBg || 'Unknown'
        };
      })
    );
    
    // Category performance - using Prisma ORM approach
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        nameBg: true,
        products: {
          select: {
            orderItems: {
              where: {
                order: {
                  status: 'completed',
                  ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                }
              },
              select: {
                quantity: true,
                priceBgn: true,
                orderId: true
              }
            }
          }
        }
      }
    });
    
    const categoryPerformance = categories
      .map(category => {
        const allItems = category.products.flatMap(p => p.orderItems);
        const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = allItems.reduce((sum, item) => sum + (Number(item.priceBgn) * item.quantity), 0);
        const uniqueOrders = new Set(allItems.map(item => item.orderId)).size;
        
        return {
          categoryId: category.id,
          categoryName: category.nameBg,
          quantitySold: totalQuantity,
          revenue: totalRevenue,
          ordersCount: uniqueOrders
        };
      })
      .filter(cat => cat.quantitySold > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      period,
      topProducts: productsWithDetails,
      categoryPerformance
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get products stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products statistics',
      details: error.message 
    }, { status: 500 });
  }
}

