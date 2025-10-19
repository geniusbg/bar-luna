import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bgnToEur } from '@/lib/currency';

export async function POST(request: Request) {
  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid updates array' }, { status: 400 });
    }

    const results = [];
    let successCount = 0;

    for (const update of updates) {
      const { id, price_bgn, is_available } = update;

      if (!id) continue;

      const updateData: any = {};
      
      if (price_bgn !== undefined) {
        updateData.priceBgn = price_bgn;
        updateData.priceEur = bgnToEur(price_bgn);
      }
      
      if (is_available !== undefined) {
        updateData.isAvailable = is_available;
      }

      try {
        const product = await prisma.product.update({
          where: { id },
          data: updateData
        });
        results.push(product);
        successCount++;
      } catch (err) {
        console.error(`Failed to update product ${id}:`, err);
      }
    }

    return NextResponse.json({
      updated: successCount,
      total: updates.length,
      products: results
    }, { status: 200 });

  } catch (error) {
    console.error('Batch update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


