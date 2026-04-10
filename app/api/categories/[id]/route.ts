import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUniqueCategorySlug } from '@/lib/slug';
import { assertCategoryDepthWithinLimit, isDescendantOf, type CategoryNode } from '@/lib/category-depth';

// Update category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const { id } = await params;

    const current = await prisma.category.findUnique({
      where: { id },
      select: { brandId: true },
    });
    if (!current) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Prevent circular reference - category cannot be its own parent
    if (data.parent_category_id === id) {
      return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
    }

    const allFlat = await prisma.category.findMany({
      where: { brandId: current.brandId },
      select: { id: true, parentCategoryId: true },
    });

    // Validate parent category if provided
    if (data.parent_category_id) {
      const parentExists = await prisma.category.findFirst({
        where: { id: data.parent_category_id, brandId: current.brandId },
      });
      if (!parentExists) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }

      if (isDescendantOf(allFlat, id, data.parent_category_id)) {
        return NextResponse.json(
          { error: 'Родителят не може да е подкатегория на тази категория' },
          { status: 400 }
        );
      }
    }

    if (data.parent_category_id !== undefined) {
      const newParentId = data.parent_category_id || null;
      const proposed: CategoryNode[] = allFlat.map((c) =>
        c.id === id ? { id: c.id, parentCategoryId: newParentId } : { id: c.id, parentCategoryId: c.parentCategoryId }
      );
      const depthCheck = assertCategoryDepthWithinLimit(proposed);
      if (!depthCheck.ok) {
        return NextResponse.json({ error: depthCheck.message }, { status: 400 });
      }
    }

    const slugSource = (data.name_bg ?? data.slug ?? '').toString().trim();
    const slug = await ensureUniqueCategorySlug(slugSource, current.brandId, id);

    const category = await prisma.category.update({
      where: { id },
      data: {
        nameBg: data.name_bg,
        nameEn: data.name_en,
        nameRo: data.name_ro,
        slug,
        order: data.order || 0,
        parentCategoryId: data.parent_category_id || null
      },
      include: {
        parentCategory: {
          select: {
            id: true,
            nameBg: true,
            nameEn: true,
            nameRo: true,
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

