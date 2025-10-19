import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['pending', 'preparing', 'ready'] }
      },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
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
    console.error('Get active orders error:', error);
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}


