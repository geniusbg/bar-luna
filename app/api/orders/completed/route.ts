import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultBrandId } from '@/lib/brand';

export async function GET() {
  try {
    const brandId = await getDefaultBrandId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        brandId,
        status: 'completed',
        createdAt: { gte: today },
      },
      include: {
        items: true
      },
      orderBy: { completedAt: 'desc' }
    });

    // Convert Decimal to Number for proper JSON serialization
    const ordersWithNumbers = orders.map(order => ({
      ...order,
      totalBgn: Number(order.totalBgn),
      totalEur: Number(order.totalEur),
      items: order.items.map(item => ({
        ...item,
        priceBgn: Number(item.priceBgn),
        priceEur: Number(item.priceEur)
      }))
    }));

    return NextResponse.json({ orders: ordersWithNumbers });
  } catch (error) {
    console.error('Get completed orders error:', error);
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}


