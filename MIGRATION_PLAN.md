# Luna Bar - Migration & Ordering System Plan

## 🎯 Нови изисквания

### 1. Миграция от Supabase към PostgreSQL + Prisma
- Локален/собствен PostgreSQL
- Prisma ORM
- Локално съхранение на снимки

### 2. Digital Ordering System
- **Клиентска част:**
  - Избор на маса
  - Разглеждане на меню
  - Добавяне към количка
  - Изпращане на поръчка
  - Повикване на сервитьор (брой/карта)

- **Персонал част:**
  - Real-time notifications
  - Звуков сигнал
  - Вижане на поръчки
  - Маркиране като изпълнени
  - Dashboard с активни поръчки

## 📋 План за миграция

### Фаза 1: PostgreSQL + Prisma Setup (2-3 часа)

#### 1.1 Install Prisma
```bash
npm install prisma @prisma/client
npm install -D prisma
npx prisma init
```

#### 1.2 Configure Database
```env
# .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/luna_bar"
```

#### 1.3 Create Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id         String    @id @default(uuid())
  nameBg     String    @map("name_bg")
  nameEn     String    @map("name_en")
  nameDe     String    @map("name_de")
  slug       String    @unique
  order      Int       @default(0)
  products   Product[]
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  @@map("categories")
}

model Product {
  id            String      @id @default(uuid())
  categoryId    String      @map("category_id")
  category      Category    @relation(fields: [categoryId], references: [id])
  nameBg        String      @map("name_bg")
  nameEn        String      @map("name_en")
  nameDe        String      @map("name_de")
  descriptionBg String?     @map("description_bg")
  descriptionEn String?     @map("description_en")
  descriptionDe String?     @map("description_de")
  priceBgn      Decimal     @map("price_bgn") @db.Decimal(10, 2)
  priceEur      Decimal     @map("price_eur") @db.Decimal(10, 2)
  imageUrl      String?     @map("image_url")
  isAvailable   Boolean     @default(true) @map("is_available")
  isFeatured    Boolean     @default(false) @map("is_featured")
  order         Int         @default(0)
  orderItems    OrderItem[]
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@map("products")
}

// NEW: Tables in the bar
model BarTable {
  id          String        @id @default(uuid())
  tableNumber Int           @unique @map("table_number")
  tableName   String?       @map("table_name")
  capacity    Int           @default(4)
  isActive    Boolean       @default(true) @map("is_active")
  qrCode      String?       @map("qr_code")
  orders      Order[]
  waiterCalls WaiterCall[]
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  @@map("bar_tables")
}

// NEW: Customer orders
model Order {
  id            String      @id @default(uuid())
  tableId       String?     @map("table_id")
  table         BarTable?   @relation(fields: [tableId], references: [id])
  tableNumber   Int?        @map("table_number")
  orderNumber   Int         @map("order_number")
  status        String      @default("pending") // pending, preparing, ready, completed, cancelled
  paymentMethod String?     @map("payment_method") // cash, card
  totalBgn      Decimal     @map("total_bgn") @db.Decimal(10, 2)
  totalEur      Decimal     @map("total_eur") @db.Decimal(10, 2)
  notes         String?
  customerName  String?     @map("customer_name")
  isPaid        Boolean     @default(false) @map("is_paid")
  items         OrderItem[]
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  completedAt   DateTime?   @map("completed_at")

  @@map("orders")
}

// NEW: Items in each order
model OrderItem {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String   @map("product_id")
  product     Product  @relation(fields: [productId], references: [id])
  productName String   @map("product_name")
  quantity    Int      @default(1)
  priceBgn    Decimal  @map("price_bgn") @db.Decimal(10, 2)
  priceEur    Decimal  @map("price_eur") @db.Decimal(10, 2)
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("order_items")
}

// NEW: Waiter calls / notifications
model WaiterCall {
  id              String    @id @default(uuid())
  tableId         String?   @map("table_id")
  table           BarTable? @relation(fields: [tableId], references: [id])
  tableNumber     Int       @map("table_number")
  callType        String    @map("call_type") // payment_cash, payment_card, assistance, order
  status          String    @default("pending") // pending, acknowledged, completed
  message         String?
  createdAt       DateTime  @default(now()) @map("created_at")
  acknowledgedAt  DateTime? @map("acknowledged_at")
  completedAt     DateTime? @map("completed_at")

  @@map("waiter_calls")
}

// NEW: Staff users
model Staff {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  role         String   @default("staff") // staff, manager, admin
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("staff")
}
```

#### 1.4 Migrate Database
```bash
# Generate migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Фаза 2: Real-time Communication (3-4 часа)

#### 2.1 Install Dependencies
```bash
npm install pusher pusher-js
# OR
npm install socket.io socket.io-client
```

