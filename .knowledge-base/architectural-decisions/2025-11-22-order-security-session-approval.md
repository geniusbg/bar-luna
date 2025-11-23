# Order Security: Session + Admin Approval System

**Date:** 2025-11-22  
**Status:** Design Phase 🎨  
**Requester:** Client

---

## 🎯 Requirements

### 1. **Сесия след сканиране**
- QR кодът не се променя (не изисква нови табелки)
- При сканиране на QR код → създава се сесия/токен
- Токенът е валиден за 2-4 часа
- Поръчките изискват валидна сесия
- Ако токенът изтече → клиентът трябва да сканира QR кода отново

### 2. **Мониторинг и одобрение**
- При **>5 поръчки от една маса за 5 минути** → изисква одобрение от админ
- Админът получава **push нотификация** с опции "Разреши" или "Откажи"
- Клиентът вижда съобщение: *"Направени са 5 поръчки за последните 5 минути. Заради съображения за сигурност и превантивно действие при потенциално неправомерни действия и хакерски атаки, тази поръчка изисква одобрение."*

---

## 🏗️ Architecture Options

### **Option 1: Client-side Session (localStorage)** ⭐ Recommended

**Flow:**
```
1. Client scans QR → /t/[table]
2. Server generates session token: table_session_{tableNumber}_{timestamp}
3. Token saved in localStorage: tableSession_{tableNumber}
4. Token expires in 2-4 hours
5. On order submit → send token with request
6. Server validates token
```

**Pros:**
- ✅ Simple implementation
- ✅ No database changes needed
- ✅ Works offline (token cached)
- ✅ No server-side session storage

**Cons:**
- ⚠️ Client can clear localStorage
- ⚠️ Not secure if client modifies token (but we validate on server)

**Implementation:**
- **Client:** `app/t/[table]/route.ts` → generate token, redirect to `/order?table=X&session=TOKEN`
- **Client:** `app/[locale]/order/page.tsx` → save token to localStorage on mount
- **Client:** `app/[locale]/order/page.tsx` → send token with order request
- **Server:** `app/api/orders/create/route.ts` → validate token

---

### **Option 2: Server-side Session (Database)**

**Flow:**
```
1. Client scans QR → /t/[table]
2. Server creates TableSession record in DB
3. Returns sessionId to client
4. Client stores sessionId in localStorage
5. On order submit → send sessionId
6. Server validates sessionId from DB
```

**Pros:**
- ✅ More secure (server controls session)
- ✅ Can track all sessions
- ✅ Can revoke sessions

**Cons:**
- ⚠️ Requires new DB table
- ⚠️ More complex
- ⚠️ DB queries on every order

**Implementation:**
- **DB:** New `TableSession` model (tableNumber, sessionId, expiresAt, createdAt)
- **Server:** `app/t/[table]/route.ts` → create session, return sessionId
- **Server:** `app/api/orders/create/route.ts` → validate sessionId

---

## 🔔 Push Notification Options

### **Option A: Web Push API** ⭐ Recommended

**Current System:**
- Already implemented (`app/api/push/send/route.ts`)
- Uses `web-push` library
- Stores subscriptions in `PushSubscription` table
- Works even when app is closed

**Implementation:**
```typescript
// In /api/orders/create when approval needed:
await fetch('/api/push/send', {
  method: 'POST',
  body: JSON.stringify({
    title: '⚠️ Поръчка изисква одобрение',
    body: `Маса ${tableNumber} - ${orderCount} поръчки за 5 минути`,
    url: `/bg/admin/orders/approve?orderId=${order.id}`,
    data: { orderId: order.id, action: 'approve' }
  })
});
```

**Pros:**
- ✅ Already implemented
- ✅ Works when app closed
- ✅ Cross-platform (browser + PWA)

**Cons:**
- ⚠️ Requires user permission
- ⚠️ May not work on all browsers

---

### **Option B: Pusher Real-time**

**Current System:**
- Already implemented (`lib/pusher-server.ts`)
- Real-time WebSocket connection
- Used for staff dashboard

