import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';
import { getSecuritySettings } from '@/lib/security-settings';

/**
 * Auto-reject pending order approvals that are older than 30 minutes
 * This endpoint can be called periodically (e.g., from a cron job or on admin page load)
 */
export async function POST() {
  try {
    const securitySettings = await getSecuritySettings();
    const autoRejectMinutes = securitySettings.autoRejectMinutes || 30;
    const cutoffDate = new Date(Date.now() - autoRejectMinutes * 60 * 1000);

    // Find all pending approvals older than configured window
    const expiredApprovals = await prisma.pendingOrderApproval.findMany({
      where: {
        status: 'pending',
        requestedAt: {
          lte: cutoffDate
        }
      },
      include: {
        order: {
          include: { items: true }
        }
      }
    });

    if (expiredApprovals.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired approvals found',
        rejectedCount: 0
      });
    }

    // Auto-reject each expired approval
    const rejectedOrderIds: string[] = [];
    
    for (const approval of expiredApprovals) {
      try {
        // Update approval status to 'rejected'
        await prisma.pendingOrderApproval.update({
          where: { id: approval.id },
          data: {
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: null // Auto-rejected, no admin user
          }
        });

        // Update order status to 'cancelled'
        await prisma.order.update({
          where: { id: approval.orderId },
          data: {
            status: 'cancelled',
            cancellationReason: `Автоматично отхвърлена след ${autoRejectMinutes} минути без одобрение`
          }
        });

        rejectedOrderIds.push(approval.orderId);

        const itemsPayload = approval.order?.items?.map(item => ({
          productName: item.productName,
          quantity: item.quantity
        })) || [];

        // Notify table about auto-rejection via Pusher
        try {
          await pusherServer.trigger(`table-${approval.tableNumber}`, 'order-approval-status', {
            orderId: approval.orderId,
            orderNumber: approval.order?.orderNumber ?? null,
            status: 'auto-rejected',
            reason: `Автоматично отхвърлена след ${autoRejectMinutes} минути без одобрение`,
            items: itemsPayload
          });
        } catch (pusherError) {
          console.log('Pusher auto-reject notification skipped for order', approval.orderId, pusherError);
        }
      } catch (error) {
        console.error(`Error auto-rejecting approval ${approval.id}:`, error);
        // Continue with next approval even if one fails
      }
    }

    // Notify admin dashboard about auto-rejections
    try {
      await pusherServer.trigger('admin-channel', 'auto-rejections', {
        count: rejectedOrderIds.length,
        orderIds: rejectedOrderIds,
        timestamp: new Date().toISOString()
      });
    } catch (pusherError) {
      console.log('Pusher admin notification skipped:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: `Auto-rejected ${rejectedOrderIds.length} expired approval(s)`,
      rejectedCount: rejectedOrderIds.length,
      rejectedOrderIds
    });

  } catch (error) {
    console.error('Auto-reject error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-reject expired approvals' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check for expired approvals (without rejecting them)
 * Useful for displaying count of expired approvals in admin UI
 */
export async function GET() {
  try {
    const securitySettings = await getSecuritySettings();
    const autoRejectMinutes = securitySettings.autoRejectMinutes || 30;
    const cutoffDate = new Date(Date.now() - autoRejectMinutes * 60 * 1000);

    const expiredCount = await prisma.pendingOrderApproval.count({
      where: {
        status: 'pending',
        requestedAt: {
          lte: cutoffDate
        }
      }
    });

    return NextResponse.json({
      expiredCount,
      thresholdMinutes: autoRejectMinutes
    });
  } catch (error) {
    console.error('Error checking expired approvals:', error);
    return NextResponse.json(
      { error: 'Failed to check expired approvals' },
      { status: 500 }
    );
  }
}

