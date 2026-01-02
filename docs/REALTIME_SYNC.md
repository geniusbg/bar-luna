# Real-time Synchronization System

## Как работи real-time sync-ът?

Приложението използва **Pusher WebSocket** за real-time комуникация между клиенти и персонал.

## Pusher Events

### 1. `new-order` (Нова поръчка)
**Изпраща се от:** `/api/orders/create`  
**Слуша се в:** Staff Dashboard  
**Когато:** Клиент изпрати поръчка от QR меню

**Payload:**
```javascript
{
  orderId: "uuid",
  orderNumber: 1,
  tableNumber: 1,
  items: [...],
  totalBgn: 10.00,
  totalEur: 5.11
}
```

**Ефект:**
- ✅ Sound notification
- ✅ Popup notification
- ✅ Push notification (ако е активирано)
- ✅ Поръчката се добавя в списъка на всички staff устройства

---

### 2. `waiter-call` (Повикване на сервитьор)
**Изпраща се от:** `/api/waiter-call`  
**Слуша се в:** Staff Dashboard  
**Когато:** Клиент повика сервитьор (плащане/помощ)

**Payload:**
```javascript
{
  callId: "uuid",
  tableNumber: 1,
  callType: "payment_cash" | "payment_card" | "help",
  message: "Плащане с брой",
  timestamp: "2025-01-01T12:00:00Z"
}
```

**Ефект:**
- ✅ Urgent sound notification
- ✅ Urgent popup (червен с pulse animation)
- ✅ Push notification
- ✅ Повикването се добавя в списъка на всички staff устройства

---

### 3. `order-status-change` (Промяна на статус на поръчка)
**Изпраща се от:** `/api/orders/[id]/status`  
**Слуша се в:** Staff Dashboard  
**Когато:** Персонал промени статус на поръчка (pending → preparing → ready → completed)

**Payload:**
```javascript
{
  orderId: "uuid",
  orderNumber: 1,
  tableNumber: 1,
  status: "preparing" | "ready" | "completed"
}
```

**Ефект:**
- ✅ Статусът се update-ва автоматично на ВСИЧКИ staff устройства
- ✅ Без reload, веднага

---

### 4. `call-status-change` (Промяна на статус на повикване)
**Изпраща се от:** `/api/waiter-call/[id]/acknowledge`, `/api/waiter-call/[id]/complete`  
**Слуша се в:** Staff Dashboard  
**Когато:** Персонал acknowledge-не или завърши повикване

**Payload:**
```javascript
{
  callId: "uuid",
  tableNumber: 1,
  status: "acknowledged" | "completed"
}
```

**Ефект:**
- ✅ Статусът се update-ва автоматично на ВСИЧКИ staff устройства
- ✅ Без reload, веднага

---

## Staff Dashboard Pusher Listeners

```javascript
// Setup
const pusher = getPusherClient();
const channel = pusher.subscribe('staff-channel');

// Listeners
channel.bind('new-order', handleNewOrder);
channel.bind('waiter-call', handleWaiterCall);
channel.bind('order-status-change', handleOrderStatusChange);
channel.bind('call-status-change', handleCallStatusChange);

// Cleanup
channel.unbind_all();
pusher.unsubscribe('staff-channel');
```

---

## Multi-Device Synchronization

### Сценарий 1: Нова поръчка
1. Клиент изпраща поръчка от `/bg/order?table=1`
2. API създава поръчката в базата
3. API изпраща `new-order` event
4. **ВСИЧКИ** отворени Staff Dashboard-ове получават event
5. Поръчката се появява веднага на всички устройства

### Сценарий 2: Промяна на статус
1. Персонал А на устройство 1 кликва "Приготвяме"
2. API update-ва статуса в базата
3. API изпраща `order-status-change` event
4. **Устройство 2, 3, N** получават event
5. Статусът се update-ва автоматично на всички устройства

### Сценарий 3: Waiter Call
1. Клиент повиква сервитьор за плащане
2. API създава call в базата
3. API изпраща `waiter-call` event
4. **ВСИЧКИ** staff устройства получават urgent notification
5. Персонал А кликва "Отивам" → изпраща се `call-status-change`
6. **ВСИЧКИ** устройства виждат че повикването е acknowledged

---

## Тестване на Real-time Sync

### Тест 1: Multi-device Order Updates
1. Отвори Staff Dashboard на 2 устройства
2. Направи тестова поръчка от QR код
3. Провери дали и двете устройства получават notification
4. На едното устройство промени статуса
5. Провери дали другото устройство се update-ва автоматично

### Тест 2: Waiter Call Sync
1. Отвори Staff Dashboard на 2 устройства
2. Повикай сервитьор от QR меню
3. Провери дали и двете устройства получават urgent notification
4. На едното устройство кликни "Отивам"
5. Провери дали другото устройство вижда промяната

---

## Важно

- ✅ Real-time работи само когато **Pusher е конфигуриран** (PUSHER_APP_ID, KEY, SECRET, CLUSTER в .env)
- ✅ Staff Dashboard трябва да е отворен (не minimized) за да получава push notifications
- ✅ PWA режим + Push активиран = Background notifications
- ✅ Всички промени се broadcast-ват към `staff-channel`
- ✅ Няма нужда от refresh - всичко е live

---

## Debugging

Ако real-time не работи:

1. **Провери конзолата:**
   ```
   ✅ Pusher connected
   🔔 New order received: {...}
   🔄 Order status changed: {...}
   ```

2. **Провери Pusher credentials:**
   - `.env` файл има всички PUSHER_* променливи
   - Credentials са правилни

3. **Провери network:**
   - WebSocket connection към Pusher
   - В Network tab виж `wss://ws-*.pusher.com`

4. **Провери API responses:**
   - API изпраща Pusher events (виж server logs)
   - Няма грешки при `pusherServer.trigger()`

