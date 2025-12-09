#!/bin/bash

# XMRig Cleanup and Protection Script
# Използвай с: sudo bash cleanup-xmrig.sh

set -e

echo "🔍 Започвам почистване на XMRig..."

# Цветове за output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. СПИРАНЕ НА ВСИЧКИ XMRIG ПРОЦЕСИ
echo -e "${YELLOW}[1/8] Спирам всички XMRig процеси...${NC}"
pkill -9 xmrig 2>/dev/null || true
killall -9 xmrig 2>/dev/null || true
sleep 2

# Проверка дали все още има процеси
if pgrep -x xmrig > /dev/null; then
    echo -e "${RED}⚠️  Все още има XMRig процеси!${NC}"
    ps aux | grep xmrig | grep -v grep
    echo -e "${YELLOW}Опитвам се да ги спра принудително...${NC}"
    pkill -9 -f xmrig || true
    killall -9 -f xmrig || true
fi

# 2. ПРЕМАХВАНЕ НА ЗЛОНАМЕРОНИТЕ ФАЙЛОВЕ
echo -e "${YELLOW}[2/8] Премахвам злонамерени файлове...${NC}"

# Намиране и изтриване на всички xmrig файлове
find /var/www/html/bar-luna -type f -name "*xmrig*" -exec rm -f {} \; 2>/dev/null || true
find /var/www/html/bar-luna -type d -name "*xmrig*" -exec rm -rf {} \; 2>/dev/null || true
find /var/www/html/bar-luna -type d -name "build-new" -exec rm -rf {} \; 2>/dev/null || true

# Проверка за други локации
find /tmp -name "*xmrig*" -exec rm -rf {} \; 2>/dev/null || true
find /var/tmp -name "*xmrig*" -exec rm -rf {} \; 2>/dev/null || true
find /root -name "*xmrig*" -exec rm -rf {} \; 2>/dev/null || true
find /home -name "*xmrig*" -exec rm -rf {} \; 2>/dev/null || true

# 3. ПРЕМАХВАНЕ НА CRON JOBS
echo -e "${YELLOW}[3/8] Проверявам и премахвам злонамерени cron jobs...${NC}"

# Проверка на root crontab
if crontab -l -u root 2>/dev/null | grep -q "xmrig\|miner"; then
    echo -e "${RED}⚠️  Намерен злонамерен cron job в root crontab!${NC}"
    crontab -l -u root | grep -v "xmrig\|miner" | crontab -u root - || true
fi

