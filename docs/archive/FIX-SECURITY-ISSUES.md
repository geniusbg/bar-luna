# 🛡️ План за Поправка на Сигурността

## 📋 Резюме на Намерените Проблеми

### 🔴 КРИТИЧНИ ПРОБЛЕМИ (Поправи ВЕДНАГА)

1. **Hardcoded Fallback Secret**
   - **Файлове:** `app/api/auth/[...nextauth]/route.ts:73`, `middleware.ts:57`
   - **Проблем:** `'dev-secret-change-in-production'` като fallback
   - **Риск:** Пълна компрометация на аутентификацията

2. **Default Admin Credentials**
   - **Файл:** `prisma/seed.ts:17-18`
   - **Проблем:** `admin@lunabar.bg` / `admin123` по подразбиране
   - **Риск:** Директен достъп до администраторския панел

3. **Липса на Rate Limiting**
   - **Проблем:** Няма защита срещу brute force атаки
   - **Риск:** Безкрайни опити за влизане

---

## 🔧 СТЪПКИ ЗА ПОПРАВКА

### Стъпка 1: Премахни Fallback Secrets

**Файл:** `app/api/auth/[...nextauth]/route.ts`

**Преди:**
```typescript
secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
```

**След:**
```typescript
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error('NEXTAUTH_SECRET must be set in production environment');
}
secret: secret,
```

**Файл:** `middleware.ts`

**Преди:**
```typescript
secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
```

**След:**
```typescript
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error('NEXTAUTH_SECRET must be set in production environment');
}
secret: secret
```

---

### Стъпка 2: Регенерирай NEXTAUTH_SECRET

**На сървъра:**
```bash
# Генерирай нов secret
openssl rand -base64 32

# Или с Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Добави в `.env`:**
```env
NEXTAUTH_SECRET=твоят_нов_generated_secret_тук
```

**ВАЖНО:** След промяната на secret, всички активни сесии ще бъдат инвалидирани и потребителите ще трябва да се логнат отново.

---

### Стъпка 3: Смени Default Admin Credentials

**Вариант А: Смени паролата на съществуващия потребител**

```sql
-- Влез в PostgreSQL
psql -U postgres -d luna_bar

-- Генерирай нова парола hash (използвай Node.js)
-- node -e "const crypto=require('crypto');const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.pbkdf2Sync('нова_силна_парола',salt,10000,64,'sha512').toString('hex');console.log(salt+':'+hash)"

-- Обнови паролата
UPDATE "User" 
SET "password_hash" = 'нов_hash_тук' 
WHERE email = 'admin@lunabar.bg';
```

**Вариант Б: Изтрий и създай нов потребител**

```sql
-- Изтрий стария
DELETE FROM "User" WHERE email = 'admin@lunabar.bg';

-- Създай нов чрез seed с environment variables
ADMIN_EMAIL=нов_email@example.com ADMIN_PASSWORD=много_силна_парола npm run db:seed
```

**Вариант В: Промени seed файла да не използва defaults**

**Файл:** `prisma/seed.ts`

**Преди:**
```typescript
const adminEmail = process.env.ADMIN_EMAIL || 'admin@lunabar.bg';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
```

**След:**
```typescript
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
}
```

---

### Стъпка 4: Добави Rate Limiting

**Инсталирай пакета (ако не е инсталиран):**
```bash
npm install express-rate-limit
```

**Създай нов файл:** `lib/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минути
  max: 5, // 5 опита на 15 минути
  message: 'Твърде много опити за влизане. Моля опитайте след 15 минути.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минути
  max: 100, // 100 заявки на 15 минути
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Модифицирай:** `app/api/auth/[...nextauth]/route.ts`

```typescript
import { loginLimiter } from '@/lib/rate-limit';

// Добави middleware преди NextAuth handler
export async function POST(request: Request) {
  // Rate limiting ще се приложи автоматично
  return handler(request);
}
```

**Забележка:** NextAuth може да изисква специфична конфигурация за rate limiting. Провери документацията.

---

### Стъпка 5: Укрепете Deployment Process

**Файл:** `deploy-bar-luna.sh`

**Добави проверки:**
```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Проверка за .env файл
if [ ! -f ".env.bar-luna" ]; then
    echo "❌ Error: .env.bar-luna file not found!"
    exit 1
fi

# Проверка за задължителни environment variables
source .env.bar-luna
if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "change-this-to-random-secure-string" ]; then
    echo "❌ Error: NEXTAUTH_SECRET must be set and not use default value!"
    exit 1
fi

# Проверка за права на .env файла
if [ "$(stat -c %a .env.bar-luna 2>/dev/null || stat -f %A .env.bar-luna 2>/dev/null)" != "600" ]; then
    echo "⚠️  Warning: .env.bar-luna should have 600 permissions (read/write for owner only)"
fi

# Останалата част от скрипта...
```

---

### Стъпка 6: Проверка на Изложени Файлове

**Изпълни на сървъра:**
```bash
bash check-exposed-secrets.sh
```

**Проверка за .env файлове в git:**
```bash
cd /var/www/html/bar-luna
git log --all --full-history -p -- "*.env" ".env*" | grep -E "password|secret|key" | head -50
```

**Ако са намерени изложени секрети:**
1. Смени ВСИЧКИ секрети веднага
2. Помисли за ротация на всички пароли
3. Провери дали някой е използвал изложените секрети

---

### Стъпка 7: Укрепете SSH Достъпа

**Файл:** `/etc/ssh/sshd_config`

```bash
# Деактивирай root login
PermitRootLogin no

# Използвай само SSH ключове
PasswordAuthentication no
PubkeyAuthentication yes

# Промени порта (опционално)
Port 2222

# Ограничи достъпа до определени потребители
AllowUsers your_username

# Инсталирай fail2ban
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

**Рестартирай SSH:**
```bash
systemctl restart sshd
```

---

## ✅ ЧЕКЛИСТ ЗА ПОПРАВКА

- [ ] Премахнах fallback secrets от кода
- [ ] Регенерирах NEXTAUTH_SECRET
- [ ] Обнових .env файла с новия secret
- [ ] Смених default admin паролата
- [ ] Промених seed файла да не използва defaults
- [ ] Добавих rate limiting на login endpoint
- [ ] Укрепях deployment скрипта с проверки
- [ ] Проверих git историята за изложени секрети
- [ ] Укрепях SSH достъпа
- [ ] Инсталирах fail2ban
- [ ] Обнових всички зависимости
- [ ] Тествах че всичко работи след промените

---

## 🚨 СЛЕД ПОПРАВКИТЕ

1. **Тествай всичко** - Увери се че приложението работи правилно
2. **Мониторинг** - Следя за подозрителни активности
3. **Backup** - Направи backup преди големи промени
4. **Документирай** - Запиши какви промени са направени

---

## 📞 АКО ПРОБЛЕМЪТ ПРОДЪЛЖАВА

Ако след всички поправки проблемът продължава:

1. Провери за други backdoors
2. Провери за скрити процеси
3. Провери за други компрометирани потребители
4. Помисли за пълна реинсталация на сървъра

---

## 📚 ДОПЪЛНИТЕЛНИ РЕСУРСИ

- [NextAuth.js Security](https://next-auth.js.org/configuration/options#secret)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Rate Limiting](https://www.npmjs.com/package/express-rate-limit)

