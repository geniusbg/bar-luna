# Real-time Notifications - Как точно работи

## ❌ ГРЕШНО разбиране

```
Pusher → Browser Notification (Chrome popup) ❌
Pusher → Трябва permission ❌
```

## ✅ ПРАВИЛНО разбиране

```
Pusher → JavaScript event → НАШ custom UI на сайта ✅
```

---

## 📱 Визуално как ще изглежда

### Staff Dashboard екран:

```
┌─────────────────────────────────────────────────┐
│  Malls - Staff Dashboard              [Logout] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Активни поръчки: 3                             │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ #12      │  │ #13      │  │ #14      │     │
│  │ Маса 5   │  │ Маса 3   │  │ Маса 8   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘

    ↓ Клиент поръчва от Маса 7 ↓

┌─────────────────────────────────────────────────┐
│  Malls - Staff Dashboard              [Logout] │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐ │
│  │  🔔 НОВА ПОРЪЧКА!                         │ │ ← Custom popup
│  │  ═════════════════                        │ │    НА САЙТА
│  │  Маса 7 - Поръчка #15                    │ │    (не browser)
│  │  2x Капучино, 1x Кола                    │ │
│  │  ──────────────────────────              │ │
│  │  [ВИЖДАМ]  [ОЩЕ НЕ]                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Активни поръчки: 4                             │ ← Auto update
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ #15 NEW! │  │ #12      │  │ #13      │     │ ← Нова карта
│  │ Маса 7   │  │ Маса 5   │  │ Маса 3   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘

🔊 ЗВУК: "beep.mp3" играе автоматично
   (БЕЗ browser permission!)
```

---

## 💻 Точният код

### 1. Staff Dashboard Component

```typescript
// components/staff/NotificationListener.tsx
'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export function NotificationListener() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Pusher връзка
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: 'eu'
    });

    const channel = pusher.subscribe('staff-channel');

    // Слушаме за нова поръчка
    channel.bind('new-order', (data: any) => {
      // 1. ЗВУКОВ СИГНАЛ (БЕЗ permission!)
      const audio = new Audio('/sounds/new-order.mp3');
      audio.play(); // ✅ Работи директно!

      // 2. CUSTOM POPUP НА САЙТА
      setNotifications(prev => [{
        id: Date.now(),
        type: 'order',
        title: `НОВА ПОРЪЧКА!`,
        message: `Маса ${data.tableNumber} - Поръчка #${data.orderNumber}`,
        data: data
      }, ...prev]);

      // 3. Auto-refresh поръчките
      window.dispatchEvent(new Event('refresh-orders'));
    });

    return () => {
      pusher.unsubscribe('staff-channel');
    };
  }, []);

  return (
    <>
      {/* Custom notification popup - НА САМИЯ САЙТ */}
      {notifications.map(notif => (
        <div 
          key={notif.id}
          className="fixed top-20 right-4 z-50 animate-slide-in"
        >
          <div className="bg-red-500 text-white p-6 rounded-xl shadow-2xl border-4 border-white">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🔔</div>
              <div>
                <h3 className="text-2xl font-bold">{notif.title}</h3>
                <p className="text-lg">{notif.message}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
              }}
              className="mt-4 w-full bg-white text-red-500 px-6 py-3 rounded-lg font-bold"
            >
              ВИЖДАМ
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
```

### 2. Звуков файл

```typescript
// public/sounds/new-order.mp3
// Просто MP3 файл който играе директно
// БЕЗ browser permission!

const audio = new Audio('/sounds/new-order.mp3');
audio.volume = 1.0; // Пълна сила
audio.play(); // ✅ Работи веднага!
```

---

## 🔊 Звуковият сигнал

### ✅ Работи БЕЗ permission:

```typescript
// НЕ трябва permission за:
const audio = new Audio('/sounds/beep.mp3');
audio.play(); // ✅ Директно работи

// Volume control
audio.volume = 1.0; // 0.0 до 1.0

// Можете дори да loop-нете
audio.loop = true;
```

### ❌ Трябва permission само ако:
- Искате вибрация на телефон
- Искате Chrome/Firefox system notification
- Искате wake screen ако е заключен

### За Malls:
- Staff dashboard е ОТВОРЕН на екран
- Звукът играе директно
- **НЯМА нужда от permissions!**

---

## 🎨 Custom Notification Styles

### Вариант 1: Floating Card (препоръчвам)
```css
/* Големи, забележими, на сайта */
.notification-popup {
  position: fixed;
  top: 80px;
  right: 20px;
  background: linear-gradient(135deg, #ff0000, #cc0000);
  color: white;
  padding: 30px;
  border-radius: 20px;
  font-size: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  animation: shake 0.5s infinite;
  z-index: 9999;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

### Вариант 2: Full Screen Flash
```typescript
// За много важни notifications (payment request)
function urgentNotification() {
  // Цял екран червен flash
  document.body.style.backgroundColor = 'red';
  setTimeout(() => {
    document.body.style.backgroundColor = '';
  }, 500);
  
  // Силен звук
  const audio = new Audio('/sounds/urgent.mp3');
  audio.volume = 1.0;
  audio.play();
}
```

### Вариант 3: Corner Badge
```typescript
// Постоянен badge в ъгъла
<div className="fixed top-4 right-4">
  {pendingOrders > 0 && (
    <div className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold animate-pulse">
      {pendingOrders}
    </div>
  )}
</div>
```

---

## 🔔 Browser Notifications (ОПЦИОНАЛНО)

### Ако все пак искате browser notifications:

```typescript
// Питаме за permission ВЕДНЪЖ
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Използваме само като backup
channel.bind('new-order', (data) => {
  // 1. Custom UI popup (винаги)
  showCustomPopup(data);
  
  // 2. Play sound (винаги)
  playSound();
  
  // 3. Browser notification (само ако е разрешен)
  if (Notification.permission === 'granted') {
    new Notification('Нова поръчка', {
      body: `Маса ${data.tableNumber}`,
      icon: '/logo.png'
    });
  }
});
```

**Но това е опционално!** Основната функционалност работи БЕЗ това.

---

## 🎯 Заключение

### Pusher роля:
```
САМО транспорт на данни (WebSocket)
НЕ показва UI
НЕ иска permissions
```

### НИЕ правим:
```
✅ Custom UI popups (на сайта)
✅ Звукови сигнали (директно)
✅ Visual alerts (каквото искаме)
✅ Auto-refresh на списъци
```

### Permissions трябват САМО за:
```
❌ Browser system notifications (опционално)
❌ Mobile vibration (не го използваме)
✅ ЗВУК: НЕ трябва permission!
✅ UI POPUPS: НЕ трябва permission!
```

---

## 🎨 Можем да направим каквото искате!

**Примери:**

1. **Червен flash на целия екран** ✅
2. **Мигащи карти** ✅
3. **Анимирани popups** ✅
4. **Силен звуков сигнал** ✅
5. **Counter badge** ✅
6. **Full screen modal** ✅

Всичко това е **НА САМИЯ САЙТ**, без browser permissions!

---

## ❓ Ясно ли е сега?

**Pusher = само data delivery (WebSocket)**  
**UI & Sound = напълно custom, под наш контрол**  

Харесва ли ви този подход? 😊

Или искате да видите demo код с конкретен дизайн на notifications?