**Implementation:**
```typescript
// In /api/orders/create when approval needed:
await pusherServer.trigger('admin-channel', 'order-approval-needed', {
  orderId: order.id,
  tableNumber,
  orderCount,
  timestamp: new Date().toISOString()
});
```

**Pros:**
- ✅ Real-time (instant)
- ✅ Already implemented
- ✅ Works on admin dashboard

**Cons:**
- ⚠️ Only works when admin dashboard is open
- ⚠️ Not a push notification (requires active connection)

---

### **Option C: Hybrid (Web Push + Pusher)** ⭐ Best

**Implementation:**
- **Web Push** for notifications when app is closed
- **Pusher** for real-time updates on admin dashboard
- Both trigger simultaneously

**Pros:**
- ✅ Best of both worlds
- ✅ Works in all scenarios

---

## 📊 Approval Flow

### **Database Schema**

```prisma
model PendingOrderApproval {
  id            String   @id @default(cuid())
  orderId       String   @unique
  tableNumber   Int
  orderCount    Int      // Number of orders in last 5 minutes
  reason        String   // "rate_limit_exceeded"
  status        String   // "pending", "approved", "rejected"
  requestedAt   DateTime @default(now())
  reviewedAt    DateTime?
  reviewedBy    String?  // Admin user ID
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@index([status, requestedAt])
}
```

### **API Endpoints**

1. **`POST /api/orders/create`** (modified)
   - Check rate limit (current: 2 orders / 5 min)
   - Check session token (new)
   - If >5 orders / 5 min → create `PendingOrderApproval`, return `requiresApproval: true`
   - Send push notification to admins

2. **`GET /api/orders/pending-approval`** (new)
   - List all pending approvals
   - Admin dashboard uses this

3. **`POST /api/orders/[id]/approve`** (new)
   - Approve order
   - Update `PendingOrderApproval.status = "approved"`
   - Update `Order.status = "pending"` (activate order)
   - Send Pusher notification to staff

4. **`POST /api/orders/[id]/reject`** (new)
   - Reject order
   - Update `PendingOrderApproval.status = "rejected"`
   - Update `Order.status = "cancelled"`
   - Send notification to client (optional)

---

## 🎨 UI Components

### **Client Side (Order Page)**

```typescript
// Show message when order requires approval
{requiresApproval && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded">
    <p className="font-semibold">Поръчката изисква одобрение</p>
    <p className="text-sm mt-2">
      Направени са 5 поръчки за последните 5 минути. Заради съображения за 
      сигурност и превантивно действие при потенциално неправомерни действия 
      и хакерски атаки, тази поръчка изисква одобрение.
    </p>
    <p className="text-sm mt-2">
      Поръчката ще бъде обработена след одобрение от администратор.
    </p>
  </div>
)}
```

### **Admin Side (Approval Modal)**

```typescript
// Modal with order details and approve/reject buttons
<Modal>
  <h2>⚠️ Поръчка изисква одобрение</h2>
  <p>Маса {tableNumber} - {orderCount} поръчки за 5 минути</p>
  <OrderDetails order={order} />
  <div className="flex gap-4">
    <Button onClick={handleApprove}>✅ Разреши</Button>
    <Button onClick={handleReject}>❌ Откажи</Button>
  </div>
</Modal>
```

---

## 🔄 Implementation Steps

### **Phase 1: Session System** (2-3 hours)
1. ✅ Modify `/t/[table]` to generate session token
2. ✅ Save token in localStorage on order page
3. ✅ Send token with order request
4. ✅ Validate token on server

### **Phase 2: Approval System** (3-4 hours)
1. ✅ Create `PendingOrderApproval` model
2. ✅ Modify rate limit check (5 orders / 5 min)
3. ✅ Create approval endpoints
4. ✅ Send push notifications

### **Phase 3: Admin UI** (2-3 hours)
1. ✅ Approval modal/page
2. ✅ List pending approvals
3. ✅ Approve/reject actions
4. ✅ Real-time updates (Pusher)

### **Phase 4: Client UI** (1 hour)
1. ✅ Approval message on order page
2. ✅ Loading states
3. ✅ Success/error handling

---

## 💡 Recommendations

**@virtual-pm recommends:**

