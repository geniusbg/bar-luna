import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get today's waiter calls (all statuses)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calls = await prisma.waiterCall.findMany({
      where: {
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('Get all calls error:', error);
    return NextResponse.json({ error: 'Failed to get calls' }, { status: 500 });
  }
}

