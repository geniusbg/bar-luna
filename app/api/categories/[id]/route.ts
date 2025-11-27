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

    // Prevent circular reference - category cannot be its own parent
    if (data.parent_category_id === id) {
      return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
    }

    // Validate parent category if provided
    if (data.parent_category_id) {
      const parentExists = await prisma.category.findUnique({
        where: { id: data.parent_category_id }
      });
      if (!parentExists) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
      
      // Prevent making a category a child of its own child (circular reference check)
      const isDescendant = await prisma.category.findFirst({
        where: {
          id: data.parent_category_id,
          parentCategoryId: id
        }
      });
      if (isDescendant) {
        return NextResponse.json({ error: 'Cannot create circular reference' }, { status: 400 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        nameBg: data.name_bg,
        nameEn: data.name_en,
        nameDe: data.name_de,
        slug: data.slug,
        order: data.order || 0,
        parentCategoryId: data.parent_category_id || null
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            nameBg: true,
            nameEn: true,
            nameDe: true,
            slug: true
          }
        }
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

    // Check if category has subcategories
    const subCategoryCount = await prisma.category.count({
      where: { parentCategoryId: id }
    });

    if (subCategoryCount > 0) {
      return NextResponse.json(
        { error: `Не можеш да изтриеш категория с ${subCategoryCount} подкатегории. Първо премахни подкатегориите.` },
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

