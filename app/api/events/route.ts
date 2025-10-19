import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Convert eventDate to proper ISO format if needed
    if (data.eventDate && typeof data.eventDate === 'string') {
      data.eventDate = new Date(data.eventDate).toISOString();
    }

    const event = await prisma.event.create({
      data: data
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published') === 'true';

    const events = await prisma.event.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { eventDate: 'asc' }
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


