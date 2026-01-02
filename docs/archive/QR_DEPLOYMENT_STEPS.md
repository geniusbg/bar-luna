# Production Deployment Guide

## Latest Updates (October 2025)

### Features Added:
1. ✅ Dynamic QR Redirect System with tracking
2. ✅ Full BG/EN/DE translations for Order & Call Waiter pages
3. ✅ Real-time sync for order/call status changes across devices
4. ✅ Mobile-optimized Staff Dashboard
5. ✅ Toast notifications instead of alerts
6. ✅ Favicon & PWA icon - circular logo

---

# QR Redirect System - Deployment Steps

## На Production сървъра изпълни следното:

### 1. Спри PM2 приложението
```bash
cd /var/www/html/bar-luna
pm2 stop bar-luna
```

### 2. Pull промените от Git
```bash
git pull
```

### 3. Инсталирай dependencies
```bash
npm install
```

### 4. Regenerate Prisma Client
```bash
npx prisma generate
```

### 5. Приложи database migration
```bash
node apply-qr-tracking-migration.js
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

## Какво прави новата система?

### Динамични QR кодове
- QR кодът води към `{домейн}/t/{номер}` (кратък линк)
- Кратият линк автоматично redirect-ва към URL-а който настроиш
- Можеш да сменяш URL-а без да принтираш нови QR кодове

### Tracking & Статистики
- Брои колко пъти е сканиран всеки QR код
- Показва кога е последното сканиране
- Можеш временно да деактивираш маси

### Управление
- Отиди на `/bg/admin/qr/redirects` за управление
- Там можеш да редактираш URL-ите и да виждаш статистики

---

## Други промени в това deployment:

1. ✅ **Toast import fix** - Поправен import в QR redirects страницата
2. ✅ **Staff Dashboard** - Показва дата/час на всички request-и
3. ✅ **Mobile категории** - Фиксиран vertical scrolling (само horizontal)
4. ✅ **PWA икона** - Променена от розово L на кръглото лого
5. ✅ **Favicon** - Променена на кръглото лого
6. ✅ **Главна страница** - "Предстоящи събития" сега е под "Какво предлагаме"

---

## Ако има проблеми:

### QR кодовете не работят
- Провери дали migration-а е приложен: `psql -U <user> -d <database> -c "SELECT * FROM bar_tables LIMIT 1;"`
- Трябва да виждаш `redirect_url`, `scan_count`, `last_scanned_at` колони

### Build грешки
- Изтрий `.next` папката: `rm -rf .next`
- Regenerate Prisma: `npx prisma generate`
- Build отново: `npm run build`

