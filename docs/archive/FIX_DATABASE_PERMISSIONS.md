# 🔧 Fix PostgreSQL Permissions Error

## Проблем:
```
Error: ERROR: permission denied for schema public
```

## Решение:

### Вариант 1: Дайте права на потребителя (Препоръчително)

Влезте в PostgreSQL като superuser (обикновено `postgres`):

```bash
sudo -u postgres psql
```

Или ако имате достъп:

```bash
psql -U postgres -d qrmenu
```

След това изпълнете:

```sql
-- Проверете текущия потребител
SELECT current_user;

-- Дайте права на потребителя за schema public
GRANT ALL ON SCHEMA public TO ваш_потребител;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ваш_потребител;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ваш_потребител;

-- За бъдещи таблици
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ваш_потребител;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ваш_потребител;

-- Ако потребителят е в DATABASE_URL (обикновено postgres)
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
```

### Вариант 2: Използвайте superuser за миграции

Временно променете `DATABASE_URL` в `.env` да използва superuser:

```env
DATABASE_URL="postgresql://postgres:superuser_password@127.0.0.1:5432/qrmenu"
```

След това:

```bash
npx prisma db push
```

**ВАЖНО:** След миграцията, върнете оригиналния `DATABASE_URL`!

### Вариант 3: Създайте таблицата ръчно

Ако не можете да дадете права, създайте таблицата ръчно:

```sql
CREATE TABLE IF NOT EXISTS public.pending_order_approvals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT UNIQUE NOT NULL,
    table_number INTEGER NOT NULL,
    order_count INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'rate_limit_exceeded',
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pending_approvals_status_requested 
ON public.pending_order_approvals(status, requested_at);
```

### Проверка:

След като оправите permissions, проверете:

```bash
npx prisma db push
```

Трябва да видите:
```
✔ Your database is now in sync with your Prisma schema.
```

