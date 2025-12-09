# 🔍 Анализ на Компромис - XMRig Hack

## 📋 Резюме

Сървърът е компрометиран с XMRig майнинг софтуер. Файловете се самосъздават, което означава че има автоматичен механизъм (cron job, systemd service, или backdoor).

---

## 🚨 КРИТИЧНИ ПРОБЛЕМИ НАМЕРЕНИ В КОДА

### 1. ❌ **CRITICAL: Hardcoded Fallback Secret в Production**

**Файл:** `app/api/auth/[...nextauth]/route.ts:73`
```typescript
secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
```

**Файл:** `middleware.ts:57`
```typescript
secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
```

**Проблем:**
- Ако `NEXTAUTH_SECRET` не е зададен в `.env`, използва се известен fallback secret
- Това позволява на атакуващия да генерира валидни JWT токени
- Може да се логне като администратор без да знае паролата

**Риск:** 🔴 **КРИТИЧЕН** - Пълна компрометация на аутентификацията

---

### 2. ❌ **CRITICAL: Default Admin Credentials в Seed File**

**Файл:** `prisma/seed.ts:17-18`
```typescript
const adminEmail = process.env.ADMIN_EMAIL || 'admin@lunabar.bg';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
```

**Проблем:**
- Ако seed файлът се изпълни без environment variables, създава се администратор с известни credentials
- Email: `admin@lunabar.bg`
- Password: `admin123`
- Тези credentials са документирани в `USER_AUTH_SYSTEM.md`

**Риск:** 🔴 **КРИТИЧЕН** - Директен достъп до администраторския панел

---

### 3. ⚠️ **HIGH: Deployment Script копира .env от родителска директория**

**Файл:** `deploy-bar-luna.sh:19`
```bash
cp .env.bar-luna bar-luna/.env
```

**Проблем:**
- Скриптът копира `.env.bar-luna` от родителската директория
- Ако този файл е достъпен публично или е в git, всички секрети са изложени
- Няма проверка дали файлът съществува или дали има правилни права

**Риск:** 🟠 **ВИСОК** - Излагане на всички секрети

---

### 4. ⚠️ **HIGH: Липса на Rate Limiting**

**Проблем:**
- Няма rate limiting на login endpoint (`/api/auth/callback/credentials`)
- Няма rate limiting на API endpoints
- Безкрайни опити за brute force атаки са възможни

**Риск:** 🟠 **ВИСОК** - Brute force атаки на пароли

---

### 5. ⚠️ **MEDIUM: Слаби пароли по подразбиране**

**Проблем:**
- Default паролата `admin123` е много слаба
- Няма изисквания за сложност на паролите
- Потребителите могат да използват прости пароли

**Риск:** 🟡 **СРЕДЕН** - Лесни за brute force

---

### 6. ⚠️ **MEDIUM: Липса на Input Validation на някои места**

**Проблем:**
- Въпреки че има Zod validation, не всички endpoints го използват
- Някои API routes може да не валидират правилно входните данни

**Риск:** 🟡 **СРЕДЕН** - SQL Injection, XSS потенциал

---

## 🔍 ВЪЗМОЖНИ ТОЧКИ НА КОМПРОМИС

### Сценарий 1: Използване на Default Credentials ⭐ **НАЙ-ВЕРОЯТНО**

**Как става:**
1. Атакуващият открива че има Next.js приложение
2. Проверява за default admin credentials
3. Намира `admin@lunabar.bg` / `admin123` в seed файла или документацията
4. Логва се като администратор
5. Качва XMRig файлове чрез admin панела или API

**Доказателства:**
- Default credentials са документирани в `USER_AUTH_SYSTEM.md`
- Seed файлът създава тези credentials ако няма environment variables

**Вероятност:** 🔴 **90%**

---

### Сценарий 2: Използване на Fallback Secret

**Как става:**
1. Атакуващият открива че `NEXTAUTH_SECRET` не е зададен
2. Използва известния fallback secret `dev-secret-change-in-production`
3. Генерира валиден JWT token за администратор
4. Логва се без да знае паролата

**Доказателства:**
- Fallback secret е hardcoded в кода
- Лесно се вижда в source code

**Вероятност:** 🟠 **60%**

---

### Сценарий 3: Излагане на .env файл

**Как става:**
1. `.env.bar-luna` файлът е бил commit-нат в git по грешка
2. Или е достъпен чрез web server misconfiguration
3. Атакуващият получава достъп до всички секрети
4. Използва ги за достъп до базата данни или администраторския панел

**Доказателства:**
- Deployment скриптът копира `.env.bar-luna`
- Няма проверка дали файлът е в `.gitignore`

**Вероятност:** 🟡 **40%**

---

### Сценарий 4: Brute Force атака

**Как става:**
1. Атакуващият опитва много пароли
2. Няма rate limiting, така че може да опита безкрайно
3. Намира слаба парола или default credentials
4. Логва се и качва XMRig