#### 2.2 Setup WebSocket Server
```typescript
// lib/websocket.ts
import { Server } from 'socket.io';

export function initSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    // Join staff room
    socket.on('join-staff', () => {
      socket.join('staff');
    });

    // New order notification
    socket.on('new-order', (order) => {
      io.to('staff').emit('order-received', order);
    });

    // Waiter call notification
    socket.on('call-waiter', (call) => {
      io.to('staff').emit('waiter-called', call);
    });
  });

  return io;
}
```

### Фаза 3: Local Image Storage (1-2 часа)

```typescript
// app/api/upload/route.ts
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to public/uploads
  const filename = `${Date.now()}-${file.name}`;
  const path = join(process.cwd(), 'public/uploads', filename);
  
  await writeFile(path, buffer);
  
  return Response.json({ url: `/uploads/${filename}` });
}
```

### Фаза 4: Customer Ordering Interface (4-5 часа)

#### Нови страници:

**1. Table Selection**
```
/bg/order/select-table
- Избор на маса номер
- QR код scan (optional)
```

**2. Menu with Cart**
```
/bg/order/menu
- Продукти с "Добави към количка"
- Floating cart badge
- Quantities
```

**3. Cart & Checkout**
```
/bg/order/cart
- Review поръчка
- Добави бележки
- Изпрати
```

**4. Call Waiter**
```
/bg/order/call-waiter
- Повикай за плащане (брой/карта)
- Повикай за помощ
```

### Фаза 5: Staff Dashboard (5-6 часа)

#### Нов staff interface:

**1. Live Orders Dashboard**
```
/bg/staff/orders
- Grid view на активни поръчки
- Order cards с детайли
- Status buttons (Приготвя се, Готово, Завършено)
- Auto-refresh
```

**2. Notifications Panel**
```
/bg/staff/notifications
- Live feed на waiter calls
- Звуков сигнал
- Acknowledge бутони
```

**3. Tables Overview**
```
/bg/staff/tables
- Visual table layout
- Status на всяка маса
- Active orders per table
```

## 🛠️ Технически детайли

### Stack Changes

**Remove:**
- ❌ Supabase client
- ❌ Supabase storage
- ❌ Supabase auth

**Add:**
- ✅ Prisma ORM
- ✅ Socket.IO / Pusher
- ✅ Local file storage
- ✅ bcrypt (password hashing)
- ✅ Sound notification library

### File Structure Update

```
luna/
├── prisma/
│   └── schema.prisma
├── public/
│   └── uploads/          # Local images
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── websocket.ts      # Real-time
│   └── auth.ts           # Staff auth
├── app/
│   ├── [locale]/
│   │   ├── order/        # NEW: Customer ordering
│   │   │   ├── select-table/
│   │   │   ├── menu/
│   │   │   ├── cart/
│   │   │   └── call-waiter/
│   │   └── staff/        # NEW: Staff dashboard
│   │       ├── orders/
│   │       ├── notifications/
│   │       └── tables/
│   └── api/
│       ├── orders/
│       ├── waiter-calls/
│       └── websocket/
└── components/
    ├── Cart.tsx
    ├── OrderCard.tsx
    ├── NotificationBell.tsx
    └── SoundAlert.tsx
```

## 📊 Complexity & Time Estimate

| Phase | Task | Time | Difficulty |
|-------|------|------|------------|
| 1 | Prisma Setup | 2-3h | Medium |
| 2 | Real-time Setup | 3-4h | Hard |
| 3 | Image Storage | 1-2h | Easy |
| 4 | Customer Interface | 4-5h | Medium |
| 5 | Staff Dashboard | 5-6h | Hard |
| **Total** | | **15-20h** | **Hard** |

## 💰 Cost Comparison

### With Supabase (Original)
- Free tier: $0/month
- Pro tier: $25/month (when needed)

### With PostgreSQL + Local
- **Development:**
  - PostgreSQL: Free (локален)
  - Images: Free (локални)
  - **Total: $0**

- **Production:**
  - PostgreSQL hosting: $5-15/month (DigitalOcean, Railway)
  - Server storage: Included
  - **Total: ~$10/month**

## ❓ Следващи стъпки

**Вариант A: Само миграция към PostgreSQL**
- Запазваме текущите features
- Сменяме Supabase → Prisma
- 2-3 часа работа

**Вариант B: Пълна система (миграция + ordering)**
- PostgreSQL + Prisma
- Real-time ordering
- Staff dashboard
- 15-20 часа работа

**Препоръка:** Ако искате ordering system-а, по-добре е да го направим отново от нулата с Prisma от началото, отколкото да мигрираме и после да добавяме.

Кое предпочитате?


