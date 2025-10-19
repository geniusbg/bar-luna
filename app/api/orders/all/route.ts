import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get today's orders (both active and completed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: today }
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
    console.error('Get all orders error:', error);
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}

