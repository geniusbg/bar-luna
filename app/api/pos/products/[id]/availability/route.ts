import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { is_available } = await request.json();
    const { id } = await params;

    if (typeof is_available !== 'boolean') {
      return NextResponse.json({ error: 'is_available must be boolean' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        isAvailable: is_available
      }
    });

    // In a real system, you might want to trigger a webhook here
    // to notify other systems of the availability change

    return NextResponse.json({
      product,
      message: `Product availability updated to ${is_available ? 'available' : 'unavailable'}`
    }, { status: 200 });

  } catch (error) {
    console.error('Availability update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

