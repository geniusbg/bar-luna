import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('📞 Waiter call API called');
    const body = await request.json();
    console.log('Body:', body);
    
    const { tableNumber, callType, message } = body;

    if (!tableNumber || !callType) {
      console.log('❌ Invalid data');
      return NextResponse.json({ error: 'Invalid call data' }, { status: 400 });
    }

    console.log('💾 Creating waiter call in DB...');
    // Create waiter call
    const waiterCall = await prisma.waiterCall.create({
      data: {
        tableNumber: parseInt(tableNumber),
        callType,
        message: message || null,
        status: 'pending'
      }
    });
    console.log('✅ Waiter call created:', waiterCall.id);

    // Send real-time notification to staff (optional)
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      await pusherServer.trigger('staff-channel', 'waiter-call', {
        callId: waiterCall.id,
        tableNumber: waiterCall.tableNumber,
        callType: waiterCall.callType,
        message: waiterCall.message,
        timestamp: waiterCall.createdAt.toISOString(),
        urgent: callType.includes('payment')
      });
    } catch (pusherError) {
      console.log('Pusher notification skipped:', pusherError);
      // Continue without pusher - polling will pick it up
    }

    // Send Web Push notification
    try {
      const icon = callType.includes('payment') ? '💰' : '🆘';
      const typeText = callType === 'payment_cash' ? 'Плащане с брой' :
                      callType === 'payment_card' ? 'Плащане с карта' : 
                      'Нужна помощ';
      
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${icon} Повикване от Маса ${tableNumber}`,
          body: typeText,
          url: '/bg/staff'
        })
      });
      console.log('✅ Web push sent for waiter call');
    } catch (pushError) {
      console.error('Web push failed:', pushError);
    }

    return NextResponse.json({ 
      success: true, 
      call: waiterCall
    }, { status: 201 });

  } catch (error: any) {
    console.error('Waiter call error:', error);
    return NextResponse.json({ 
      error: 'Failed to call waiter',
      details: error.message 
    }, { status: 500 });
  }
}

// Get all waiter calls for today
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calls = await prisma.waiterCall.findMany({
      where: {
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('Get calls error:', error);
    return NextResponse.json({ error: 'Failed to get calls' }, { status: 500 });
  }
}


