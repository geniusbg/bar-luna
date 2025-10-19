# Luna Bar - Final Implementation Plan
## QR-Based Ordering System with Hype-Ready Architecture

## 🎯 Финални изисквания

### Core Features
1. ✅ Меню на 3 езика (БГ/EN/DE)
2. ✅ Dual currency (BGN/EUR)
3. ✅ Admin panel за продукти/събития
4. ✅ **QR код на всяка маса**
5. ✅ **Customer ordering през QR**
6. ✅ **Real-time notifications с ЗВУК**
7. ✅ **Staff dashboard**
8. ✅ **Повикване сервитьор (брой/карта)**

### Future (Phase 2)
- 🔄 Hype POS интеграция
- 🔄 Payment gateway (Borica/Stripe)
- 🔄 Kitchen Display System

## 🏗️ Technology Stack

### Core
- **Database:** PostgreSQL (ваш локален/production)
- **ORM:** Prisma (type-safe queries)
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Real-time:** Pusher (препоръчвам) или Socket.IO

### Why Pusher for real-time?
- ✅ Безплатен до 200k messages/day
- ✅ По-лесен от Socket.IO (не трябва custom server)
- ✅ Автоматично reconnect
- ✅ Multi-device support
- ✅ Production-ready

### Image Storage
- **Development:** Local (`public/uploads/`)
- **Production:** Same или Cloudflare R2 (безплатен tier)

## 📱 QR Code System Flow

### 1. QR Code Generation

```typescript
// app/api/tables/generate-qr/route.ts
import QRCode from 'qrcode';

export async function POST(request: Request) {
  const { tableNumber } = await request.json();
  
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/order?table=${tableNumber}`;
  
  // Generate QR code image
  const qrCode = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return Response.json({ qrCode, url });
}
```

### 2. Customer Journey

```
┌──────────────────────────────────────────────┐
│  1. Клиент сканира QR на маса 5              │
│     → https://lunabar.bg/order?table=5       │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  2. Автоматично влиза в маса 5               │
│     → Вижда меню на избрания език            │
│     → Може да добавя продукти в количка      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  3. Изпраща поръчка                          │
│     → Real-time notification към персонал    │
│     → Звуков сигнал на бар компютър          │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  4. Може да повика сервитьор                 │
│     → Избира "Плащане с брой" или "Карта"    │
│     → Notification с приоритет               │
└──────────────────────────────────────────────┘
```

### 3. Printable QR Cards

```typescript
// components/PrintableQRCard.tsx
export function PrintableQRCard({ table, qrCode }) {
  return (
    <div className="w-[10cm] h-[10cm] border-2 border-gray-300 p-4 bg-white">
      {/* Bar logo */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold">𝐋.𝐔.𝐍.𝐀 🌙</h1>
      </div>
      
      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
      </div>
      
      {/* Table number */}
      <div className="text-center">
        <p className="text-4xl font-bold mb-2">МАСА {table.number}</p>
        <p className="text-lg text-gray-600">
          Сканирай за меню и поръчка
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Scan for menu & order
        </p>
      </div>
    </div>
  );
}
```

## 🗄️ Updated Database Schema

```sql
-- Tables (physical)
CREATE TABLE bar_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER UNIQUE NOT NULL,
  table_name TEXT,
  qr_code_url TEXT, -- URL to QR code image
  qr_code_data TEXT, -- Data URL of QR image for printing
  capacity INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT TRUE,
  location TEXT, -- 'indoor', 'terrace', 'bar'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES bar_tables(id),
  table_number INTEGER NOT NULL,
  order_number INTEGER NOT NULL, -- Daily sequential #1, #2, #3
  status TEXT DEFAULT 'pending', -- pending, preparing, ready, completed, cancelled
  items JSONB, -- Quick access to items
  total_bgn DECIMAL(10,2),
  total_eur DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  quantity INTEGER,
  price_bgn DECIMAL(10,2),
  price_eur DECIMAL(10,2),
  notes TEXT
);

