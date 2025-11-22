import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get QR code settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only ADMIN and SUPER_ADMIN can access QR settings
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the latest settings (there should only be one record)
    const settingsRecord = await prisma.qRCodeSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (settingsRecord) {
      return NextResponse.json({ 
        success: true, 
        settings: settingsRecord.settings 
      });
    }

    // Return default settings if none exist
    return NextResponse.json({ 
      success: true, 
      settings: null 
    });
  } catch (error) {
    console.error('Error fetching QR code settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Save QR code settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }
    
    if (!session.user) {
      console.log('❌ No user in session');
      return NextResponse.json({ error: 'Unauthorized - No user' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only ADMIN and SUPER_ADMIN can access QR settings
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    // Get existing settings
    const existing = await prisma.qRCodeSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (existing) {
      // Update existing settings
      await prisma.qRCodeSettings.update({
        where: { id: existing.id },
        data: { settings }
      });
    } else {
      // Create new settings record
      await prisma.qRCodeSettings.create({
        data: { settings }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving QR code settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

