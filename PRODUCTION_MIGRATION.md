# Production Database Migration Guide

## Как да обновиш базата данни на production сървъра

### Стъпка 1: Спри приложението

```bash
# На production сървъра
cd /path/to/bar-luna
pm2 stop bar-luna
# или
pm2 restart bar-luna --update-env
```

### Стъпка 2: Pull промените от Git

```bash
git pull origin master
# или
git pull origin main
```

### Стъпка 3: Инсталирай dependencies (ако има нови)

```bash
npm install
```

### Стъпка 4: Приложи database миграцията

**Важно:** Трябва да имаш достъп като database owner или superuser.

#### Опция A: Ако имаш достъп като database owner

```bash
# Влез в базата данни
psql -h YOUR_DB_HOST -U YOUR_DB_OWNER -d qrmenu

# Изпълни миграцията
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id TEXT;
ALTER TABLE categories ADD CONSTRAINT categories_parent_category_id_fkey 
  FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS categories_parent_category_id_idx 
  ON categories(parent_category_id);

# Провери
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND column_name = 'parent_category_id';

# Излез
\q
```

#### Опция B: Ако трябва да направиш qrmenu user owner

```bash
# Влез като database owner
psql -h YOUR_DB_HOST -U YOUR_DB_OWNER -d qrmenu

# Направи qrmenu owner на базата
ALTER DATABASE qrmenu OWNER TO qrmenu;

# Направи qrmenu owner на всички таблици
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO qrmenu';
    END LOOP;
END $$;

# След това изпълни миграцията (от Опция A)
```

### Стъпка 5: Генерирай Prisma Client

```bash
npx prisma generate
```

### Стъпка 6: Build приложението

```bash
npm run build
```

### Стъпка 7: Стартирай приложението

```bash
pm2 start bar-luna
# или
pm2 restart bar-luna
```

### Стъпка 8: Провери логовете

```bash
pm2 logs bar-luna
```

---

## Проверка след миграцията

1. Отвори админ панела: `https://bar-luna.com/bg/admin/categories`
2. Провери дали можеш да създаваш категории с родител
3. Провери дали йерархията се показва правилно
4. Провери клиентското меню дали показва подкатегориите

---

## Допълнителни миграции

### Menu Settings (ако е нужно)

```sql
-- Влез в базата данни
psql -h YOUR_DB_HOST -U YOUR_DB_OWNER -d qrmenu

-- Създай таблица за menu settings
CREATE TABLE IF NOT EXISTS menu_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title_bg TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_de TEXT NOT NULL,
  subtitle_bg TEXT NOT NULL,
  subtitle_en TEXT NOT NULL,
  subtitle_de TEXT NOT NULL,
  background_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Вмъкни default настройки
INSERT INTO menu_settings (title_bg, title_en, title_de, subtitle_bg, subtitle_en, subtitle_de, background_image_url)
VALUES (
  '🍸 Нашето Меню',
  '🍸 Our Menu',
  '🍸 Unser Menü',
  'Открийте нашата селекция от напитки и деликатеси',
  'Discover our selection of drinks and delicacies',
  'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten',
  NULL
) ON CONFLICT DO NOTHING;
```

## Rollback (ако нещо се обърка)

Ако трябва да върнеш промените:

```sql
-- Влез в базата данни
psql -h YOUR_DB_HOST -U YOUR_DB_OWNER -d qrmenu

-- Премахни constraint и index
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_category_id_fkey;
DROP INDEX IF EXISTS categories_parent_category_id_idx;

-- Премахни колоната
ALTER TABLE categories DROP COLUMN IF EXISTS parent_category_id;

-- Премахни menu settings таблица (ако е нужно)
DROP TABLE IF EXISTS menu_settings;
```

---

## Важни бележки

- **Backup преди миграция:** Винаги направи backup на базата данни преди миграция
- **Maintenance mode:** Можеш да активираш maintenance mode по време на миграцията
- **Тествай на staging:** Ако имаш staging сървър, тествай там първо

