# 🚀 Pusher Setup Guide - Стъпка по стъпка

## ✅ Вие направихте: Регистрация в Pusher

## 📋 Следващи стъпки:

### 1️⃣ Изберете продукт

В Pusher dashboard виждате 2 опции:

- **Channels** ← ✅ ИЗБЕРЕТЕ ТОВА!
- ~~Beams~~ ← ❌ НЕ това (за mobile push)

Кликнете **"Get started"** под **Channels**

---

### 2️⃣ Създайте Channels App

Ще видите форма:

```
┌─────────────────────────────────────┐
│ Name your Channels app              │
│ ┌─────────────────────────────────┐ │
│ │ luna-bar                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Select a cluster                    │
│ ○ us-east-1                         │
│ ● eu (Europe)  ← ИЗБЕРЕТЕ ТОВА     │
│ ○ ap-southeast-1                    │
│                                     │
│ [Create app]                        │
└─────────────────────────────────────┘
```

**Попълнете:**
- Name: `luna-bar`
- Cluster: `eu` (най-близко до България)

**Кликнете "Create app"**

---

### 3️⃣ Копирайте App Keys

След създаването:

1. Отидете на таб **"App Keys"** (горе)
2. Ще видите credentials:

```
┌────────────────────────────────────────────┐
│ App Credentials                            │
├────────────────────────────────────────────┤
│ app_id       1234567                       │
│ key          abcdef123456789               │
│ secret       xyz987654321                  │
│ cluster      eu                            │
└────────────────────────────────────────────┘
```

**КОПИРАЙТЕ ВСИЧКИ 4 СТОЙНОСТИ!**

---

### 4️⃣ Създайте .env.local файл

В Luna проект root директория:

**Windows PowerShell:**
```powershell
# Копирайте template
copy env.example .env.local

# Или създайте нов файл
notepad .env.local
```

**Или с VS Code:**
```
File → New File → Save as ".env.local"
```

---

### 5️⃣ Попълнете .env.local

Отворете `.env.local` и добавете:

```env
# PostgreSQL Database
# ВАЖНО: Сменете YOUR_PASSWORD с вашата PostgreSQL парола!
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/luna_bar"

# Pusher Channels - КОПИРАЙТЕ ОТ PUSHER DASHBOARD
PUSHER_APP_ID="1234567"                    # ← вашият app_id
NEXT_PUBLIC_PUSHER_KEY="abcdef123456789"   # ← вашият key
PUSHER_SECRET="xyz987654321"               # ← вашият secret
NEXT_PUBLIC_PUSHER_CLUSTER="eu"            # ← cluster (eu)

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth Secret - генерирайте random string
AUTH_SECRET="change-this-to-random-secure-string"
```

---

### 6️⃣ Генерирайте AUTH_SECRET

**PowerShell команда:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

Копирайте output-а и сложете в AUTH_SECRET

**Или просто:**
```
AUTH_SECRET="luna_bar_super_secret_key_2024_xyz123"
```

---

### 7️⃣ Проверка на .env.local

Вашият `.env.local` трябва да изглежда така:

```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/luna_bar"
PUSHER_APP_ID="1839284"
NEXT_PUBLIC_PUSHER_KEY="a1b2c3d4e5f6g7h8i9j0"
PUSHER_SECRET="x9y8z7w6v5u4t3s2r1q0"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="MySecureRandomString2024XYZ"
```

**⚠️ ВАЖНО:**
- ❌ НЕ commit-вайте .env.local в Git!
- ❌ НЕ споделяйте PUSHER_SECRET публично!
- ✅ Проверете че имате `.env.local` в `.gitignore`

---

## ✅ Готово! Pusher е configured

### Следващо: Database Setup

```powershell
# 1. Стартирайте PostgreSQL
# 2. Създайте database
psql -U postgres
CREATE DATABASE luna_bar;
\q

# 3. Run Prisma migrations
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start dev server
npm run dev
```

---

## 🧪 Тестване на Pusher връзката

След като стартирате `npm run dev`, отворете browser console (F12) и въведете:

```javascript
// Test Pusher connection
const pusher = new Pusher('YOUR_KEY_HERE', { cluster: 'eu' });
const channel = pusher.subscribe('test-channel');
channel.bind('test-event', (data) => {
  console.log('✅ Pusher works!', data);
});
```

В друг таб на browser-а:

```javascript
// Send test message (от Pusher dashboard Debug Console)
```

Ако видите "✅ Pusher works!" - всичко работи!

---

## 🎯 Pusher Dashboard Features

### 1. Debug Console
- Виждате live events
- Можете да тествате изпращане на messages

### 2. Metrics
- Колко connections
- Колко messages
- Usage statistics

### 3. Event Creator
- Можете ръчно да trigger-нете events за testing

---

## 📊 Free Tier Limits

Вашият Sandbox plan включва:

✅ **200,000 messages/ден**
✅ **100 concurrent connections**
✅ **Unlimited channels**
✅ **SSL encryption**

За Luna Bar (30 маси):
- ~150-300 messages/ден = 0.15% usage
- ~5-10 concurrent connections = 10% usage

**Повече от достатъчно!** 🎉

---

## ❓ Troubleshooting

### "Connection failed"
- Проверете `NEXT_PUBLIC_PUSHER_KEY` в .env.local
- Cluster трябва да е 'eu'

### "401 Unauthorized"
- Проверете `PUSHER_SECRET` (за server-side)

### "env variable is undefined"
- Restart dev server след промяна на .env.local
- Проверете че е `.env.local` (не `.env`)

---

## 🚀 Ready to Continue?

След като setup-нете `.env.local`:

1. ✅ Pusher credentials добавени
2. ✅ PostgreSQL password в DATABASE_URL
3. ✅ AUTH_SECRET генериран

**Продължаваме с database migration и ordering system!** 🎉

---

## 📞 Need Help?

Ако нещо не работи:
1. Проверете `.env.local` синтаксис
2. Restart dev server
3. Check Pusher dashboard за connection status
4. Питайте ме! 😊


