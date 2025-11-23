import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        error: 'Невалиден списък с поръчки' 
      }, { status: 400 });
    }

    // Delete all orders and their items (cascade will handle items)
    const result = await prisma.order.deleteMany({
      where: {
        id: { in: orderIds }
      }
    });

    return NextResponse.json({ 
      success: true,
      deletedCount: result.count,
      message: `Успешно изтрити ${result.count} поръчки`
    }, { status: 200 });
  } catch (error: any) {
    console.error('Bulk delete orders error:', error);
    return NextResponse.json({ 
      error: 'Грешка при масово изтриване на поръчките',
      details: error.message 
    }, { status: 500 });
  }
}

