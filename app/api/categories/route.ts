import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all categories with hierarchy
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parentCategory: {
          select: {
            id: true,
            nameBg: true,
            nameEn: true,
            nameDe: true,
            slug: true
          }
        },
        subCategories: {
          select: {
            id: true,
            nameBg: true,
            nameEn: true,
            nameDe: true,
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

    // Validate parent category if provided
    if (data.parent_category_id) {
      const parentExists = await prisma.category.findUnique({
        where: { id: data.parent_category_id }
      });
      if (!parentExists) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
    }

    const category = await prisma.category.create({
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

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
