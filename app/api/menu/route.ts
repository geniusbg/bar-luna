import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultBrandId } from '@/lib/brand';
import { applyPromotionsToProductRow, indexActivePromotionsByProductId } from '@/lib/pricing';

export async function GET() {
  try {
    const brandId = await getDefaultBrandId();
    const now = new Date();

    const [categories, products, promotions] = await Promise.all([
      prisma.category.findMany({
        where: { brandId },
        orderBy: { order: 'asc' },
      }),
      prisma.product.findMany({
        where: {
          isHidden: false,
          category: { brandId },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.productPromotion.findMany({
        where: {
          brandId,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      }),
    ]);

    const promoByProduct = indexActivePromotionsByProductId(promotions, now);

    const productsOut = products.map((p) => {
      const enriched = applyPromotionsToProductRow(p, promoByProduct.get(p.id));
      return {
        ...enriched,
        priceBgn: enriched.priceBgn,
        priceEur: enriched.priceEur,
      };
    });

    return NextResponse.json({ categories, products: productsOut });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}


