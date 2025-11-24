import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webpush } from '@/lib/web-push';

export async function POST(request: Request) {
  try {
    const { title, body, url, staffId, role } = await request.json();

    // Build where clause
    const whereClause: any = {
      isActive: true
    };

    // Filter by staffId if provided
    if (staffId) {
      whereClause.staffId = staffId;
    }

    // Get active subscriptions with user relation
    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
      include: {
        user: true // Include user to filter by role
      }
    });

    // Filter by role if provided (ADMIN, STAFF, SUPER_ADMIN)
    let filteredSubscriptions = subscriptions;
    if (role && !staffId) {
      filteredSubscriptions = subscriptions.filter(sub => {
        if (!sub.user) return false;
        // Check if user role matches
        if (role === 'ADMIN') {
          return sub.user.role === 'ADMIN' || sub.user.role === 'SUPER_ADMIN';
        } else if (role === 'STAFF') {
          // Staff should also receive admin notifications
          return sub.user.role === 'STAFF' || sub.user.role === 'ADMIN' || sub.user.role === 'SUPER_ADMIN';
        } else if (role === 'SUPER_ADMIN') {
          return sub.user.role === 'SUPER_ADMIN';
        }
        return sub.user.role === role;
      });
    }

    if (filteredSubscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active subscriptions',
        sent: 0 
      });
    }

    console.log(`📤 Sending push to ${filteredSubscriptions.length} devices...`);

    // Send push notifications
    const results = await Promise.allSettled(
      filteredSubscriptions.map(async (sub) => {
        try {
          // Reconstruct subscription object for web-push
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          const payload = {
            title,
            body,
            icon: '/luna-icon-192.png',
            badge: '/luna-icon-192.png',
            url: url || '/bg/staff',
            tag: 'luna-notification',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            timestamp: Date.now()
          };

          console.log('📦 Sending payload:', JSON.stringify(payload));
          console.log('📍 To endpoint:', sub.endpoint.substring(0, 50) + '...');

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );

          // Update last used
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsed: new Date() }
          });

          return { success: true, subscriptionId: sub.id };

        } catch (error: any) {
          console.error(`❌ Failed to send to subscription ${sub.id}:`, error.message);

          // Mark as inactive if subscription expired (410, 404)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false }
            });
          }

          return { success: false, subscriptionId: sub.id, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - successful;

    console.log(`✅ Push sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({ 
      success: true,
      sent: successful,
      failed: failed,
      total: filteredSubscriptions.length
    });

  } catch (error) {
    console.error('Send push error:', error);
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
  }
}

