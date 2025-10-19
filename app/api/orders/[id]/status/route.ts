import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null
      },
      include: { items: true }
    });

    // Notify all staff devices of status change (optional)
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      await pusherServer.trigger('staff-channel', 'order-status-change', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status
      });
    } catch (pusherError) {
      console.log('Pusher notification skipped:', pusherError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}


