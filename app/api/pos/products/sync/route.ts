import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Fetch all products with category info
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: [
        { categoryId: 'asc' },
        { order: 'asc' }
      ]
    });

    // Format for POS system
    const posProducts = products.map((product: any) => ({
      id: product.id,
      sku: `${product.category.slug.toUpperCase()}-${product.id.substring(0, 8)}`,
      name: product.nameBg,
      name_en: product.nameEn,
      category: product.category.nameBg,
      category_slug: product.category.slug,
      price_bgn: parseFloat(product.priceBgn),
      price_eur: parseFloat(product.priceEur),
      available: product.isAvailable,
      featured: product.isFeatured,
      image_url: product.imageUrl,
      last_updated: product.updatedAt
    }));

    return NextResponse.json({
      products: posProducts,
      sync_time: new Date().toISOString(),
      total_count: posProducts.length,
      available_count: posProducts.filter(p => p.available).length
    }, { status: 200 });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


