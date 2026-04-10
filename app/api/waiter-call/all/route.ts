import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultBrandId } from '@/lib/brand';

export async function GET() {
  try {
    const brandId = await getDefaultBrandId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calls = await prisma.waiterCall.findMany({
      where: {
        brandId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('Get all calls error:', error);
    return NextResponse.json({ error: 'Failed to get calls' }, { status: 500 });
  }
}

