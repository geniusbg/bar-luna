import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const call = await prisma.waiterCall.update({
      where: { id },
      data: {
        status: 'acknowledged',
        acknowledgedAt: new Date()
      }
    });

    // Notify all staff devices of status change
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      await pusherServer.trigger('staff-channel', 'call-status-change', {
        callId: call.id,
        tableNumber: call.tableNumber,
        status: call.status
      });
    } catch (pusherError) {
      console.log('Pusher notification skipped:', pusherError);
    }

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Acknowledge call error:', error);
    return NextResponse.json({ error: 'Failed to acknowledge call' }, { status: 500 });
  }
}


