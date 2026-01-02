# 🔍 Debug Push Notifications - Стъпка по Стъпка

## ✅ Проблемът е идентифициран!

**Намерих:** `lib/web-push.ts` използваше **погрешно име** на VAPID public key променливата!

**Оправено:** ✅ Сега използва правилното име: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

---

## 🚀 Стъпка 1: Провери/Добави VAPID keys в .env

**Отвори/създай `.env` в root директорията:**

```env
# Добави тези редове (ако ги няма):
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOXaeCkYmxq8c8hQzTlVHifr2T-9d4P0vX4qOmHh-UkeaPW4AI3TEmPX8wb3Yq-Pb-fwC4twVFVdFqwfDEQscmc
VAPID_PRIVATE_KEY=WvLrf6l-c1znjagnpdAS5ADiCK-o6TQvAUEVvfQnfk8
```

**Важно:** Копирай ТОЧНО тези ключове (включват = в края)!

---

## 🚀 Стъпка 2: Рестартирай Server-а

**В терминала:**
```bash
Ctrl + C  # Спри server-а
npm run dev  # Стартирай отново
```

**Трябва да видиш в терминала:**
```
🔑 VAPID Configuration:
  Public key: ✅ Present
  Private key: ✅ Present
✅ Web Push configured successfully!
```

**Ако виждаш:**
```
❌ VAPID keys missing!
```
→ .env файлът не е правилен или не е на правилното място!

---

## 🚀 Стъпка 3: Unregister Service Worker

**В Chrome на staff dashboard (http://localhost:3000/bg/staff):**

**Отвори DevTools (F12) → Application tab:**
```
1. В лявото меню: Service Workers
2. Намери Luna Bar SW
3. Click "Unregister"
4. Refresh страницата (F5)
5. SW ще се регистрира отново с новия код
```

**ИЛИ в Console:**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  console.log('✅ All SW unregistered');
});

// Refresh след 2 секунди
setTimeout(() => location.reload(), 2000);
```

---

## 🚀 Стъпка 4: Активирай Push отново

**След refresh на staff dashboard:**

```
1. Вижда ли се бутонът "🔔 Активирай Push Notifications"?
   - Ако ДА → Click го отново
   - Ако НЕ → Unsubscribe и subscribe отново (виж долу)
```

**Ако бутонът НЕ се вижда (вече subscribed):**

**Unsubscribe и subscribe отново:**
```javascript
// В Console на staff dashboard:

// 1. Unsubscribe
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    if (sub) {
      sub.unsubscribe();
      console.log('✅ Unsubscribed');
    }
  });
});

// 2. Refresh страницата (F5)
// 3. Click бутона "🔔 Активирай Push Notifications" отново
```

---

## 🚀 Стъпка 5: Тествай с логове

### **5.1: Отвори DevTools на staff dashboard**

**F12 → Console tab**

### **5.2: Направи поръчка**

**От друг browser tab/window:**
```
http://localhost:3000/bg
→ "Извикай сервитьор" → "Плащане с брой"
```

### **5.3: Провери логовете**

#### **А) В терминала (server logs):**

Трябва да видиш:
```
📤 Sending push to 1 devices...
📦 Sending payload: {"title":"🔴 Извикване от маса!","body":"Маса 1 - Плащане с брой",...}
📍 To endpoint: https://fcm.googleapis.com/fcm/send/...
✅ Push sent: 1 successful, 0 failed
```

**Ако виждаш error:**
```
❌ Failed to send to subscription: UnauthorizedRegistration
```
→ VAPID keys не са правилни или subscription-ът е стар!

#### **Б) В Chrome Console (client logs):**

Трябва да видиш:
```
🔔🔔🔔 PUSH EVENT RECEIVED 🔔🔔🔔
Has data: true
📦📦📦 PAYLOAD PARSED: {
  "title": "🔴 Извикване от маса!",
  "body": "Маса 1 - Плащане с брой",
  ...
}
📢📢📢 CALLING showNotification: 🔴 Извикване от маса!
Options: {...}
✅✅✅ NOTIFICATION SHOWN SUCCESSFULLY!
```

**И Windows notification popup трябва да се покаже!** 📬

---

## 🎯 Възможни проблеми и решения:

### ❌ Problem 1: "VAPID keys missing" в терминала

**Причина:** .env не се чете или е на погрешно място

**Fix:**
```bash
# Провери че .env е в root (същата директория като package.json)
ls -la .env

# ИЛИ на Windows:
dir .env

# Трябва да съществува!
```

### ❌ Problem 2: "UnauthorizedRegistration" error

**Причина:** VAPID public key в subscription не съвпада с private key на server

**Fix:**
```javascript
// Unsubscribe напълно и subscribe наново (Стъпка 4)
```

### ❌ Problem 3: Виждаш logs в Console, но няма popup

**Причина:** Windows Focus Assist или notification permissions

**Fix:**
```
1. Win + A → Focus Assist → OFF
2. Settings → Notifications → Chrome → ON
3. Restart Chrome
```

### ❌ Problem 4: "No data in push event" в Console

**Причина:** Server не праща payload правилно

**Fix:**
```
Провери server logs - трябва да виждаш:
📦 Sending payload: {...}
```

---

## ✅ Success Checklist:

Трябва да видиш:

- [ ] Server стартира с "✅ Web Push configured successfully!"
- [ ] Push активиран (зелен индикатор в app)
- [ ] Server logs: "📦 Sending payload..." при поръчка
- [ ] Server logs: "✅ Push sent: 1 successful"
- [ ] Client logs: "🔔🔔🔔 PUSH EVENT RECEIVED"
- [ ] Client logs: "📦📦📦 PAYLOAD PARSED"
- [ ] Client logs: "✅✅✅ NOTIFICATION SHOWN"
- [ ] **Windows notification popup се показва!** 📬

---

## 🎉 Ако всички logs се виждат:

**Notification ТРЯБВА да се покаже!**

Ако не се показва:
→ Windows Focus Assist или permissions issue
→ Виж `WINDOWS_NOTIFICATIONS_FIX.md`

---

## 📱 За Mobile Testing:

**След като работи на Desktop:**

```
1. Намери IP: ipconfig → 192.168.x.x
2. Android Chrome: http://192.168.x.x:3000/bg/staff
3. Install app
4. Activate push
5. Затвори app напълно
6. Направи поръчка
7. Phone вибрира + notification! 🔔
```

---

## 🔧 Debugging Commands:

### **Check current subscription:**
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Current subscription:', sub);
    if (sub) {
      console.log('Endpoint:', sub.endpoint.substring(0, 50) + '...');
    }
  });
});
```

### **Check SW state:**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs.length);
  regs.forEach(reg => {
    console.log('State:', reg.active?.state);
    console.log('Scope:', reg.scope);
  });
});
```

### **Force SW update:**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
  console.log('✅ SW update triggered');
});
```

---

## 📊 Final Test:

**Ако имаш всички ✅ в success checklist:**
→ Push notifications работят перфектно! 🎉

**Кажи ми какво виждаш на всяка стъпка!** 🎯

