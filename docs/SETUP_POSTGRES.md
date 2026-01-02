# PostgreSQL Setup за Luna Bar

## 📋 Подготовка

### Проверка дали PostgreSQL е инсталиран

```powershell
psql --version
```

Ако виждате версия (напр. `psql (PostgreSQL) 16.x`), значи имате PostgreSQL.

Ако НЕ е инсталиран:
- Download от: https://www.postgresql.org/download/windows/
- Инсталирайте PostgreSQL 15 или 16
- **Запомнете password-а** който задавате за postgres user!

## 🗄️ Създаване на Database

### Опция 1: Чрез pgAdmin (GUI)

1. Отворете pgAdmin
2. Connect към PostgreSQL
3. Right-click на "Databases" → "Create" → "Database"
4. Name: `luna_bar`
5. Click "Save"

### Опция 2: Чрез команден ред (препоръчвам)

```powershell
# Влезте в PostgreSQL
psql -U postgres

# В PostgreSQL prompt създайте database
CREATE DATABASE luna_bar;

# Създайте user за приложението (optional, за по-добра security)
CREATE USER luna_user WITH PASSWORD 'your_secure_password';

# Дайте права на user-a
GRANT ALL PRIVILEGES ON DATABASE luna_bar TO luna_user;

# Излезте
\q
```

## 🔧 Environment Variables

Създайте файл `.env` в root на проекта:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/luna_bar"

# Ако създадохте custom user:
# DATABASE_URL="postgresql://luna_user:your_secure_password@localhost:5432/luna_bar"

# Pusher Configuration (за real-time notifications)
# Регистрирайте се на https://pusher.com (безплатно)
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Staff Auth Secret (генерирайте random string)
AUTH_SECRET=change-this-to-random-secure-string
```

### Как да генерирате AUTH_SECRET:

```powershell
# PowerShell команда за random string
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

## 📦 Pusher Setup (за real-time)

1. Отидете на https://pusher.com
2. Sign Up (безплатно)
3. Create new app:
   - Name: `luna-bar`
   - Cluster: `eu` (Europe)
   - Tech stack: `Next.js`
4. Копирайте credentials в `.env`

**Безплатен tier:** 200,000 messages/ден - **повече от достатъчно**

## 🚀 Prisma Migration

След като настроите `.env`, run:

```powershell
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed initial data (categories, tables)
npx prisma db seed
```

### Seed Script

Създайте `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed categories
  const categories = [
    { nameBg: 'Алкохол', nameEn: 'Alcohol', nameDe: 'Alkohol', slug: 'alcohol', order: 1 },
    { nameBg: 'Кафе Costa', nameEn: 'Costa Coffee', nameDe: 'Costa Kaffee', slug: 'costa-coffee', order: 2 },
    { nameBg: 'Кафе Richard', nameEn: 'Richard Coffee', nameDe: 'Richard Kaffee', slug: 'richard-coffee', order: 3 },
    { nameBg: 'Топли Напитки', nameEn: 'Hot Drinks', nameDe: 'Heiße Getränke', slug: 'hot-drinks', order: 4 },
    { nameBg: 'Студени Напитки', nameEn: 'Cold Drinks', nameDe: 'Kalte Getränke', slug: 'cold-drinks', order: 5 },
    { nameBg: 'Фреш', nameEn: 'Fresh Juices', nameDe: 'Frische Säfte', slug: 'fresh-juices', order: 6 },
    { nameBg: 'Безалкохолни', nameEn: 'Soft Drinks', nameDe: 'Erfrischungsgetränke', slug: 'soft-drinks', order: 7 },
    { nameBg: 'Лимонади', nameEn: 'Lemonades', nameDe: 'Limonaden', slug: 'lemonades', order: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Categories seeded');

  // Seed 30 tables
  for (let i = 1; i <= 30; i++) {
    const location = i <= 20 ? 'indoor' : i <= 25 ? 'terrace' : 'bar';
    await prisma.barTable.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        tableName: `Маса ${i}`,
        capacity: i <= 25 ? 4 : 2,
        location,
        qrCodeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/order?table=${i}`,
      },
    });
  }

  console.log('✅ Tables seeded (30 tables)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Добавете в `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

## ✅ Проверка

След migration, проверете:

```powershell
# Влезте в database
psql -U postgres -d luna_bar

# Проверете таблиците
\dt

# Трябва да видите:
# - categories
# - products
# - events
# - bar_tables
# - orders
# - order_items
# - waiter_calls
# - staff
# - hype_sync_log

# Проверете дали има categories
SELECT * FROM categories;

# Трябва да видите 8 категории

# Проверете маси
SELECT * FROM bar_tables;

# Трябва да видите 30 маси

# Излезте
\q
```

## 🎯 Готови!

След успешен setup:

```powershell
npm run dev
```

Отворете http://localhost:3000/bg

## 🔧 Troubleshooting

### "database does not exist"
```powershell
psql -U postgres
CREATE DATABASE luna_bar;
\q
```

### "password authentication failed"
- Проверете password-а в DATABASE_URL
- Проверете дали postgres service е running

### "relation does not exist"
```powershell
npx prisma migrate reset
npx prisma migrate dev
```

### Port 5432 is busy
```powershell
# Check if PostgreSQL is running
Get-Process postgres

# Restart PostgreSQL service
Restart-Service postgresql-x64-16
```

## 📚 Useful Commands

```powershell
# View Prisma Studio (DB GUI)
npx prisma studio

# Reset database (deletes all data!)
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name your_migration_name

# View DB in browser
npx prisma studio
# Open http://localhost:5555
```

---

**Ready to continue!** 🚀


