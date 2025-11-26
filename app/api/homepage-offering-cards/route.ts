import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all offering cards (public)
export async function GET() {
  try {
    const cards = await prisma.homepageOfferingCard.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Get offering cards error:', error);
    return NextResponse.json({ error: 'Failed to get offering cards' }, { status: 500 });
  }
}

// POST create new card (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const card = await prisma.homepageOfferingCard.create({
      data: {
        order: data.order ?? 0,
        icon: data.icon || '🍸',
        titleBg: data.titleBg || '',
        titleEn: data.titleEn || '',
        titleDe: data.titleDe || '',
        descriptionBg: data.descriptionBg || '',
        descriptionEn: data.descriptionEn || '',
        descriptionDe: data.descriptionDe || '',
        badgeBg: data.badgeBg || '',
        badgeEn: data.badgeEn || '',
        badgeDe: data.badgeDe || '',
        highlights: data.highlights || { bg: [], en: [], de: [] },
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error('Create offering card error:', error);
    return NextResponse.json({ error: 'Failed to create offering card' }, { status: 500 });
  }
}

