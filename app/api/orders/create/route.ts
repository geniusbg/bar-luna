import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bgnToEur } from '@/lib/currency';

// In-memory rate limiting storage (per table)
const orderRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxOrders: number = 2, windowMs: number = 5 * 60 * 1000): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = orderRateLimits.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    orderRateLimits.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxOrders - 1, resetTime };
  }

  if (record.count >= maxOrders) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  orderRateLimits.set(key, record);
  return { allowed: true, remaining: maxOrders - record.count, resetTime: record.resetTime };
}

// Helper function to validate session token
function validateSessionToken(token: string | undefined, tableNumber: number): { valid: boolean; error?: string } {
  if (!token) {
    return { valid: false, error: 'Сесията е изтекла. Моля, сканирайте QR кода отново.' };
  }

  try {
    const parts = token.split('_');
    if (parts.length !== 5 || parts[0] !== 'table' || parts[1] !== 'session') {
      return { valid: false, error: 'Невалидна сесия. Моля, сканирайте QR кода отново.' };
    }

    const tokenTableNumber = parseInt(parts[2]);
    const createdAt = parseInt(parts[3]);
    const expiresAt = parseInt(parts[4]);

    // Check table number matches
    if (tokenTableNumber !== tableNumber) {
      return { valid: false, error: 'Сесията не съответства на масата. Моля, сканирайте QR кода отново.' };
    }

    // Check if token is expired
    const now = Date.now();
    if (now > expiresAt) {
      return { valid: false, error: 'Сесията е изтекла. Моля, сканирайте QR кода отново.' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Невалидна сесия. Моля, сканирайте QR кода отново.' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tableNumber, items, sessionToken } = await request.json();
    
    if (!tableNumber || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    // Validate session token
    const sessionValidation = validateSessionToken(sessionToken, tableNumber);
    if (!sessionValidation.valid) {
      return NextResponse.json({ 
        error: sessionValidation.error || 'Сесията е изтекла. Моля, сканирайте QR кода отново.'
      }, { status: 401 });
    }
    
    // Rate limiting: Check only by table number (not by IP to avoid blocking legitimate customers)
    const tableKey = `table:${tableNumber}`;
    
    // Check table-based rate limit (5 orders per 5 minutes per table)
    const tableLimit = checkRateLimit(tableKey, 5, 5 * 60 * 1000);
    
    // Count orders in last 5 minutes for approval check
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrderCount = await prisma.order.count({
      where: {
        tableNumber,
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    // If >5 orders in last 5 minutes, require approval (but still allow order creation)
    const requiresApproval = recentOrderCount >= 5;
    
    // If rate limit exceeded (but not approval threshold), return error
    if (!tableLimit.allowed && !requiresApproval) {
      const resetMinutes = Math.ceil((tableLimit.resetTime - Date.now()) / 60000);
      return NextResponse.json({ 
        error: 'Твърде много поръчки от тази маса. Моля, изчакайте преди да направите нова поръчка.',
        details: `Можете да направите нова поръчка след ${resetMinutes} минути.`
      }, { status: 429 });
    }

    // Get today's order count for sequential numbering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrderCount = await prisma.order.count({
      where: {
        createdAt: { gte: today }
      }
    });

    const orderNumber = todayOrderCount + 1;

    // Calculate total
    const totalBgn = items.reduce((sum: number, item: any) => 
      sum + (item.priceBgn * item.quantity), 0
    );

    // Create order (status will be 'pending_approval' if requires approval, otherwise 'pending')
    const orderStatus = requiresApproval ? 'pending_approval' : 'pending';
    const order = await prisma.order.create({
      data: {
        tableNumber,
        orderNumber,
        status: orderStatus,
        totalBgn,
        totalEur: bgnToEur(totalBgn),
        isPaid: false
      }
    });

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName || item.name, // Support both formats
          quantity: item.quantity,
          priceBgn: item.priceBgn,
          priceEur: bgnToEur(item.priceBgn),
        }
      });
    }

    // Create PendingOrderApproval if required
    if (requiresApproval) {
      await prisma.pendingOrderApproval.create({
        data: {
          orderId: order.id,
          tableNumber,
          orderCount: recentOrderCount + 1, // Include current order
          reason: 'rate_limit_exceeded',
          status: 'pending'
        }
      });

      // Send push notification to admins
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '⚠️ Поръчка изисква одобрение',
            body: `Маса ${tableNumber} - ${recentOrderCount + 1} поръчки за 5 минути`,
            url: `/bg/admin/orders?approval=${order.id}`
          })
        });
        
        if (response.ok) {
          console.log('✅ Approval push notification sent');
        }
      } catch (pushError) {
        console.error('Web push failed:', pushError);
      }

      // Send Pusher notification to admin dashboard
      try {
        const { pusherServer } = await import('@/lib/pusher-server');
        await pusherServer.trigger('admin-channel', 'order-approval-needed', {
          orderId: order.id,
          tableNumber,
          orderCount: recentOrderCount + 1,
          timestamp: new Date().toISOString()
        });
      } catch (pusherError) {
        console.log('Pusher notification skipped:', pusherError);
      }
    }

    // Get full order with items for notification
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    });

    // Send real-time notification to staff (optional)
    try {
      const { pusherServer } = await import('@/lib/pusher-server');
      
      // Convert Decimal to Number for proper JSON serialization
      const orderData = {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        totalBgn: Number(order.totalBgn),
        totalEur: Number(order.totalEur),
        createdAt: order.createdAt.toISOString(),
        items: fullOrder?.items.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          priceBgn: Number(item.priceBgn),
          priceEur: Number(item.priceEur),
        })) || []
      };
      
      await pusherServer.trigger('staff-channel', 'new-order', orderData);
    } catch (pusherError) {
      console.log('Pusher notification skipped:', pusherError);
      // Order still created, just no real-time notification
    }

    // Send Web Push notification (works even when app closed!)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🔔 Нова поръчка #${order.orderNumber}`,
          body: `Маса ${tableNumber} - ${items.length} артикула - ${Number(totalBgn).toFixed(2)} лв.`,
          url: '/bg/staff'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Web push sent to ${result.sent} devices`);
      }
    } catch (pushError) {
      console.error('Web push failed:', pushError);
      // Continue even if push fails
    }

    return NextResponse.json({ 
      success: true, 
      order: fullOrder,
      orderNumber: order.orderNumber,
      requiresApproval: requiresApproval || false,
      orderId: order.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error.message 
    }, { status: 500 });
  }
}


