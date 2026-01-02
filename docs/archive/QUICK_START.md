# 🚀 Luna Bar - Quick Start Guide

## 📦 Какво вече е направено

✅ **Миграция от Supabase към PostgreSQL + Prisma**  
✅ **Database Schema** - готова структура с 30 маси  
✅ **Prisma Client** - type-safe database access  
✅ **Pusher Setup** - real-time infrastructure  
✅ **Seed Data** - 8 категории + 30 маси  

## 🎯 Какво предстои

🔜 QR Code Generation  
🔜 Customer Ordering Pages  
🔜 Staff Dashboard  
🔜 Sound Notifications  

## ⚡ Setup (10 минути)

### 1️⃣ PostgreSQL Setup

**Проверете дали имате PostgreSQL:**
```powershell
psql --version
```

**Създайте database:**
```powershell
# Влезте в PostgreSQL
psql -U postgres

# Създайте database
CREATE DATABASE luna_bar;

# Излезте
\q
```

**Детайлни инструкции:** Вижте `POSTGRES_SETUP.md`

### 2️⃣ Pusher Setup (Real-time notifications)

1. Отворете https://pusher.com
2. Sign Up (безплатно - 200k messages/ден)
3. Create New App:
   - Name: `luna-bar`
   - Cluster: `eu` (Europe)
   - Tech: `Next.js`
4. Copy credentials (ще ги използваме в стъпка 3)

### 3️⃣ Environment Variables

**Копирайте template:**
```powershell
copy env.example .env
```

**Редактирайте `.env`:**
```env
# PostgreSQL (ВАЖНО: сменете password-а!)
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/luna_bar"

# Pusher (от стъпка 2)
PUSHER_APP_ID=12345
NEXT_PUBLIC_PUSHER_KEY=xxxxxxxxxxxxx
PUSHER_SECRET=xxxxxxxxxxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth Secret (генерирайте random string)
AUTH_SECRET=your-random-secure-string-here
```

**Генериране на AUTH_SECRET:**
```powershell
# PowerShell команда
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### 4️⃣ Database Migration

```powershell
# Generate Prisma Client
npm run db:generate

# Run migrations (създава таблиците)
npm run db:migrate

# Seed initial data (категории + 30 маси)
npm run db:seed
```

**Очакван output:**
```
✅ Categories seeded (8 categories)
✅ Tables seeded (30 tables)
   - Indoor: Tables 1-20
   - Terrace: Tables 21-25
   - Bar: Tables 26-30
🎉 Seeding completed!
```

### 5️⃣ Start Development Server

```powershell
npm run dev
```

Отворете: http://localhost:3000/bg

## 🎨 Вижте Данните (Optional)

```powershell
npm run db:studio
```

Отворете: http://localhost:5555  
→ GUI за разглеждане на базата данни

## ✅ Проверка

След setup, проверете:

- [ ] Dev server работи на http://localhost:3000
- [ ] Виждате home page на български
- [ ] Menu page зарежда (дори без продукти)
- [ ] Prisma Studio показва 8 категории
- [ ] Prisma Studio показва 30 маси

## 📁 Нова структура на проекта

```
luna/
├── prisma/
│   ├── schema.prisma     ← Database schema
│   └── seed.ts           ← Initial data
│
├── lib/
│   ├── prisma.ts         ← Database client (замества supabase.ts)
│   ├── pusher-server.ts  ← Real-time server
│   └── pusher-client.ts  ← Real-time client
│
├── app/
│   ├── [locale]/         ← Existing pages
│   └── api/              ← Ще обновим API routes
│
├── .env                  ← Вашите credentials (НЕ commit-вайте!)
├── env.example           ← Template
└── POSTGRES_SETUP.md     ← Детайлна PostgreSQL документация
```

## 🔜 Следващи стъпки

След успешен setup, ще продължим с:

1. **QR Code Generation** - Генериране на QR кодове за 30-те маси
2. **Customer Ordering** - `/order?table=5` flow
3. **Staff Dashboard** - Real-time notifications със звук
4. **Waiter Calls** - Повикване на сервитьор

## ⚠️ Важни бележки

### За старите файлове:
- ❌ **lib/supabase.ts** - премахнат
- ❌ **supabase/** директория - вече не се използва
- ✅ Всички API routes ще update-нем да използват Prisma

### За images:
- Временно: URL-и към външни снимки
- След това: Local upload в `public/uploads/`

### За production:
- PostgreSQL: Railway ($5/мес) или Supabase (само DB, без auth/storage)
- Pusher: Free tier е достатъчен
- Hosting: Vercel free tier

## 🐛 Troubleshooting

### "relation does not exist"
```powershell
npm run db:migrate
```

### "password authentication failed"
Проверете DATABASE_URL в `.env` - password трябва да съвпада с PostgreSQL password-а

### Pusher errors
Проверете дали credentials в `.env` са правилни

### Build errors
```powershell
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Готови?

След като всичко work-ва, дайте знак и продължаваме с ordering system-а! 🚀

---

**Status:** ✅ PostgreSQL Setup Ready  
**Next:** 🔜 Customer Ordering Flow Implementation


