import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    
    // Find approval record
    const approval = await prisma.pendingOrderApproval.findUnique({
      where: { orderId: id },
      include: { order: true }
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json({ error: 'Approval already processed' }, { status: 400 });
    }

    // Update approval status
    await prisma.pendingOrderApproval.update({
      where: { id: approval.id },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: user.id
      }
    });

    // Update order status to 'pending' (activate order)
    await prisma.order.update({
      where: { id: id },
      data: { status: 'pending' }
    });

    // Send Pusher notification to staff
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      await pusherServer.trigger('staff-channel', 'new-order', {
        id: approval.order.id,
        orderNumber: approval.order.orderNumber,
        tableNumber: approval.order.tableNumber,
        status: 'pending',
        totalBgn: Number(approval.order.totalBgn),
        totalEur: Number(approval.order.totalEur),
        createdAt: approval.order.createdAt.toISOString()
      });
    } catch (pusherError) {
      console.log('Pusher notification skipped:', pusherError);
    }

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (error) {
    console.error('Approve order error:', error);
    return NextResponse.json({ error: 'Failed to approve order' }, { status: 500 });
  }
}

