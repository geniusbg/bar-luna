# 🔔 Windows Desktop Notifications - Fix

## Проблем: Получаваш звук, но не виждаш popup

**Причина:** Windows блокира notifications или Chrome няма права.

---

## ✅ Fix 1: Провери Windows Focus Assist

**Windows може да блокира notifications автоматично!**

### **Windows 11:**
```
1. Windows Settings (Win + I)
2. System → Notifications
3. Focus assist → OFF
   ИЛИ
   Focus assist → Priority only → Add Chrome
```

### **Windows 10:**
```
1. Action Center (Win + A)
2. Focus assist → OFF
```

**Провери също:**
```
Settings → System → Notifications → Chrome → ON
```

---

## ✅ Fix 2: Chrome Notification Permissions

### **Провери Site Permissions:**

**В Chrome:**
```
1. Отвори: http://localhost:3000/bg/staff
2. Click иконката в address bar (🔒 или ⓘ)
3. Site settings
4. Notifications → Allow
```

**ИЛИ директно:**
```
chrome://settings/content/notifications
```

Намери `localhost:3000` → трябва да е **Allow**

---

## ✅ Fix 3: Chrome Background Mode

**За да получаваш notifications когато Chrome е затворен:**

```
1. Chrome Settings (chrome://settings)
2. Search: "background"
3. "Continue running background apps when Chrome is closed" → ON
```

**Важно:** Това позволява Chrome Service Workers да работят в background!

---

## ✅ Fix 4: Windows Notification Settings

### **Провери че Windows Notifications са включени:**

**Windows 11:**
```
1. Settings → System → Notifications
2. "Notifications" → ON
3. Scroll down → "Google Chrome" → ON
   (може да се казва "Chrome" или "Edge")
```

**Windows 10:**
```
1. Settings → System → Notifications & actions
2. "Get notifications from apps and other senders" → ON
3. Find "Google Chrome" → ON
```

---

## ✅ Fix 5: Test в DevTools

**Отвори Chrome DevTools на staff dashboard:**

```javascript
// 1. Провери permission
console.log('Notification permission:', Notification.permission);
// Трябва: "granted"

// 2. Test notification директно
if (Notification.permission === 'granted') {
  new Notification('Test', {
    body: 'Работи ли?',
    icon: '/icon-192.png',
    requireInteraction: true
  });
}

// 3. Провери Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW registered:', regs.length);
  regs.forEach(reg => console.log('SW state:', reg.active?.state));
});
```

**Ако test notification се показва:**
✅ Windows + Chrome permissions са OK
❌ Проблемът е в push payload или Service Worker

**Ако не се показва:**
❌ Windows блокира notifications
→ Провери Focus Assist и Notification Settings

---

## ✅ Fix 6: Restart Service Worker

**Понякога SW трябва да се refresh-не:**

**В Chrome DevTools:**
```
1. Application tab
2. Service Workers
3. Click "Unregister" за Luna Bar SW
4. Refresh страницата (F5)
5. SW ще се регистрира отново
```

**ИЛИ в код (на staff dashboard):**
```javascript
// Force SW update
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
});
```

---

## ✅ Fix 7: Check Console Logs

**Когато направиш поръчка, провери Console:**

**В Chrome DevTools на staff dashboard (F12):**
```
Console → трябва да видиш:

🔔 Push received: PushEvent {...}
📦 Push payload: { title: "...", body: "...", ... }
📢 Showing notification: Luna Bar { body: "...", ... }
✅ Notification shown successfully!
```

**Ако виждаш ERROR:**
```
❌ Notification show failed: NotAllowedError
→ Permissions problem! Провери Fix 1-4
```

**Ако виждаш само звук без logs:**
```
→ Service Worker може би не е активен правилно
→ Refresh SW (Fix 6)
```

---

## 🎯 Rapid Test Checklist:

### **Quick Windows Check:**
```
1. [ ] Win + A → Focus Assist OFF
2. [ ] Settings → Notifications → Chrome → ON
3. [ ] Chrome → Site Settings → localhost:3000 → Notifications → Allow
4. [ ] Chrome DevTools → Console → Test notification (от Fix 5)
```

### **Ако test notification работи:**
```
→ Windows е OK!
→ Проблемът е в payload от server
→ Провери server logs при push send
```

### **Ако test notification НЕ работи:**
```
→ Windows блокира!
→ Провери Focus Assist
→ Провери Windows Notification Settings
→ Restart Chrome
```

---

## 🖥️ Desktop vs Mobile - Разлика

### **Desktop (Windows/Mac):**
```
⚠️ Notifications работят НАЙ-ДОБРЕ когато:
  - Chrome е running (дори минимизиран)
  - Background mode е ON
  - PWA app е минимизиран (НЕ затворен)

❌ Когато app-ът е напълно затворен:
  - Service Worker може да "заспи"
  - Push може да не стигне
  - Depends on OS и Chrome settings
```

### **Mobile (Android):**
```
✅ Notifications работят ВИНАГИ:
  - App затворен → работи!
  - Phone заключен → работи!
  - Chrome затворен → работи!
  - Perfecto! 🎉
```

---

## 💡 Препоръка за Luna Bar:

### **За Development/Testing:**
```
1. Test на Desktop → провери дали payload е правилен
2. Test на Android → реално тестване на production behavior
```

### **За Production/Real Usage:**
```
✅ Staff използват Android phones
  → Push работи перфектно дори когато app е затворен
  
⚠️ Ако някой staff използва Windows tablet/laptop:
  → Кажи им да оставят app-а минимизиран (не затворен)
  → ИЛИ да оставят Chrome running с background mode ON
```

---

## 🚀 След тези Fix-ове:

**Трябва да видиш Windows notification popup:**

```
┌─────────────────────────────────┐
│ 🌙 Luna Bar                     │
│ 🔴 Нова поръчка!                │
│ Маса 5 - 3 продукта             │
│ Общо: 45.00 лв. / €23.01        │
└─────────────────────────────────┘
```

**Click-ваш → app се отваря и вижда детайли!**

---

## ❓ Ако НИЩО не помага:

### **Последна опция: Browser Notification API Test**

```javascript
// Console на staff dashboard:
Notification.requestPermission().then(perm => {
  if (perm === 'granted') {
    const n = new Notification('LUNA TEST', {
      body: 'Ако виждаш това, Windows permissions са OK!',
      requireInteraction: true,
      silent: false
    });
    
    setTimeout(() => n.close(), 10000);
  } else {
    console.error('Permission denied!');
  }
});
```

**Ако това се показва:**
→ Windows е OK, проблемът е в Service Worker push handling

**Ако не се показва:**
→ Windows definitively блокира Chrome notifications
→ Провери Windows Notification Center settings наново

---

## ✅ Накратко:

**3 главни неща за Windows Desktop notifications:**

1. **Focus Assist → OFF** (най-честият виновник!)
2. **Chrome → Site Settings → Notifications → Allow**
3. **App минимизиран, НЕ затворен** (за най-добри резултати)

**За production:** Използвай Android phones! 📱

