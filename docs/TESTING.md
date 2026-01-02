# 🧪 Luna Bar - Testing Guide

## ✅ Какво е завършено

Системата е напълно функционална! Ето какво може да тествате:

---

## 📱 1. QR Code System

### Test QR Generation:

1. Отидете на: http://localhost:3000/bg/admin/qr
2. Кликнете "Генерирай QR кодове"
3. Ще видите 30 QR card-а (по една за всяка маса)
4. Кликнете "🖨️ Принтирай всички"
5. Проверете print preview

**Резултат:** ✅ 30 QR кода за масите 1-30

---

## 🛒 2. Customer Ordering Flow

### Test като клиент:

**Стъпка 1: Scan QR Code (simulate)**
```
http://localhost:3000/order?table=5
```
Отворете този URL (symулира сканиране на QR на маса 5)

**Стъпка 2: Browse Menu**
- Виждате менюто с 17 test продукта
- Виждате цените (BGN/EUR toggle)
- Виждате категориите

**Стъпка 3: Add to Cart**
- Кликнете "+ Добави" на продукт
- Badge на "🛒 Количка" показва count
- Добавете още продукти

**Стъпка 4: View Cart**
- Кликнете "🛒 Количка"
- Modal се появява с вашата поръчка
- Можете да променяте количества (+/−)
- Виждате total

**Стъпка 5: Submit Order**
- Кликнете "✅ Изпрати поръчка"
- Получавате confirmation
- Количката се изчиства

**Резултат:** ✅ Поръчката е изпратена и записана в DB

---

## 🔔 3. Real-time Notifications (Staff)

### Test Real-time:

**Подготовка:**
1. Отворете 2 browser tabs:
   - Tab 1: http://localhost:3000/bg/staff (Staff Dashboard)
   - Tab 2: http://localhost:3000/order?table=7 (Customer view)

**Test нова поръчка:**

1. В Tab 2 (customer):
   - Добавете продукти в количка
   - Кликнете "Изпрати поръчка"

2. В Tab 1 (staff) - INSTANT:
   - 🔊 Чува се звук (ако има MP3 файл)
   - 🔴 Появява се notification popup
   - ✨ Нова order card се появява
   - 📊 Counter се update-ва

**БЕЗ REFRESH!** Всичко е автоматично!

**Резултат:** ✅ Real-time working!

---

## 🚨 4. Waiter Call System

### Test повикване:

**От Customer view:**
1. http://localhost:3000/order?table=5
2. Scroll down
3. Кликнете "🔔 Повикай сервитьор"
4. Изберете "Плащане с брой" или "Плащане с карта"

**Staff Dashboard реакция:**
- 🔊 Urgent звук (по-силен)
- 🚨 Червен notification popup
- 📱 Появява се в "Активни повиквания"
- Counter update

**Резултат:** ✅ Waiter call working!

---

## 📊 5. Staff Dashboard Functions

### Test order management:

**В Staff Dashboard:**

1. **View Active Orders**
   - Виждате всички pending/preparing/ready orders
   - Виждате детайли (маса, items, total)

2. **Update Order Status**
   - Кликнете "Приготвяме" → Order става "В процес"
   - Кликнете "Готова" → Order става зелена
   - Кликнете "Завърши" → Order изчезва от списъка

3. **Acknowledge Waiter Call**
   - Кликнете "Отивам" на waiter call
   - Call се маркира като acknowledged

**Резултат:** ✅ Order management working!

---

## 🌐 6. Multi-Language Test

### Test language switching:

1. http://localhost:3000/bg - Български
2. Click "EN" → http://localhost:3000/en - English
3. Click "DE" → http://localhost:3000/de - Deutsch

**Проверете:**
- Navigation labels update
- Product names update (ако има EN/DE данни)
- Prices остават същите

**Резултат:** ✅ Multi-language working!

---

## 💰 7. Currency Toggle Test

1. Отворете menu page
2. Кликнете "EUR" toggle
3. Всички цени се променят на евро
4. Refresh страницата → selection е запазен (localStorage)

**Резултат:** ✅ Currency toggle working!

---

## 📱 8. Responsive Design Test

### Test на mobile:

1. Press F12 → Toggle Device Toolbar
2. Select "iPhone 12 Pro" или друго mobile device
3. Тествайте:
   - Ordering flow
   - Cart modal
   - Call waiter buttons

**Резултат:** ✅ Mobile responsive!

---

## 🔄 9. Multiple Devices Test

### Test sync between devices:

**Подготовка:**
1. Desktop: http://localhost:3000/bg/staff
2. Mobile/Tablet: http://169.254.83.107:3000/bg/staff (network URL)

**Test:**
- Submit order от друг device
- И ДВАТА екрана update-ват едновременно!

**Резултат:** ✅ Multi-device sync working!

---

## 🎯 10. Full Flow End-to-End

### Complete scenario:

**1. Setup (Персонал):**
- Генерирайте QR кодове
- Принтирайте QR card за маса 5
- Отворете Staff Dashboard на компютър

**2. Customer Journey:**
- Клиент сканира QR на маса 5
- Browsе menu
- Добавя 2x Капучино, 1x Кока Кола
- Submits order

**3. Staff Response:**
- 🔊 Sound alert
- 🔔 Notification popup
- Виждат поръчката
- Click "Приготвяме"
- Click "Готова"

**4. Customer Finish:**
- Click "Повикай сервитьор"
- Select "Плащане с карта"

**5. Staff Payment:**
- 🚨 Urgent notification
- Waiter ходи с POS терминал
- Click "Отивам"

**Резултат:** ✅ Full flow working end-to-end!

---

## 🐛 Known Issues & Solutions

### Issue: Sound doesn't play

**Причина:** Browser autoplay policy  
**Решение:** 
- Кликнете веднъж на страницата първо
- Или добавете MP3 files в `public/sounds/`

### Issue: Notification not showing

**Причина:** Pusher credentials missing  
**Решение:**
- Check `.env` file има Pusher keys
- Check browser console за errors

### Issue: Order not appearing on staff dashboard

**Причина:** Pusher channel не е connected  
**Решение:**
- Check browser console: "Pusher: connected"
- Restart dev server
- Check Pusher dashboard за connections

---

## 📊 Performance Checklist

- [ ] Orders load in <1s
- [ ] Menu loads in <1s  
- [ ] Real-time notification appears in <1s
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Multi-device sync working

---

## 🎉 Production Ready Features

✅ **QR Ordering** - Fully functional  
✅ **Real-time** - Pusher working  
✅ **Multi-language** - BG/EN/DE  
✅ **Dual currency** - BGN/EUR  
✅ **Staff Dashboard** - Live updates  
✅ **Waiter Calls** - Urgent notifications  
✅ **Order Management** - Status workflow  
✅ **Responsive** - Desktop + Mobile  

---

## 🚀 Next: Add Sound Files

Download звукови файлове:

1. **new-order.mp3** - https://mixkit.co/free-sound-effects/bell/
2. **waiter-call.mp3** - https://mixkit.co/free-sound-effects/alert/

Place в `public/sounds/` директорията.

**Temporary:** Системата работи и без звуци, само визуални notifications.

---

## 📞 Ready for Production?

След тестване, follow `DEPLOYMENT.md` за production deployment!

**Всичко работи! 🎉**


