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
    const { reason } = await request.json().catch(() => ({}));
    
    // Find approval record
    const approval = await prisma.pendingOrderApproval.findUnique({
      where: { orderId: id }
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
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: user.id
      }
    });

    // Update order status to 'cancelled'
    await prisma.order.update({
      where: { id: id },
      data: { 
        status: 'cancelled',
        cancellationReason: reason || 'Отхвърлена от администратор'
      }
    });

    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (error) {
    console.error('Reject order error:', error);
    return NextResponse.json({ error: 'Failed to reject order' }, { status: 500 });
  }
}

