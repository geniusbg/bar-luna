# ⚡ БЪРЗО! Завърши PWA Setup

**3 ЛЕСНИ СТЪПКИ** - 5 минути! 🚀

---

## Стъпка 1: Добави VAPID Keys

Отвори твоя **`.env`** файл и добави на края:

```env
# Web Push Notifications (GENERATED!)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOXaeCkYmxq8c8hQzTlVHifr2T-9d4P0vX4qOmHh-UkeaPW4AI3TEmPX8wb3Yq-Pb-fwC4twVFVdFqwfDEQscmc
VAPID_PRIVATE_KEY=WvLrf6l-c1znjagnpdAS5ADiCK-o6TQvAUEVvfQnfk8
```

**⚠️ COPY/PASTE ТОЧНО ТАКА!**

---

## Стъпка 2: Рестартирай Dev Server

В терминала:

```bash
# 1. Спри сървъра
Ctrl + C

# 2. Регенерирай Prisma + Стартирай
npx prisma generate && npm run dev
```

Изчакай да стартира (~30 секунди)

---

## Стъпка 3: Отвори Staff Dashboard

```
http://localhost:3000/bg/staff
```

**Ще видиш бутон:** "📱 Инсталирай App"

**Click го!** → App се инсталира

---

## 📱 ТЕСТ НА ТЕЛЕФОН (5 минути)

### Намери твоя IP:

**Windows:**
```bash
ipconfig
```
Търси "IPv4 Address" - примерно `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

### Отвори на телефон:

```
http://192.168.1.100:3000/bg/staff
```
(Замени с твоя IP!)

### Android (Chrome):
1. Ще видиш "Install" prompt или:
   - Menu → "Install app"
2. Click "Install"
3. Отвори "Luna Staff" от home screen
4. Click "🔔 Активирай Push Notifications"
5. Click "Allow"
6. Ще получиш test notification! ✅

### iOS (Safari):
1. Click Share button
2. "Add to Home Screen"
3. Отвори от home screen
4. Click "🔔 Активирай Push Notifications"
5. Click "Allow"

⚠️ **iOS limitation:** Push може да не работи на localhost. Работи на production с HTTPS!

---

## ✅ Тест на Notifications:

1. **Затвори app-a напълно** на телефона
2. От компютъра направи test поръчка:
   ```
   http://localhost:3000/order?table=5
   ```
3. Добави продукти, изпрати
4. **Телефонът трябва да получи notification!** 🔔

Дори когато app-ът е затворен! 🎉

---

## 🎨 Icons (Optional - може по-късно)

Засега има placeholder текстове вместо icons. Ако искаш да добавиш реални:

**Бърз вариант:**
1. Отиди на https://realfavicongenerator.net/
2. Upload Luna лого
3. Generate
4. Download zip
5. Копирай в `/public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `badge-72.png` (optional)

**Or:**
- Use Canva/Figma
- Create 192x192 purple icon with "L" and moon 🌙
- Export 3 sizes

---

## 🐛 Troubleshooting:

**"npx prisma generate" дава грешка:**
- Спри `npm run dev` първо (Ctrl+C)
- После run: `npx prisma generate`
- После: `npm run dev`

**Buttons не се показват:**
- Провери console за грешки
- Провери дали VAPID keys са в .env
- Hard refresh (Ctrl+Shift+R)

**Push не работи на iOS:**
- Нормално е на localhost
- Ще работи на production с HTTPS

---

## ✨ Готово!

След тези 3 стъпки:
- ✅ PWA може да се инсталира
- ✅ Push notifications работят
- ✅ Дори когато app е затворен
- ✅ На Android & iOS

**Време:** 5-10 минути setup

**Резултат:** Professional mobile app experience! 📱🎉

---

**Започни със Стъпка 1 сега!** 🚀

