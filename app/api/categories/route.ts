import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
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

    const category = await prisma.category.create({
      data: {
        nameBg: data.name_bg,
        nameEn: data.name_en,
        nameDe: data.name_de,
        slug: data.slug,
        order: data.order || 0
      }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