-- Waiter calls
CREATE TABLE waiter_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER NOT NULL,
  call_type TEXT NOT NULL, -- 'payment_cash', 'payment_card', 'help'
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Hype integration (future)
CREATE TABLE hype_sync_log (
  id UUID PRIMARY KEY,
  sync_type TEXT, -- 'menu', 'order', 'inventory'
  status TEXT,
  data JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📂 New File Structure

```
luna/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── app/
│   ├── [locale]/
│   │   ├── order/              # CUSTOMER INTERFACE
│   │   │   ├── page.tsx        # QR landing → auto-detect table
│   │   │   ├── menu/
│   │   │   │   └── page.tsx    # Menu with cart
│   │   │   ├── cart/
│   │   │   │   └── page.tsx    # Review & send order
│   │   │   └── call-waiter/
│   │   │       └── page.tsx    # Call waiter (pay/help)
│   │   │
│   │   ├── staff/              # STAFF INTERFACE
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # Overview
│   │   │   ├── orders/
│   │   │   │   └── page.tsx    # Live orders grid
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx    # Waiter calls
│   │   │   └── tables/
│   │   │       ├── page.tsx    # Table overview
│   │   │       └── [id]/
│   │   │           └── qr/page.tsx  # Print QR
│   │   │
│   │   └── admin/              # ADMIN (existing)
│   │       ├── products/
│   │       └── events/
│   │
│   └── api/
│       ├── orders/
│       │   ├── route.ts        # Create order
│       │   └── [id]/
│       │       └── route.ts    # Update status
│       ├── waiter-calls/
│       │   └── route.ts
│       ├── tables/
│       │   ├── generate-qr/
│       │   └── route.ts
│       ├── pusher/
│       │   └── auth/route.ts
│       └── hype/               # FUTURE
│           ├── sync-menu/
│           ├── send-order/
│           └── webhook/
│
├── components/
│   ├── order/
│   │   ├── ProductCard.tsx
│   │   ├── Cart.tsx
│   │   ├── CartBadge.tsx
│   │   └── OrderSummary.tsx
│   ├── staff/
│   │   ├── OrderCard.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── SoundAlert.tsx
│   │   └── TableGrid.tsx
│   └── PrintableQRCard.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── pusher.ts              # Real-time client
│   ├── pusher-server.ts       # Server-side pusher
│   └── hype.ts                # FUTURE: Hype API wrapper
│
└── public/
    ├── uploads/               # Local images
    ├── qr-codes/             # Generated QR codes
    └── sounds/
        ├── new-order.mp3
        └── waiter-call.mp3
```

## 🔔 Real-time Notifications Setup

### Using Pusher (Recommended)

```bash
npm install pusher pusher-js
```

```typescript
// lib/pusher-server.ts
import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

// Trigger new order
export async function notifyNewOrder(order: Order) {
  await pusher.trigger('staff-channel', 'new-order', {
    orderId: order.id,
    tableNumber: order.tableNumber,
    orderNumber: order.orderNumber,
    items: order.items,
    total: order.totalBgn,
    timestamp: new Date()
  });
}

// Trigger waiter call
export async function notifyWaiterCall(call: WaiterCall) {
  await pusher.trigger('staff-channel', 'waiter-call', {
    callId: call.id,
    tableNumber: call.tableNumber,
    callType: call.callType,
    message: call.message,
    timestamp: new Date()
  });
}
```

```typescript
// components/staff/NotificationListener.tsx
'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';

export function NotificationListener() {
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    const channel = pusher.subscribe('staff-channel');

    // New order notification
    channel.bind('new-order', (data: any) => {
      // Play sound
      const audio = new Audio('/sounds/new-order.mp3');
      audio.play();

      // Show notification
      showNotification({
        title: `Нова поръчка #${data.orderNumber}`,
        body: `Маса ${data.tableNumber}`,
        type: 'order'
      });

      // Refresh orders list
      window.dispatchEvent(new Event('refresh-orders'));
    });

    // Waiter call notification
    channel.bind('waiter-call', (data: any) => {
      const audio = new Audio('/sounds/waiter-call.mp3');
      audio.volume = 1.0;
      audio.play();

      showNotification({
        title: `Повикване от маса ${data.tableNumber}`,
        body: data.callType === 'payment_cash' ? 'Плащане с брой' : 'Плащане с карта',
        type: 'urgent'
      });
    });

    return () => {
      pusher.unsubscribe('staff-channel');
      pusher.disconnect();
    };
  }, []);

  return null; // Invisible component
}

