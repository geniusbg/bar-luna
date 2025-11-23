# Push Notifications - Multi-App Problem

## 🔴 Проблем

Ако двата аппа (luna и qrmenu) използват **СЪЩИТЕ VAPID keys**, браузърът разпознава subscription-а като валиден и за двата.

### Как работи Web Push:

1. **Subscription се създава** с VAPID public key
2. **Subscription се съхранява** в базата данни
3. **При изпращане на push** - използва се VAPID private key за подписване
4. **Браузърът валидира** нотификацията с VAPID public key

### Проблемът:

Ако двата аппа използват **СЪЩИТЕ VAPID keys**:
- Subscription-ът е валиден и за двата аппа
- Браузърът приема нотификацията дори ако е от друг апп
- Но subscriptions се съхраняват в различни бази → всеки апп изпраща само до своята база

## ✅ Решение

### Option 1: Различни VAPID Keys (Препоръчително)

Всеки апп трябва да има **собствени VAPID keys**:

**За luna:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=luna_public_key_here
VAPID_PRIVATE_KEY=luna_private_key_here
```

**За qrmenu:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=qrmenu_public_key_here
VAPID_PRIVATE_KEY=qrmenu_private_key_here
```

**Генериране на нови keys:**
```bash
npx web-push generate-vapid-keys
```

### Option 2: Филтриране по домейн (Алтернатива)

Добави проверка за домейн при изпращане на push:

```typescript
// В app/api/push/send/route.ts
const allowedDomains = process.env.ALLOWED_PUSH_DOMAINS?.split(',') || [];
const requestDomain = request.headers.get('host');

if (!allowedDomains.includes(requestDomain)) {
  return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
}
```

Но това не решава проблема напълно, защото subscription-ът все още е валиден и за двата аппа.

## 🔍 Как да провериш

1. **Провери VAPID keys в .env файловете:**
   ```bash
   # На luna сървъра
   grep VAPID /var/www/html/bar-luna/.env
   
   # На qrmenu сървъра
   grep VAPID /var/www/html/qrmenu/.env
   ```

2. **Ако са еднакви** → това е проблемът!

3. **Генерирай нови keys за qrmenu:**
   ```bash
   cd /var/www/html/qrmenu
   npx web-push generate-vapid-keys
   ```

4. **Обнови .env файла на qrmenu** с новите keys

5. **Рестартирай приложението:**
   ```bash
   pm2 restart qrmenu
   ```

## ⚠️ Важно

След промяна на VAPID keys:
- **Старите subscriptions няма да работят**
- **Клиентите трябва да се subscribe-нат отново**
- **Service Worker трябва да се обнови**

## 📝 Препоръка

**За production:** Всеки апп трябва да има собствени VAPID keys за:
- ✅ Изолиране на нотификациите
- ✅ По-добра сигурност
- ✅ Независимост между апповете

