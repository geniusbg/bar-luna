import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        orderBy: { order: 'asc' }
      }),
      prisma.product.findMany({
        where: { isHidden: false }, // Show all non-hidden products (available and unavailable)
        orderBy: { order: 'asc' }
      })
    ]);

    return NextResponse.json({ categories, products });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}


