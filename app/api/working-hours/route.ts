import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch working hours (public)
export async function GET() {
  try {
    const workingHours = await prisma.workingHours.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });

    // If no working hours exist, return default structure
    if (workingHours.length === 0) {
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isOpen: true,
        openTime: '10:00',
        closeTime: '00:00'
      }));
      return NextResponse.json({ workingHours: defaultHours });
    }

    // Ensure we have all 7 days
    const daysMap = new Map(workingHours.map(wh => [wh.dayOfWeek, wh]));
    const allDays = Array.from({ length: 7 }, (_, i) => {
      const existing = daysMap.get(i);
      return existing || {
        dayOfWeek: i,
        isOpen: true,
        openTime: '10:00',
        closeTime: '00:00'
      };
    });

    return NextResponse.json({ workingHours: allDays });
  } catch (error) {
    console.error('Get working hours error:', error);
    return NextResponse.json({ error: 'Failed to get working hours' }, { status: 500 });
  }
}

// PUT - Update working hours (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to check role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { workingHours } = await request.json();

    if (!Array.isArray(workingHours) || workingHours.length !== 7) {
      return NextResponse.json({ error: 'Invalid working hours data' }, { status: 400 });
    }

    // Validate each day
    for (const day of workingHours) {
      if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        return NextResponse.json({ error: 'Invalid day of week' }, { status: 400 });
      }
      if (day.isOpen && (!day.openTime || !day.closeTime)) {
        return NextResponse.json({ error: 'Open time and close time required when open' }, { status: 400 });
      }
    }

    // Update or create working hours for each day
    const results = await Promise.all(
      workingHours.map(day =>
        prisma.workingHours.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: {
            isOpen: day.isOpen,
            openTime: day.isOpen ? day.openTime : null,
            closeTime: day.isOpen ? day.closeTime : null
          },
          create: {
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen,
            openTime: day.isOpen ? day.openTime : null,
            closeTime: day.isOpen ? day.closeTime : null
          }
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      workingHours: results,
      message: 'Работното време е обновено успешно'
    });
  } catch (error) {
    console.error('Update working hours error:', error);
    return NextResponse.json({ error: 'Failed to update working hours' }, { status: 500 });
  }
}

