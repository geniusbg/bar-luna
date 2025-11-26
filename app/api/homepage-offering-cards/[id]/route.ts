import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT update card (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    const card = await prisma.homepageOfferingCard.update({
      where: { id },
      data: {
        order: data.order,
        icon: data.icon,
        titleBg: data.titleBg,
        titleEn: data.titleEn,
        titleDe: data.titleDe,
        descriptionBg: data.descriptionBg,
        descriptionEn: data.descriptionEn,
        descriptionDe: data.descriptionDe,
        badgeBg: data.badgeBg,
        badgeEn: data.badgeEn,
        badgeDe: data.badgeDe,
        highlights: data.highlights,
        isActive: data.isActive
      }
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Update offering card error:', error);
    return NextResponse.json({ error: 'Failed to update offering card' }, { status: 500 });
  }
}

// DELETE card (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.homepageOfferingCard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete offering card error:', error);
    return NextResponse.json({ error: 'Failed to delete offering card' }, { status: 500 });
  }
}