function showNotification(data: any) {
  // Desktop notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(data.title, { body: data.body });
  }

  // Visual alert on screen
  const alert = document.createElement('div');
  alert.className = 'notification-popup';
  alert.innerHTML = `
    <div class="bg-red-500 text-white p-6 rounded-lg shadow-2xl">
      <h3 class="text-2xl font-bold">${data.title}</h3>
      <p class="text-lg">${data.body}</p>
    </div>
  `;
  document.body.appendChild(alert);

  setTimeout(() => alert.remove(), 5000);
}
```

## 🎨 Staff Dashboard UI

### Live Orders View
```
┌────────────────────────────────────────────────┐
│  АКТИВНИ ПОРЪЧКИ           [🔄 Auto-refresh]   │
├────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ #12      │  │ #13      │  │ #14      │     │
│  │ Маса 3   │  │ Маса 7   │  │ Маса 1   │     │
│  │ ────────  │  │ ────────  │  │ ────────  │   │
│  │ 2x Кафе  │  │ 1x Уиски │  │ 3x Бира  │     │
│  │ 1x Вода  │  │ 1x Кола  │  │ 2x Салата│     │
│  │          │  │          │  │          │     │
│  │ 15.00лв  │  │ 22.00лв  │  │ 45.00лв  │     │
│  │          │  │          │  │          │     │
│  │ [ГОТОВО] │  │ [ГОТОВО] │  │ [ГОТОВО] │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└────────────────────────────────────────────────┘
```

### Notification Panel
```
┌────────────────────────────────────────────────┐
│  🔔 ИЗВЕСТИЯ                    [3 активни]    │
├────────────────────────────────────────────────┤
│  🔴 МАСА 5 - Плащане с брой         2 мин      │
│     [ПОТВЪРДИ] [ЗАВЪРШИ]                       │
│                                                │
│  🔴 МАСА 2 - Плащане с карта        5 мин      │
│     [ПОТВЪРДИ] [ЗАВЪРШИ]                       │
│                                                │
│  🟡 МАСА 8 - Нова поръчка          10 мин      │
│     [ВИЖДАМ]                                   │
└────────────────────────────────────────────────┘
```

## 🔄 Hype Integration (Phase 2)

### Sync Architecture
```
Luna Website ←→ Luna DB ←→ Hype API
     ↓              ↓           ↓
  Customers      Sync Job    Hype POS
```

### Sync Flow
```typescript
// Hourly sync from Hype
// Cron job or webhook from Hype

// 1. Get menu from Hype
const hypeMenu = await hypeAPI.getMenu();

// 2. Update our products
for (const item of hypeMenu.items) {
  await prisma.product.upsert({
    where: { hypeId: item.id },
    update: {
      priceBgn: item.price,
      isAvailable: item.available
    },
    create: { /* ... */ }
  });
}

// 3. Send orders to Hype
const pendingOrders = await prisma.order.findMany({
  where: { 
    status: 'completed',
    syncedToHype: false 
  }
});

for (const order of pendingOrders) {
  await hypeAPI.createOrder({
    table: order.tableNumber,
    items: order.items,
    total: order.totalBgn
  });
  
  await prisma.order.update({
    where: { id: order.id },
    data: { syncedToHype: true }
  });
}
```

## ⏱️ Implementation Timeline

### Phase 1: Core Setup (Week 1)
- ✅ Prisma + PostgreSQL migration
- ✅ Local image storage
- ✅ Basic auth for staff
- **Time:** 8-10 hours

### Phase 2: Customer Ordering (Week 2)
- ✅ QR code generation
- ✅ Order flow (select table → menu → cart → submit)
- ✅ Call waiter functionality
- **Time:** 12-15 hours

### Phase 3: Staff Dashboard (Week 3)
- ✅ Real-time notifications (Pusher)
- ✅ Live orders view
- ✅ Sound alerts
- ✅ Order management
- **Time:** 10-12 hours

### Phase 4: Polish & Deploy (Week 4)
- ✅ Testing
- ✅ QR card printing
- ✅ Production deployment
- ✅ Training documentation
- **Time:** 6-8 hours

### Phase 5: Hype Integration (Future)
- 🔄 Contact Hype for API access
- 🔄 Implement sync
- 🔄 Test integration
- **Time:** TBD (depends on Hype API)

**Total Time:** 36-45 hours for Phases 1-4

## 💰 Costs

### Development
- **PostgreSQL:** Free (local)
- **Pusher:** Free tier (200k msgs/day)
- **Images:** Free (local storage)
**Total:** $0

### Production (Monthly)
- **Hosting:** Vercel Free tier
- **Database:** Railway ($5) or Supabase Free
- **Pusher:** Free tier (sufficient)
- **Domain:** ~$10/year
**Total:** ~$5-10/month

### Hype Integration (if needed)
- **API Access:** Contact Hype (usually free for clients)
- **Support:** May require Commercial tier

## 🚀 Next Steps

Кажете ми:
1. ✅ Започваме с пълната система? (QR + Ordering + Staff dashboard)
2. ✅ PostgreSQL къде ще е? (local за dev, Railway/DigitalOcean за production?)
3. ✅ Колко маси има в бара? (за QR кодове)
4. ✅ Използвате ли вече Hype или ще го вземете?

И започваме! 🎉