# Проверка на системни crontab файлове
for cron_file in /etc/crontab /etc/cron.d/* /etc/cron.hourly/* /etc/cron.daily/* /etc/cron.weekly/* /etc/cron.monthly/*; do
    if [ -f "$cron_file" ] && grep -q "xmrig\|miner" "$cron_file" 2>/dev/null; then
        echo -e "${RED}⚠️  Намерен злонамерен cron в: $cron_file${NC}"
        sed -i '/xmrig\|miner/d' "$cron_file" 2>/dev/null || true
    fi
done

# Проверка на всички потребители
for user in $(cut -f1 -d: /etc/passwd); do
    if crontab -l -u "$user" 2>/dev/null | grep -q "xmrig\|miner"; then
        echo -e "${RED}⚠️  Намерен злонамерен cron job за потребител: $user${NC}"
        crontab -l -u "$user" 2>/dev/null | grep -v "xmrig\|miner" | crontab -u "$user" - || true
    fi
done

# 4. ПРЕМАХВАНЕ НА SYSTEMD SERVICES
echo -e "${YELLOW}[4/8] Проверявам и премахвам злонамерени systemd services...${NC}"

# Намиране на злонамерени services
for service in $(systemctl list-units --type=service --all --no-legend 2>/dev/null | awk '{print $1}' | grep -iE "xmrig|miner"); do
    echo -e "${RED}⚠️  Намерен злонамерен service: $service${NC}"
    systemctl stop "$service" 2>/dev/null || true
    systemctl disable "$service" 2>/dev/null || true
    rm -f "/etc/systemd/system/$service" 2>/dev/null || true
    rm -f "/etc/systemd/system/$service.service" 2>/dev/null || true
    rm -f "/usr/lib/systemd/system/$service" 2>/dev/null || true
    rm -f "/usr/lib/systemd/system/$service.service" 2>/dev/null || true
done

systemctl daemon-reload 2>/dev/null || true

# 5. ПРОВЕРКА ЗА BACKDOOR СКРИПТОВЕ
echo -e "${YELLOW}[5/8] Проверявам за backdoor скриптове...${NC}"

# Проверка за подозрителни скриптове в /var/www/html/bar-luna
find /var/www/html/bar-luna -type f \( -name "*.sh" -o -name "*.py" -o -name "*.php" \) -exec grep -l "xmrig\|miner\|stratum" {} \; 2>/dev/null | while read file; do
    echo -e "${RED}⚠️  Намерен подозрителен файл: $file${NC}"
    # Показвам съдържанието преди изтриване
    head -20 "$file" 2>/dev/null || true
    read -p "Изтривам ли този файл? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$file"
    fi
done

# 6. ПРОВЕРКА НА SSH AUTHORIZED_KEYS
echo -e "${YELLOW}[6/8] Проверявам SSH authorized_keys...${NC}"

for user in root $(cut -f1 -d: /etc/passwd | grep -v "nologin\|false"); do
    auth_file=$(eval echo ~$user)/.ssh/authorized_keys
    if [ -f "$auth_file" ]; then
        echo "Проверявам: $auth_file"
        # Показвам ключовете за преглед
        cat "$auth_file" | while read line; do
            if [ ! -z "$line" ]; then
                echo "  Key: ${line:0:50}..."
            fi
        done
    fi
done

# 7. СЪЗДАВАНЕ НА ЗАЩИТА СРЕЩУ ПОВТОРНО СЪЗДАВАНЕ
echo -e "${YELLOW}[7/8] Създавам защита срещу повторно създаване...${NC}"

# Създаване на защитени директории (които не могат да се изтрият лесно)
mkdir -p /var/www/html/bar-luna/xmrig-6.24.0 2>/dev/null || true
mkdir -p /var/www/html/bar-luna/build-new 2>/dev/null || true

# Създаване на защитени файлове (които блокират запис)
touch /var/www/html/bar-luna/xmrig-6.24.0/.lock 2>/dev/null || true
touch /var/www/html/bar-luna/build-new/.lock 2>/dev/null || true

# Настройване на права само за четене
chmod 555 /var/www/html/bar-luna/xmrig-6.24.0 2>/dev/null || true
chmod 555 /var/www/html/bar-luna/build-new 2>/dev/null || true
chattr +i /var/www/html/bar-luna/xmrig-6.24.0 2>/dev/null || true
chattr +i /var/www/html/bar-luna/build-new 2>/dev/null || true

# 8. СЪЗДАВАНЕ НА MONITORING СКРИПТ
echo -e "${YELLOW}[8/8] Създавам monitoring скрипт...${NC}"

cat > /usr/local/bin/xmrig-monitor.sh << 'EOF'
#!/bin/bash
# XMRig Monitor Script - Проверява за XMRig процеси всеки 30 секунди

while true; do
    if pgrep -x xmrig > /dev/null || pgrep -f "xmrig\|miner" > /dev/null; then
        echo "[$(date)] ⚠️  XMRig процес открит! Спирам..."
        pkill -9 -f xmrig || true
        killall -9 xmrig || true
        
        # Изтриване на файлове
        rm -rf /var/www/html/bar-luna/xmrig-* 2>/dev/null
        rm -rf /var/www/html/bar-luna/build-new 2>/dev/null
        
        # Логване
        echo "[$(date)] XMRig процес спрян" >> /var/log/xmrig-cleanup.log
    fi
    sleep 30
done
EOF

chmod +x /usr/local/bin/xmrig-monitor.sh

# Създаване на systemd service за monitoring
cat > /etc/systemd/system/xmrig-monitor.service << 'EOF'
[Unit]
Description=XMRig Monitor Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/xmrig-monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable xmrig-monitor.service
systemctl start xmrig-monitor.service

# ФИНАЛНА ПРОВЕРКА
echo ""
echo -e "${GREEN}✅ Почистването е завършено!${NC}"
echo ""
echo "Проверка на резултатите:"
echo "------------------------"

if pgrep -x xmrig > /dev/null; then
    echo -e "${RED}❌ Все още има XMRig процеси!${NC}"
    ps aux | grep xmrig | grep -v grep
else
    echo -e "${GREEN}✅ Няма активни XMRig процеси${NC}"
fi

echo ""
echo "Файлове в /var/www/html/bar-luna:"
ls -la /var/www/html/bar-luna/ | grep -E "xmrig|build-new" || echo "Няма намерени"

echo ""
echo -e "${GREEN}Monitoring service е стартиран и ще проверява всеки 30 секунди.${NC}"
echo "Логове: /var/log/xmrig-cleanup.log"
echo ""
echo -e "${YELLOW}ВАЖНО: Проверете логовете и cron jobs ръчно!${NC}"
echo "Команди за проверка:"
echo "  - ps aux | grep xmrig"
echo "  - crontab -l"
echo "  - systemctl status xmrig-monitor"
echo "  - tail -f /var/log/xmrig-cleanup.log"

