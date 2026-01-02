# Как да проверя логовете

## PM2 Логове

```bash
# 1. Провери статуса
pm2 status

# 2. Виж последните 100 реда от логовете
pm2 logs bar-luna --lines 100

# 3. Виж реално време
pm2 logs bar-luna --raw

# 4. Провери директно лог файловете
tail -100 /var/www/html/bar-luna/logs/pm2-out.log
tail -100 /var/www/html/bar-luna/logs/pm2-error.log
tail -100 /var/www/html/bar-luna/logs/pm2-combined.log

# 5. Изчисти стари логове и провери отново
pm2 flush bar-luna
pm2 restart bar-luna
pm2 logs bar-luna --lines 50
```

## Apache Логове

```bash
# Error log
sudo tail -100 /var/log/apache2/bar-luna-ssl-error.log

# Access log
sudo tail -100 /var/log/apache2/bar-luna-ssl-access.log

# Общ Apache error log
sudo tail -100 /var/log/apache2/error.log
```

## Проверка дали приложението работи

```bash
# Провери дали слуша на порт 4000
netstat -tlnp | grep :4000

# Тест директно Next.js (би трябвало да върне 200)
curl -I http://127.0.0.1:4000/bg

# Тест през Apache
curl -I https://bar-luna.com/bg

# Провери response headers
curl -v https://bar-luna.com/bg 2>&1 | grep -i "location\|redirect"
```

## Ако все още няма логове

```bash
# 1. Убеди се че logs директорията съществува
mkdir -p /var/www/html/bar-luna/logs
chmod 755 /var/www/html/bar-luna/logs

# 2. Изтрий стария процес и стартирай отново
pm2 delete bar-luna
cd /var/www/html/bar-luna
pm2 start ecosystem.config.js

# 3. Провери веднага
pm2 logs bar-luna --lines 20
```

## Ако Next.js не извежда логове

Може да е нужно да добавиш console.log в кода за debugging:

```javascript
// В middleware или route handler
console.log('Request:', request.url);
console.log('Headers:', Object.fromEntries(request.headers));
```

