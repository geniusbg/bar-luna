import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Map snake_case to camelCase for Prisma
    const product = await prisma.product.create({
      data: {
        categoryId: data.category_id,
        nameBg: data.name_bg,
        nameEn: data.name_en,
        nameDe: data.name_de,
        descriptionBg: data.description_bg || null,
        descriptionEn: data.description_en || null,
        descriptionDe: data.description_de || null,
        priceBgn: data.price_bgn,
        priceEur: data.price_eur,
        imageUrl: data.image_url || null,
        isAvailable: data.is_available !== undefined ? data.is_available : true,
        isHidden: data.is_hidden !== undefined ? data.is_hidden : false,
        isFeatured: data.is_featured !== undefined ? data.is_featured : false,
        order: data.order || 0,
        allergens: data.allergens || []
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


