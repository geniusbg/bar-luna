import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if table exists, if not return not_found gracefully
    try {
      const approval = await prisma.pendingOrderApproval.findUnique({
        where: { orderId: id },
        select: {
          status: true,
          orderId: true,
          tableNumber: true,
          order: {
            select: {
              orderNumber: true,
              cancellationReason: true,
              items: {
                select: {
                  productName: true,
                  quantity: true
                }
              }
            }
          }
        }
      });

      if (!approval) {
        return NextResponse.json({ status: 'not_found' }, { status: 404 });
      }

      return NextResponse.json({ 
        status: approval.status,
        orderId: approval.orderId,
        orderNumber: approval.order?.orderNumber ?? null,
        tableNumber: approval.tableNumber,
        reason: approval.order?.cancellationReason || null,
        items: approval.order?.items?.map(item => ({
          productName: item.productName,
          quantity: item.quantity
        })) || []
      });
    } catch (dbError: any) {
      // If table doesn't exist (P2021), return not_found
      if (dbError.code === 'P2021') {
        console.log('PendingOrderApproval table does not exist yet');
        return NextResponse.json({ status: 'not_found' }, { status: 404 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Get approval status error:', error);
    return NextResponse.json({ error: 'Failed to get approval status' }, { status: 500 });
  }
}

