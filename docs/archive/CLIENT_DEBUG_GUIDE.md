# Ръководство за debugging на проблеми при клиенти

## Когато клиент каже "Сайтът не работи"

### 1. Съберете информация:

**Попитайте клиента:**
- Какво точно виждат? (бял екран, грешка, зареждане без край?)
- Кога се е случило? (след update, след часове/дни?)
- Какво устройство? (iPhone 12, Samsung Galaxy, PC Windows?)
- Какъв browser? (Chrome, Safari, Firefox, в приложението на PWA?)
- Какво съобщение за грешка виждат?

### 2. Моментални решения за клиента:

#### A. Изчистване на кеша (iOS Safari):
1. Settings → Safari
2. Clear History and Website Data
3. Refresh страницата

#### B. Изчистване на кеша (Android Chrome):
1. Chrome → Settings → Privacy
2. Clear browsing data
3. Select "Cached images and files"
4. Refresh страницата

#### C. PWA приложение (iOS):
1. Изтрийте PWA приложението от Home Screen
2. Отворете Safari → bar-luna.com
3. Добавете отново към Home Screen

#### D. PWA приложение (Android):
1. Settings → Apps → Luna Bar
2. Storage → Clear Cache
3. ИЛИ: Uninstall и reinstall PWA

### 3. Technical debugging:

**Помолете клиента да ви изпрати screenshot на:**
1. Грешката (ако има текст)
2. Console (F12 → Console) - за технически грамотни клиенти

**Проверете на сървъра:**
```bash
# Apache error logs
sudo tail -100 /var/log/apache2/bar-luna-ssl-error.log

# PM2 logs
pm2 logs bar-luna --lines 100

# Проверете дали приложението работи
curl -I https://bar-luna.com/bg
```

### 4. Превантивни мерки:

#### A. Service Worker versioning:
- Увеличавайте SW версията при всяка промяна
- Текущата версия е видима в долния десен ъгъл (зелен кръг)

#### B. Monitoring:
- Следете PM2 restart count: `pm2 status`
- Следете Apache memory: `free -h`
- Следете disk space: `df -h`

#### C. Regular checks:
```bash
# Всеки ден:
pm2 status
pm2 logs bar-luna --lines 20

# Всяка седмица:
sudo systemctl status apache2
df -h
free -h
```

## Често срещани проблеми:

### Problem 1: "Server offline" modal не изчезва
**Причина:** Стар Service Worker
**Решение:** Clear cache + hard refresh (Ctrl+Shift+R)

### Problem 2: Сайтът не се зарежда след първо посещение
**Причина:** Service Worker кешира грешни данни
**Решение:** 
1. Увеличете SW версията
2. Клиентът трябва да изчисти кеша

### Problem 3: Google Maps не се зарежда
**Причина:** CSP/CORS в Apache конфига
**Решение:** Приложете новия Apache конфиг от bar-luna-le-ssl.conf

### Problem 4: Форми не работат (добавяне/редакция)
**Причина:** API routes кеширани или offline mode активен
**Решение:** Проверете connection + clear SW cache

### Problem 5: Старо съдържание (стари продукти/категории)
**Причина:** Browser cache или SW cache
**Решение:** Hard refresh (Ctrl+Shift+R)

## Emergency response:

### Ако нищо не работи:

**На сървъра:**
```bash
# 1. Restart приложението
pm2 restart bar-luna

# 2. Clear PM2 logs
pm2 flush

# 3. Restart Apache
sudo systemctl restart apache2

# 4. Check everything
pm2 status
sudo systemctl status apache2
curl -I https://bar-luna.com/bg

# 5. Ако все още не работи, проверете порта:
netstat -tlnp | grep :4000
```

**За клиентите:**
- Направете официално съобщение: "Извършваме технически поддръжка, моля опитайте отново след 5 минути"
- След fix: "Моля изчистете кеша на браузъра си"

## Полезни команди за debugging:

```bash
# Real-time logs
pm2 logs bar-luna --lines 100 --raw

# Check if server responds
curl -v https://bar-luna.com/bg

# Check SSL
openssl s_client -connect bar-luna.com:443 -servername bar-luna.com

# Check DNS
nslookup bar-luna.com

# Check Apache config
sudo apachectl -t

# Check disk space (може да запълни и crash-не)
df -h

# Check memory
free -h

# Check running processes
ps aux | grep node
```

## Контакт за спешни случаи:

Ако проблемът е критичен и не можете да го решите:
1. Restart PM2: `pm2 restart bar-luna`
2. Проверете logs: `pm2 logs bar-luna --lines 50`
3. Ако е DNS проблем - проверете Namecheap настройки
4. Ако е SSL проблем - проверете Let's Encrypt: `sudo certbot renew --dry-run`

