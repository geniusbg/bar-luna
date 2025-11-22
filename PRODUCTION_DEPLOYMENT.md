# Production Deployment Guide - Luna Bar v2.2

## Sharp Library Issue on Linux Production Server

### Problem
```
Error: Could not load the "sharp" module using the linux-x64 runtime
Unsupported CPU: Prebuilt binaries for linux-x64 require v2 microarchitecture
```

### Solution

На production сървъра изпълни следните команди:

```bash
cd /var/www/html/bar-luna

# Премахни sharp и node_modules
npm uninstall sharp
rm -rf node_modules package-lock.json

# Инсталирай sharp с опционалните зависимости за Linux
npm install --include=optional sharp

# Или използвай platform-specific инсталация
npm install --os=linux --cpu=x64 sharp

# Инсталирай всички зависимости отново
npm install

# Regenerate Prisma Client
npx prisma generate

# Rebuild приложението
npm run build

# Restart PM2
pm2 restart bar-luna
```

### Alternative: Force Reinstall Sharp

Ако горните команди не работят, опитай:

```bash
cd /var/www/html/bar-luna

# Премахни sharp
npm uninstall sharp
rm -rf node_modules/.sharp

# Инсталирай sharp с force
npm install sharp --force

# Rebuild
npm run build
pm2 restart bar-luna
```

### Verify Installation

Провери дали sharp е правилно инсталиран:

```bash
node -e "console.log(require('sharp').versions)"
```

Трябва да видиш версиите на sharp и неговите зависимости.

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

### 3. Инсталирай dependencies (с Sharp fix)
```bash
npm install --include=optional sharp
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

### Sharp не работи след rebuild

Ако проблемът с sharp продължава:

1. Провери Node.js версията: `node -v` (трябва да е >= 18)
2. Провери архитектурата: `uname -m` (трябва да е x64)
3. Използвай Docker или правилната Node.js версия

### Database Migration Issues

Ако има проблеми с миграциите:

```bash
# Провери статус на миграциите
npx prisma migrate status

# Приложи миграциите ръчно
psql -U postgres -d luna_bar -f prisma/migrations/add-qr-settings.sql
```

