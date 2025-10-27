import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const { id } = await params;

    // Map snake_case to camelCase for Prisma
    const product = await prisma.product.update({
      where: { id },
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

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Instead of deleting, hide the product (soft delete)
    // This preserves order history while removing it from the menu
    
    const product = await prisma.product.update({
      where: { id },
      data: {
        isHidden: true,
        isAvailable: false
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Продуктът е скрит успешно. Историята на поръчките е запазена.'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Грешка при скриване' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

