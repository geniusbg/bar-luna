#!/bin/bash

# XMRig Blocker Script - Блокира достъпа до директории и процеси
# Използвай с: sudo bash block-xmrig.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔒 Инсталирам защита срещу XMRig...${NC}"

# 1. СЪЗДАВАНЕ НА IMMUTABLE ДИРЕКТОРИИ (не могат да се променят)
echo -e "${YELLOW}[1/5] Създавам защитени директории...${NC}"

# Изтриване на старите директории
rm -rf /var/www/html/bar-luna/xmrig-6.24.0 2>/dev/null || true
rm -rf /var/www/html/bar-luna/build-new 2>/dev/null || true

# Създаване на нови празни директории
mkdir -p /var/www/html/bar-luna/xmrig-6.24.0
mkdir -p /var/www/html/bar-luna/build-new

# Създаване на .lock файлове
touch /var/www/html/bar-luna/xmrig-6.24.0/.lock
touch /var/www/html/bar-luna/build-new/.lock

# Настройване на права - само root може да пише
chown root:root /var/www/html/bar-luna/xmrig-6.24.0
chown root:root /var/www/html/bar-luna/build-new
chmod 555 /var/www/html/bar-luna/xmrig-6.24.0
chmod 555 /var/www/html/bar-luna/build-new

# Правене на директориите immutable (не могат да се променят)
chattr +i /var/www/html/bar-luna/xmrig-6.24.0 2>/dev/null || echo "chattr не е наличен, пропускам..."
chattr +i /var/www/html/bar-luna/build-new 2>/dev/null || echo "chattr не е наличен, пропускам..."

# 2. СЪЗДАВАНЕ НА IPTABLES ПРАВИЛА (блокиране на mining pool връзки)
echo -e "${YELLOW}[2/5] Създавам firewall правила...${NC}"

# Блокиране на известни mining pool адреси
KNOWN_POOLS=(
    "66.32.214.131"
    "auto.c3pool.org"
    "c3pool.org"
    "moneroocean.stream"
    "supportxmr.com"
    "minexmr.com"
)

for pool in "${KNOWN_POOLS[@]}"; do
    # Блокиране на изходящи връзки към mining pools
    iptables -A OUTPUT -d "$pool" -j DROP 2>/dev/null || true
    iptables -A OUTPUT -d "$pool" -p tcp --dport 3333 -j DROP 2>/dev/null || true
    iptables -A OUTPUT -d "$pool" -p tcp --dport 4444 -j DROP 2>/dev/null || true
    iptables -A OUTPUT -d "$pool" -p tcp --dport 8080 -j DROP 2>/dev/null || true
done

# Запазване на правилата
if command -v iptables-save &> /dev/null; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
fi

# 3. СЪЗДАВАНЕ НА FAIL2BAN ФИЛТЪР
echo -e "${YELLOW}[3/5] Създавам Fail2Ban филтър...${NC}"

if command -v fail2ban-client &> /dev/null; then
    cat > /etc/fail2ban/filter.d/xmrig.conf << 'EOF'
[Definition]
failregex = ^.*xmrig.*$
            ^.*miner.*$
ignoreregex =
EOF

    cat > /etc/fail2ban/jail.d/xmrig.conf << 'EOF'
[xmrig]
enabled = true
port = all
filter = xmrig
logpath = /var/log/xmrig-cleanup.log
maxretry = 1
bantime = 86400
findtime = 60
EOF

    systemctl restart fail2ban 2>/dev/null || true
fi

# 4. СЪЗДАВАНЕ НА AUDIT RULES (следене на достъп до директории)
echo -e "${YELLOW}[4/5] Създавам audit rules...${NC}"

if command -v auditctl &> /dev/null; then
    # Следене на достъп до xmrig директории
    auditctl -w /var/www/html/bar-luna/xmrig-6.24.0 -p wa -k xmrig_access 2>/dev/null || true
    auditctl -w /var/www/html/bar-luna/build-new -p wa -k xmrig_access 2>/dev/null || true
    
    # Следене на изпълнение на xmrig
    auditctl -a always,exit -F path=/var/www/html/bar-luna -F perm=x -k xmrig_exec 2>/dev/null || true
fi

# 5. СЪЗДАВАНЕ НА АВТОМАТИЧЕН CLEANUP CRON
echo -e "${YELLOW}[5/5] Създавам автоматичен cleanup cron...${NC}"

# Премахване на стари xmrig cron jobs
crontab -l 2>/dev/null | grep -v "xmrig\|miner" | crontab - 2>/dev/null || true

# Добавяне на нов защитен cron job
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/xmrig-cleanup-cron.sh") | crontab -

# Създаване на cron cleanup скрипт
cat > /usr/local/bin/xmrig-cleanup-cron.sh << 'EOF'
#!/bin/bash
# Автоматичен cleanup скрипт - изпълнява се всеки 5 минути

LOG_FILE="/var/log/xmrig-cleanup.log"

# Проверка за процеси
if pgrep -x xmrig > /dev/null || pgrep -f "xmrig\|miner" > /dev/null; then
    echo "[$(date)] XMRig процес открит - спирам..." >> "$LOG_FILE"
    pkill -9 -f xmrig 2>/dev/null || true
    killall -9 xmrig 2>/dev/null || true
fi

# Проверка за файлове в защитените директории
if [ "$(ls -A /var/www/html/bar-luna/xmrig-6.24.0/ 2>/dev/null | grep -v '^\.lock$')" ]; then
    echo "[$(date)] Файлове в xmrig-6.24.0 - изтривам..." >> "$LOG_FILE"
    find /var/www/html/bar-luna/xmrig-6.24.0/ -type f ! -name '.lock' -delete 2>/dev/null || true
fi

if [ "$(ls -A /var/www/html/bar-luna/build-new/ 2>/dev/null | grep -v '^\.lock$')" ]; then
    echo "[$(date)] Файлове в build-new - изтривам..." >> "$LOG_FILE"
    find /var/www/html/bar-luna/build-new/ -type f ! -name '.lock' -delete 2>/dev/null || true
fi

# Проверка за нови cron jobs
if crontab -l 2>/dev/null | grep -q "xmrig\|miner"; then
    echo "[$(date)] Злонамерен cron job открит - премахвам..." >> "$LOG_FILE"
    crontab -l 2>/dev/null | grep -v "xmrig\|miner" | crontab - 2>/dev/null || true
fi
EOF

chmod +x /usr/local/bin/xmrig-cleanup-cron.sh

echo ""
echo -e "${GREEN}✅ Защитата е инсталирана!${NC}"
echo ""
echo "Инсталирани защити:"
echo "  ✅ Immutable директории (не могат да се променят)"
echo "  ✅ Firewall правила (блокиране на mining pools)"
echo "  ✅ Fail2Ban филтър (ако е инсталиран)"
echo "  ✅ Audit rules (ако е инсталиран)"
echo "  ✅ Автоматичен cleanup cron (всеки 5 минути)"
echo ""
echo "Проверка:"
echo "  - tail -f /var/log/xmrig-cleanup.log"
echo "  - crontab -l"
echo "  - lsattr /var/www/html/bar-luna/xmrig-6.24.0"

