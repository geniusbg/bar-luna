# Production Deployment Guide - Luna Bar v2.2

## Sharp Library Removal

### ✅ Sharp е премахнат (v2.2+)

**Sharp вече НЕ се използва!** Кодът е преработен да използва чист SVG подход за генериране на QR кодове, което премахва нуждата от Sharp и native зависимости.

### Какво е променено?

- ✅ QR кодовете се генерират като SVG (не PNG)
- ✅ Композирането на текст и QR код е върху SVG ниво (не изображение)
- ✅ Няма нужда от Sharp, `canvas`, или други native модули
- ✅ По-лека и по-бърза инсталация
- ✅ Работи на всички платформи без специални настройки

---

## Deployment Steps for v2.2

### 1. Спри PM2 приложението
```bash
cd /var/www/html/bar-luna
pm2 stop bar-luna
```

### 2. Pull промените от Git
```bash
git fetch origin
git checkout luna-v2.2
git pull origin luna-v2.2
```

### 3. Инсталирай dependencies
```bash
npm install
```

### 4. Regenerate Prisma Client
```bash
npx prisma generate
```

### 5. Приложи database migrations
```bash
# Ако има нова миграция за QR settings
npx prisma migrate deploy
# или
npx prisma db push
```

### 6. Build приложението
```bash
npm run build
```

### 7. Стартирай PM2
```bash
pm2 start bar-luna
# или
pm2 restart bar-luna
```

### 8. Провери логовете
```bash
pm2 logs bar-luna
```

---

## New Features in v2.2

- ✅ QR настройки в база данни (глобални за всички)
- ✅ Бутон "Запази" вместо автоматично запазване
- ✅ Service Worker версия v3.3.14
- ✅ Футер "Реализирано от GSoft.bg" с SW версия
- ✅ NextAuth оптимизация (кеширане на сесия)
- ✅ Grid layout оптимизация (3 колони на ≥1536px)

---

## Troubleshooting

### Build Errors

Ако има проблеми при build:

1. Провери Node.js версията: `node -v` (трябва да е >= 18)
2. Премахни `node_modules` и `package-lock.json` и инсталирай отново:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Database Migration Issues

Ако има проблеми с миграциите:

```bash
# Провери статус на миграциите
npx prisma migrate status

# Приложи миграциите ръчно
psql -U postgres -d luna_bar -f prisma/migrations/add-qr-settings.sql
```

