#!/bin/bash

# Скрипт за проверка на изложени секрети в Git историята
# Използвай: bash check-exposed-secrets.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Проверявам Git историята за изложени секрети...${NC}"
echo ""

# 1. Проверка за .env файлове в git историята
echo -e "${YELLOW}[1/5] Проверка за .env файлове в Git историята...${NC}"
ENV_FILES=$(git log --all --full-history --name-only --pretty=format: -- "*.env" ".env*" 2>/dev/null | grep -v "^$" | sort -u)

if [ -z "$ENV_FILES" ]; then
    echo -e "${GREEN}✅ Няма .env файлове в Git историята${NC}"
else
    echo -e "${RED}⚠️  Намерени .env файлове в Git историята:${NC}"
    echo "$ENV_FILES"
    echo ""
    echo "Проверявам съдържанието..."
    for file in $ENV_FILES; do
        echo -e "${YELLOW}Файл: $file${NC}"
        git log --all --full-history -p -- "$file" | grep -E "password|secret|key|token" | head -20 || true
        echo ""
    done
fi

echo ""

# 2. Проверка за commit-нати пароли и секрети
echo -e "${YELLOW}[2/5] Проверка за commit-нати пароли и секрети...${NC}"
SENSITIVE_DATA=$(git log --all --full-history -p | grep -iE "password\s*=|secret\s*=|api[_-]?key\s*=|token\s*=" | grep -v "your_password\|your_secret\|change-this" | head -50)

if [ -z "$SENSITIVE_DATA" ]; then
    echo -e "${GREEN}✅ Няма намерени реални пароли/секрети в Git историята${NC}"
else
    echo -e "${RED}⚠️  Намерени потенциално изложени секрети:${NC}"
    echo "$SENSITIVE_DATA" | head -20
fi

echo ""

# 3. Проверка за hardcoded credentials в текущия код
echo -e "${YELLOW}[3/5] Проверка за hardcoded credentials в текущия код...${NC}"

# Проверка за известни default credentials
if grep -r "admin@lunabar.bg" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "USER_AUTH_SYSTEM.md" | grep -v "SECURITY" > /dev/null; then
    echo -e "${RED}⚠️  Намерени hardcoded admin credentials в кода:${NC}"
    grep -r "admin@lunabar.bg" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "USER_AUTH_SYSTEM.md" | grep -v "SECURITY" || true
else
    echo -e "${GREEN}✅ Няма hardcoded admin credentials в кода${NC}"
fi

# Проверка за fallback secrets
if grep -r "dev-secret-change-in-production" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "SECURITY" > /dev/null; then
    echo -e "${RED}⚠️  Намерени fallback secrets в кода:${NC}"
    grep -r "dev-secret-change-in-production" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "SECURITY" || true
else
    echo -e "${GREEN}✅ Няма fallback secrets в кода${NC}"
fi

echo ""

# 4. Проверка на .gitignore
echo -e "${YELLOW}[4/5] Проверка на .gitignore...${NC}"
if grep -q "\.env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .env файлове са в .gitignore${NC}"
else
    echo -e "${RED}⚠️  .env файлове НЕ са в .gitignore!${NC}"
fi

if grep -q "\*\.pem" .gitignore 2>/dev/null || grep -q "\.pem" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .pem файлове са в .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  .pem файлове не са в .gitignore${NC}"
fi

echo ""

# 5. Проверка за публично достъпни файлове
echo -e "${YELLOW}[5/5] Проверка за потенциално изложени файлове...${NC}"

# Проверка за .env файлове в текущата директория
if [ -f ".env" ]; then
    echo -e "${RED}⚠️  Намерен .env файл в текущата директория!${NC}"
    echo "Проверка дали е в .gitignore..."
    if git check-ignore -q .env 2>/dev/null; then
        echo -e "${GREEN}✅ .env е игнориран от git${NC}"
    else
        echo -e "${RED}❌ .env НЕ е игнориран от git!${NC}"
    fi
fi

# Проверка за други чувствителни файлове
SENSITIVE_FILES=$(find . -name "*.pem" -o -name "*.key" -o -name "*secret*" -o -name "*password*" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | head -10)

if [ ! -z "$SENSITIVE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Намерени чувствителни файлове:${NC}"
    echo "$SENSITIVE_FILES"
    echo ""
    echo "Проверка дали са в .gitignore..."
    for file in $SENSITIVE_FILES; do
        if git check-ignore -q "$file" 2>/dev/null; then
            echo -e "${GREEN}✅ $file е игнориран${NC}"
        else
            echo -e "${RED}❌ $file НЕ е игнориран!${NC}"
        fi
    done
else
    echo -e "${GREEN}✅ Няма намерени чувствителни файлове${NC}"
fi

echo ""
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}Проверката е завършена!${NC}"
echo ""
echo "Препоръки:"
echo "1. Ако са намерени изложени секрети, СМЕНИ ГИ ВЕДНАГА!"
echo "2. Премахни fallback secrets от кода"
echo "3. Увери се че всички .env файлове са в .gitignore"
echo "4. Провери дали .env файлове са били commit-нати в миналото"
echo "5. Ако са били commit-нати, помисли за ротация на всички секрети"

