import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUniqueCategorySlug } from '@/lib/slug';
import { getDefaultBrandId } from '@/lib/brand';
import { assertCategoryDepthWithinLimit, type CategoryNode } from '@/lib/category-depth';

// Get all categories with hierarchy
export async function GET() {
  try {
    const brandId = await getDefaultBrandId();
    const categories = await prisma.category.findMany({
      where: { brandId },
      include: {
        parentCategory: {
          select: {
            id: true,
            nameBg: true,
            nameEn: true,
            nameRo: true,
            slug: true
          }
        },
        subCategories: {
          select: {
            id: true,
            nameBg: true,
            nameEn: true,
            nameRo: true,
            slug: true,
            order: true,
            parentCategoryId: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: [
        { parentCategoryId: 'asc' }, // Parent categories first
        { order: 'asc' }
      ]
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 });
  }
}

// Create new category
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const brandId = await getDefaultBrandId();

    // Validate parent category if provided
    if (data.parent_category_id) {
      const parentExists = await prisma.category.findFirst({
        where: { id: data.parent_category_id, brandId },
      });
      if (!parentExists) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
    }

    const allFlat = await prisma.category.findMany({
      where: { brandId },
      select: { id: true, parentCategoryId: true },
    });
    const proposed: CategoryNode[] = [
      ...allFlat.map((c) => ({ id: c.id, parentCategoryId: c.parentCategoryId })),
      { id: '__virtual_new__', parentCategoryId: data.parent_category_id || null },
    ];
    const depthCheck = assertCategoryDepthWithinLimit(proposed);
    if (!depthCheck.ok) {
      return NextResponse.json({ error: depthCheck.message }, { status: 400 });
    }

    const slugSource = (data.name_bg ?? data.slug ?? '').toString().trim();
    const slug = await ensureUniqueCategorySlug(slugSource, brandId);

    const category = await prisma.category.create({
      data: {
        brandId,
        nameBg: data.name_bg,
        nameEn: data.name_en,
        nameRo: data.name_ro,
        slug,
        order: data.order || 0,
        parentCategoryId: data.parent_category_id || null,
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

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
