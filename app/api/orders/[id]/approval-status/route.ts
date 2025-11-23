import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const approval = await prisma.pendingOrderApproval.findUnique({
      where: { orderId: id },
      select: { status: true }
    });

    if (!approval) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ status: approval.status });
  } catch (error) {
    console.error('Get approval status error:', error);
    return NextResponse.json({ error: 'Failed to get approval status' }, { status: 500 });
  }
}

