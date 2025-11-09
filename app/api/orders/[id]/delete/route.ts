import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete order and its items (cascade will handle items)
    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Поръчката е изтрита успешно'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json({ 
      error: 'Грешка при изтриване на поръчката',
      details: error.message 
    }, { status: 500 });
  }
}