**Доказателства:**
- Няма rate limiting в кода
- Слаби пароли по подразбиране

**Вероятност:** 🟡 **30%**

---

### Сценарий 5: Уязвимост в зависимост

**Как става:**
1. Стара версия на Next.js или друга зависимост има уязвимост
2. Атакуващият експлоатира уязвимостта
3. Получава remote code execution
4. Инсталира XMRig

**Доказателства:**
- Трябва да се провери `package.json` за стари версии

**Вероятност:** 🟡 **20%**

---

### Сценарий 6: SSH Compromise

**Как става:**
1. Слаба SSH парола или ключ
2. Атакуващият се логва директно на сървъра
3. Инсталира XMRig и настройва cron jobs

**Доказателства:**
- Трябва да се проверят SSH логове
- Проверка на `/var/log/auth.log`

**Вероятност:** 🟡 **25%**

---

## 🔧 КАК ДА ПРОВЕРИМ

### 1. Проверка на Git историята за .env файлове

```bash
# На сървъра
cd /var/www/html/bar-luna
git log --all --full-history --oneline -- "*.env" ".env*"
git log --all --full-history -p -- "*.env" ".env*" | head -200
```

### 2. Проверка на SSH логове

```bash
# Проверка за подозрителни входове
grep "Failed password" /var/log/auth.log | tail -100
grep "Accepted" /var/log/auth.log | tail -50
last
lastlog
```

### 3. Проверка на failed login attempts в приложението

```bash
# Проверка на application logs
pm2 logs bar-luna --lines 1000 | grep -i "login\|auth\|failed"
```

### 4. Проверка на кога е създаден XMRig

```bash
# Проверка на file timestamps
ls -la /var/www/html/bar-luna/xmrig-6.24.0/
stat /var/www/html/bar-luna/xmrig-6.24.0/xmrig
```

### 5. Проверка на кога е инсталиран cron job

```bash
# Проверка на cron history (ако е наличен)
grep -r "xmrig\|miner" /var/log/cron* 2>/dev/null
```

---

## 🛡️ НЕМЕДЛЕНИ ДЕЙСТВИЯ

### 1. ✅ Смени всички пароли
```bash
# На сървъра
passwd root
# Смени паролите на всички потребители
```

### 2. ✅ Регенерирай всички секрети
```bash
# Генерирай нов NEXTAUTH_SECRET
openssl rand -base64 32

# Генерирай нов PUSHER_SECRET (от Pusher dashboard)
# Генерирай нови VAPID keys
npx web-push generate-vapid-keys
```

### 3. ✅ Премахни fallback secrets от кода
- Премахни `|| 'dev-secret-change-in-production'` от кода
- Хвърли грешка ако secret не е зададен

### 4. ✅ Смени default admin credentials
- Ако seed файлът е бил изпълнен, смени паролата на admin@lunabar.bg
- Или изтрий потребителя и създай нов с силна парола

### 5. ✅ Добави rate limiting
- Инсталирай и настрой rate limiting на login endpoint
- Добави rate limiting на всички API endpoints

### 6. ✅ Провери за изложени .env файлове
```bash
# Проверка в git
git log --all --full-history --oneline -- "*.env"
git log --all --full-history -p -- "*.env" | grep -i "password\|secret\|key"

# Проверка дали .env е достъпен чрез web
curl https://your-domain.com/.env
curl https://your-domain.com/.env.bar-luna
```

### 7. ✅ Укрепете SSH
- Деактивирай root login: `PermitRootLogin no` в `/etc/ssh/sshd_config`
- Използвай SSH ключове вместо пароли
- Промени SSH порта от 22
- Инсталирай fail2ban

---

## 📊 ВЕРОЯТНОСТ ПО СЦЕНАРИЙ

| Сценарий | Вероятност | Риск | Действие |
|----------|------------|------|----------|
| Default Credentials | 🔴 90% | КРИТИЧЕН | Смени пароли, премахни defaults |
| Fallback Secret | 🟠 60% | КРИТИЧЕН | Премахни fallback, регенерирай secret |
| .env Exposure | 🟡 40% | ВИСОК | Провери git, укрепи права |
| Brute Force | 🟡 30% | СРЕДЕН | Добави rate limiting |
| SSH Compromise | 🟡 25% | ВИСОК | Укрепи SSH, провери логове |
| Dependency Vuln | 🟡 20% | СРЕДЕН | Обнови зависимости |

---

## ✅ ЗАКЛЮЧЕНИЕ

**Най-вероятната причина за компромиса:**
1. **Default admin credentials** (`admin@lunabar.bg` / `admin123`) са били използвани
2. Или **fallback secret** е бил използван за генериране на JWT токени
3. След това атакуващият е качил XMRig и е настроил автоматично изпълнение

**Препоръки:**
- Изпълни cleanup скриптовете
- Смени всички пароли и секрети
- Премахни fallback secrets от кода
- Добави rate limiting
- Укрепи SSH достъпа
- Провери git историята за изложени файлове

