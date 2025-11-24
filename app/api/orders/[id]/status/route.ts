import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, cancellationReason } = await request.json();

    const updateData: any = {
      status,
      completedAt: status === 'completed' ? new Date() : null
    };

    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    } else if (status !== 'cancelled') {
      updateData.cancellationReason = null;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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

    // Notify client (table-specific channel) of status change
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      const tableChannel = `table-${order.tableNumber}`;
      
      // Format items for notification (all items)
      const itemsSummary = order.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        priceBgn: Number(item.priceBgn)
      }));
      
      await pusherServer.trigger(tableChannel, 'order-status-update', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        cancellationReason: order.cancellationReason || null,
        items: itemsSummary,
        itemsCount: order.items.length,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Status update sent to table ${order.tableNumber} channel`);
    } catch (pusherError) {
      console.log('Pusher client notification skipped:', pusherError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}


