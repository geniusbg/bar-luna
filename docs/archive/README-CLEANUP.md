# XMRig Cleanup и Protection Скриптове

## 🚨 Ситуация
Сървърът ви е компрометиран и се изпълняват XMRig процеси за криптовалутен майнинг. Файловете се самосъздават, което означава че има автоматичен механизъм (cron job, systemd service, или backdoor).

## 📋 Стъпки за почистване

### Стъпка 1: Изтегли скриптовете на сървъра
```bash
# Качи файловете на сървъра или ги създай директно там
```

### Стъпка 2: Изпълни основния cleanup скрипт
```bash
chmod +x cleanup-xmrig.sh
sudo bash cleanup-xmrig.sh
```

Този скрипт ще:
- ✅ Спре всички XMRig процеси
- ✅ Изтрие злонамерените файлове
- ✅ Премахне злонамерените cron jobs
- ✅ Премахне злонамерените systemd services
- ✅ Провери за backdoor скриптове
- ✅ Създаде monitoring service

### Стъпка 3: Инсталирай защита
```bash
chmod +x block-xmrig.sh
sudo bash block-xmrig.sh
```

Този скрипт ще:
- ✅ Създаде immutable директории (не могат да се променят)
- ✅ Настрои firewall правила
- ✅ Създаде автоматичен cleanup cron (всеки 5 минути)
- ✅ Настрои Fail2Ban (ако е инсталиран)

## 🔍 Ръчна проверка

### Проверка за процеси
```bash
ps aux | grep xmrig
ps aux | grep miner
```

### Проверка за cron jobs
```bash
crontab -l
crontab -l -u root
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.hourly/
```

### Проверка за systemd services
```bash
systemctl list-units | grep -i xmrig
systemctl list-units | grep -i miner
```

### Проверка на логове
```bash
tail -f /var/log/xmrig-cleanup.log
journalctl -u xmrig-monitor -f
```

### Проверка на мрежови връзки
```bash
netstat -tulpn | grep xmrig
ss -tulpn | grep xmrig
```

## 🛡️ Допълнителни мерки за сигурност

### 1. Смени всички пароли
```bash
passwd root
# Смени паролите на всички потребители
```

### 2. Провери SSH ключовете
```bash
cat ~/.ssh/authorized_keys
cat /root/.ssh/authorized_keys
# Премахни подозрителните ключове
```

### 3. Обнови системата
```bash
apt update
apt upgrade
```

### 4. Инсталирай Fail2Ban (ако не е инсталиран)
```bash
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 5. Провери за подозрителни потребители
```bash
cat /etc/passwd
# Провери за неочаквани потребители
```

### 6. Провери за подозрителни процеси
```bash
top
htop
# Провери за процеси с високо CPU използване
```

## 🔄 Автоматичен Monitoring

След изпълнение на скриптовете, автоматично ще се изпълнява:

1. **Monitoring Service** - Проверява всеки 30 секунди за XMRig процеси
2. **Cleanup Cron** - Изчиства файлове всеки 5 минути
3. **Fail2Ban** - Блокира IP адреси при опит за изпълнение

## 📊 Проверка на статуса

```bash
# Проверка на monitoring service
systemctl status xmrig-monitor

# Проверка на логове
tail -f /var/log/xmrig-cleanup.log

# Проверка на immutable директории
lsattr /var/www/html/bar-luna/xmrig-6.24.0
lsattr /var/www/html/bar-luna/build-new
```

## ⚠️ ВАЖНО

1. **Провери как е станал компромисът** - Провери логове, SSH достъп, уязвимости в приложението
2. **Смени всички пароли и ключове**
3. **Обнови системата и приложението**
4. **Провери други сървъри** в мрежата
5. **Направи backup** преди по-големи промени

## 🆘 Ако проблемът продължава

Ако файловете продължават да се създават след изпълнение на скриптовете:

1. Провери за скрити процеси:
```bash
ps auxf | less
```

2. Провери за скрити systemd services:
```bash
systemctl list-units --all --type=service | grep -v "systemd\|dbus\|network"
```

3. Провери за подозрителни файлове в /tmp и /var/tmp:
```bash
find /tmp /var/tmp -type f -mtime -1 -ls
```

4. Провери за подозрителни network connections:
```bash
lsof -i -P -n | grep LISTEN
```

5. Провери за подозрителни файлове в /etc/init.d:
```bash
ls -la /etc/init.d/
```

