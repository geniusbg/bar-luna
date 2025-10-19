import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bgnToEur } from '@/lib/currency';

export async function POST(request: Request) {
  try {
    const { tableNumber, items } = await request.json();

    if (!tableNumber || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    // Get today's order count for sequential numbering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrderCount = await prisma.order.count({
      where: {
        createdAt: { gte: today }
      }
    });

    const orderNumber = todayOrderCount + 1;

    // Calculate total
    const totalBgn = items.reduce((sum: number, item: any) => 
      sum + (item.priceBgn * item.quantity), 0
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        tableNumber,
        orderNumber,
        status: 'pending',
        totalBgn,
        totalEur: bgnToEur(totalBgn),
        isPaid: false
      }
    });

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName || item.name, // Support both formats
          quantity: item.quantity,
          priceBgn: item.priceBgn,
          priceEur: bgnToEur(item.priceBgn),
        }
      });
    }

    // Get full order with items for notification
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    });

    // Send real-time notification to staff (optional)
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      
      // Convert Decimal to Number for proper JSON serialization
      const orderData = {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        totalBgn: Number(order.totalBgn),
        totalEur: Number(order.totalEur),
        createdAt: order.createdAt.toISOString(),
        items: fullOrder?.items.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          priceBgn: Number(item.priceBgn),
          priceEur: Number(item.priceEur),
        })) || []
      };
      
      await pusherServer.trigger('staff-channel', 'new-order', orderData);
    } catch (pusherError) {
      console.log('Pusher notification skipped:', pusherError);
      // Order still created, just no real-time notification
    }

    // Send Web Push notification (works even when app closed!)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🔔 Нова поръчка #${order.orderNumber}`,
          body: `Маса ${tableNumber} - ${items.length} артикула - ${Number(totalBgn).toFixed(2)} лв.`,
          url: '/bg/staff'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Web push sent to ${result.sent} devices`);
      }
    } catch (pushError) {
      console.error('Web push failed:', pushError);
      // Continue even if push fails
    }

    return NextResponse.json({ 
      success: true, 
      order: fullOrder,
      orderNumber: order.orderNumber
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error.message 
    }, { status: 500 });
  }
}