1. **Session:** Use **Option 1 (Client-side)** - simpler, faster, sufficient security
2. **Notifications:** Use **Option C (Hybrid)** - Web Push + Pusher
3. **Rate Limit:** Change from 2 → 5 orders / 5 min (as requested)
4. **Approval:** Store in DB for audit trail

**Next Steps:**
- Consult **@virtual-security-expert** for token security
- Consult **@virtual-doer** for implementation details
- Start with Phase 1 (Session System)

---

## 📝 Questions for Discussion

1. **Session expiration:** 2, 3, or 4 hours? → **✅ 3 hours**
2. **Rate limit:** Keep 2 orders / 5 min OR change to 5 orders / 5 min? → **✅ 5 orders / 5 min**
3. **Approval timeout:** Auto-reject after X minutes if no response? → **✅ 30 minutes**
4. **Client notification:** Should client see real-time approval status? → **✅ Yes**

---

## ⚠️ Security Concern: QR Code Photo/Remote Access

### **Problem:**
Ако клиентът снима QR кода и го използва отдалечено, това може да прескочи защитите.

### **Current Protection:**
1. ✅ **Rate limiting по маса** - все още работи (5 поръчки / 5 мин)
2. ✅ **Approval system** - активира се след 5 поръчки
3. ✅ **Working hours check** - планирано (поръчки само в работно време)

### **Additional Protection Needed:**

#### **Option A: Session Age Validation** ⭐ Recommended
**How it works:**
- При създаване на сесия → запазваме `createdAt` timestamp в токена
- При поръчка → проверяваме дали сесията е създадена преди X време
- Ако сесията е >3 часа стара → изисква повторно сканиране

**Implementation:**
```typescript
// Token format: table_session_{tableNumber}_{timestamp}_{expiresAt}
const token = `table_session_${tableNumber}_${Date.now()}_${Date.now() + 3*60*60*1000}`;

// On order submit:
const [_, tableNum, createdAt, expiresAt] = token.split('_');
if (Date.now() > parseInt(expiresAt)) {
  return { error: 'Сесията е изтекла. Моля, сканирайте QR кода отново.' };
}
```

**Pros:**
- ✅ Просто
- ✅ Не изисква DB
- ✅ Автоматично изтичане

**Cons:**
- ⚠️ Клиентът може да модифицира токена (но валидираме на сървъра)

---

#### **Option B: Server-side Session Tracking**
**How it works:**
- При сканиране → създаваме `TableSession` в DB с `createdAt`
- При поръчка → проверяваме дали сесията съществува и не е изтекла
- Можем да проследяваме всички сесии

**Pros:**
- ✅ По-сигурно (сървърът контролира)
- ✅ Можем да видим всички активни сесии
- ✅ Можем да отменим сесии

**Cons:**
- ⚠️ Изисква DB таблица
- ⚠️ DB заявки при всяка поръчка

---

#### **Option C: IP + Session Combination**
**How it works:**
- При сканиране → запазваме IP адреса в сесията
- При поръчка → проверяваме дали IP адресът съвпада
- Ако не → изисква повторно сканиране

**Pros:**
- ✅ Допълнителна защита

**Cons:**
- ❌ Проблем с мобилни мрежи (IP се променя)
- ❌ Проблем с WiFi (всички имат един IP)
- ❌ Блокира легитимни клиенти

---

### **Recommended Solution:**
**Комбинация от:**
1. ✅ **Session Age Validation** (Option A) - основна защита
2. ✅ **Rate limiting по маса** (5 поръчки / 5 мин) - вече имаме
3. ✅ **Approval system** (след 5 поръчки) - планирано
4. ✅ **Working hours check** - планирано
5. ✅ **Server-side session tracking** (Option B) - за по-висока сигурност (опционално)

**Защо това работи:**
- Ако някой снима QR кода и го използва след 3 часа → сесията е изтекла, трябва да сканира отново
- Ако някой снима QR кода и го използва веднага → може да направи до 5 поръчки, след това изисква одобрение
- Ако някой снима QR кода и го използва извън работно време → блокира се от working hours check

**Conclusion:**
Сесията с 3-часово изтичане + rate limiting + approval system + working hours е достатъчна защита срещу снимка на QR кода.

