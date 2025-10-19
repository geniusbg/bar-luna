import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Helper functions for common notifications

export async function notifyNewOrder(order: any) {
  await pusherServer.trigger('staff-channel', 'new-order', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    items: order.items,
    totalBgn: order.totalBgn,
    timestamp: new Date().toISOString(),
  });
}

export async function notifyWaiterCall(call: any) {
  await pusherServer.trigger('staff-channel', 'waiter-call', {
    callId: call.id,
    tableNumber: call.tableNumber,
    callType: call.callType,
    message: call.message,
    timestamp: new Date().toISOString(),
  });
}

export async function notifyOrderStatusChange(orderId: string, status: string) {
  await pusherServer.trigger('staff-channel', 'order-status-change', {
    orderId,
    status,
    timestamp: new Date().toISOString(),
  });
}


