import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const { id } = await params;

    const category = await prisma.category.update({
      where: { id },
      data: {
        nameBg: data.name_bg,
        nameEn: data.name_en,
        nameDe: data.name_de,
        slug: data.slug,
        order: data.order || 0
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// Delete category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Не можеш да изтриеш категория с ${productCount} продукта. Първо премахни продуктите.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

