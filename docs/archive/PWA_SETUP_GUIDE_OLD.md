# 📱 PWA + Web Push Setup Guide

**Status:** ✅ Code implemented, needs configuration

---

## 🎯 Какво е направено:

✅ Service Worker (`/public/sw.js`)  
✅ PWA Manifest (`/public/manifest.json`)  
✅ Push subscription API (`/api/push/subscribe`)  
✅ Push send API (`/api/push/send`)  
✅ Database table (`push_subscriptions`)  
✅ Client library (`lib/push-notifications.ts`)  
✅ Integration in orders & waiter calls  
✅ UI в Staff Dashboard  

---

## 🔧 Стъпка 1: Добави VAPID Keys в .env

Вече съм генерирал VAPID keys. Добави ги в твоя `.env` файл:

```env
# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOXaeCkYmxq8c8hQzTlVHifr2T-9d4P0vX4qOmHh-UkeaPW4AI3TEmPX8wb3Yq-Pb-fwC4twVFVdFqwfDEQscmc
VAPID_PRIVATE_KEY=WvLrf6l-c1znjagnpdAS5ADiCK-o6TQvAUEVvfQnfk8
```

⚠️ **ВАЖНО:** `VAPID_PRIVATE_KEY` е **ТАЙНА** - никога не я споделяй публично!

---

## 🖼️ Стъпка 2: Създай Icons

Трябват 3 икони за PWA:

### **Icon 192x192** (`public/icon-192.png`)
- Размер: 192x192 pixels
- Format: PNG
- Съдържание: Luna лого или "L" с луна 🌙
- Background: Purple (#9333ea)

### **Icon 512x512** (`public/icon-512.png`)
- Размер: 512x512 pixels
- Format: PNG
- Същото съдържание като 192

### **Badge 72x72** (`public/badge-72.png`)
- Размер: 72x72 pixels
- Format: PNG
- Монохромна (бяла) икона на прозрачен фон
- За notification badge

**Бърз вариант:**
Можеш да използваш https://realfavicongenerator.net/ за генериране на всички размери от един лого.

---

## 🔄 Стъпка 3: Рестартирай Dev Server

PWA промените изискват рестарт + Prisma regenerate:

```bash
# Спри dev server (Ctrl+C)

# Регенерирай Prisma (за PushSubscription модела)
npx prisma generate

# Стартирай отново
npm run dev
```

---

## 📱 Стъпка 4: Тествай на телефон

### **Android (Chrome):**

1. Отвори на телефон: `http://твоя-ip:3000/bg/staff`
   - Намери IP с: `ipconfig` (Windows) или `ifconfig` (Mac/Linux)
   - Например: `http://192.168.1.100:3000/bg/staff`

2. В Chrome ще видиш банер "Инсталирай App" или:
   - Menu (3 dots) → "Install app" или "Add to Home Screen"

3. След инсталиране:
   - Отвори Luna Staff app от home screen
   - Click бутона "🔔 Активирай Push Notifications"
   - Разреши permissions
   - Ще получиш test notification!

4. **Тест:**
   - Затвори app-а (затвори го напълно)
   - От друго устройство направи поръчка
   - Трябва да получиш notification на телефона! 🔔

### **iOS (Safari):**

1. Отвори в Safari: `http://твоя-ip:3000/bg/staff`

2. Click Share button → "Add to Home Screen"

3. Отвори app-а от home screen

4. Click "🔔 Активирай Push Notifications"

⚠️ **Note:** iOS изисква **HTTPS** за Web Push! На localhost може да не работи.

---

## 🎨 Стъпка 5: Customize (Optional)

### **Manifest colors** (`public/manifest.json`):
```json
{
  "background_color": "#0f172a",  // ← Промени тук
  "theme_color": "#9333ea"        // ← И тук
}
```

### **Notification sound** (`public/sw.js`):
- Сега използва vibration pattern
- Можеш да добавиш и sound файл

---

## ✅ Как работи финалната система:

```
📱 Staff инсталира PWA app на телефона
    ↓
Активира Push Notifications (one time)
    ↓
Device се регистрира в database
    ↓
--- ГОТОВО! ---
    ↓
Customer прави поръчка
    ↓
API изпраща Web Push
    ↓
🔔 Notification на телефона (дори app затворен!)
    ↓
Staff click → Отваря Staff Dashboard
```

---

## 🔍 Debug:

### **Check browser console:**
```javascript
// Проверка дали Push е supported
navigator.serviceWorker && 'PushManager' in window  // трябва да е true

// Проверка на service worker
navigator.serviceWorker.ready.then(reg => console.log(reg))

// Проверка на subscription
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log(sub))
```

### **Check database:**
```sql
SELECT * FROM push_subscriptions;
```

Трябва да видиш записи за всеки subscribed device.

---

## 🎯 Production Deployment:

**За production трябва:**

1. **HTTPS домейн** (задължително за iOS)
   - Vercel дава безплатен HTTPS
   - Or CloudFlare SSL

2. **Production VAPID keys** (optional - може същите)
   - Генерирай нови с: `npx web-push generate-vapid-keys`

3. **App icons** (препоръчително - professional look)
   - Hire designer or use Canva/Figma

4. **Test на реални устройства**

---

## 📊 Expected Results:

**Android:**
- ✅ Perfect PWA support
- ✅ Push notifications work when app closed
- ✅ Looks & feels like native app
- ✅ Fast & responsive

**iOS:**
- ✅ PWA support (iOS 11.3+)
- ✅ Push notifications (iOS 16.4+)
- ⚠️ Requires HTTPS
- ✅ Add to home screen works great

---

## 🆘 Troubleshooting:

**"Install" button не се показва:**
- Проверка: Отвори DevTools → Application → Manifest
- Трябва да няма грешки

**Push notifications не работят:**
- Check console за грешки
- Check VAPID keys в .env
- Check service worker registration
- Check permissions

**iOS push не работи:**
- Трябва HTTPS (production)
- Трябва iOS 16.4+
- Трябва add to home screen първо

---

**Status:** Кодът е готов! Следвай стъпките по-горе! 🎯

