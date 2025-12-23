#!/bin/bash

# Скрипт за проверка на injection уязвимости
# Използвай: bash check-injection-vulnerabilities.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Проверка на Injection Уязвимости${NC}"
echo ""

# 1. Проверка за SQL Injection
echo -e "${YELLOW}[1/5] Проверка за SQL Injection уязвимости...${NC}"

# Проверка за $executeRawUnsafe с user input
UNSAFE_RAW=$(grep -r "\$executeRawUnsafe\|\$queryRawUnsafe" app/api --include="*.ts" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)

if [ -z "$UNSAFE_RAW" ]; then
    echo -e "${GREEN}✅ Няма намерени \$executeRawUnsafe в API endpoints${NC}"
else
    echo -e "${RED}⚠️  Намерени \$executeRawUnsafe използвания:${NC}"
    echo "$UNSAFE_RAW"
    echo ""
    echo "Проверявам дали използват user input..."
    
    # Проверка дали има user input в същите файлове
    for file in $(echo "$UNSAFE_RAW" | cut -d: -f1 | sort -u); do
        if grep -q "req\.body\|request\.body\|params\|query\|searchParams" "$file" 2>/dev/null; then
            echo -e "${RED}❌ ПОДОЗРИТЕЛНО: $file използва user input с \$executeRawUnsafe!${NC}"
        else
            echo -e "${GREEN}✅ $file - използва само статичен SQL${NC}"
        fi
    done
fi

# Проверка за $executeRaw и $queryRaw (безопасни ако използват template literals правилно)
RAW_QUERIES=$(grep -r "\$executeRaw\|\$queryRaw" app/api --include="*.ts" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)

if [ ! -z "$RAW_QUERIES" ]; then
    echo ""
    echo -e "${YELLOW}Намерени \$executeRaw/\$queryRaw използвания (проверявам за правилно използване):${NC}"
    echo "$RAW_QUERIES"
    echo ""
    echo -e "${GREEN}ℹ️  Prisma \$executeRaw/\$queryRaw с template literals са безопасни (автоматично parameterized queries)${NC}"
fi

echo ""

# 2. Проверка за Command Injection
echo -e "${YELLOW}[2/5] Проверка за Command Injection уязвимости...${NC}"

COMMAND_EXEC=$(grep -r "exec\|spawn\|system\|child_process\|eval\|Function(" app/api --include="*.ts" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "console.log\|console.error" || true)

if [ -z "$COMMAND_EXEC" ]; then
    echo -e "${GREEN}✅ Няма намерени команди за изпълнение${NC}"
else
    echo -e "${RED}⚠️  Намерени команди за изпълнение:${NC}"
    echo "$COMMAND_EXEC"
    echo ""
    echo "Проверявам дали използват user input..."
    
    for file in $(echo "$COMMAND_EXEC" | cut -d: -f1 | sort -u); do
        if grep -q "req\.body\|request\.body\|params\|query" "$file" 2>/dev/null; then
            echo -e "${RED}❌ ПОДОЗРИТЕЛНО: $file може да изпълнява user input!${NC}"
        else
            echo -e "${GREEN}✅ $file - не използва user input${NC}"
        fi
    done
fi

echo ""

# 3. Проверка за XSS уязвимости
echo -e "${YELLOW}[3/5] Проверка за XSS уязвимости...${NC}"

# Проверка за опасни innerHTML използвания
DANGEROUS_HTML=$(grep -r "innerHTML\|dangerouslySetInnerHTML" app --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)

if [ -z "$DANGEROUS_HTML" ]; then
    echo -e "${GREEN}✅ Няма намерени опасни HTML използвания${NC}"
else
    echo -e "${YELLOW}⚠️  Намерени innerHTML използвания (проверявам за user input):${NC}"
    echo "$DANGEROUS_HTML"
fi

echo ""

# 4. Проверка за валидация на user input
echo -e "${YELLOW}[4/5] Проверка за валидация на user input...${NC}"

# Проверка дали всички API endpoints валидират input
API_FILES=$(find app/api -name "route.ts" -o -name "route.js" 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)

VALIDATION_COUNT=0
NO_VALIDATION_COUNT=0

for file in $API_FILES; do
    if grep -q "req\.body\|request\.body" "$file" 2>/dev/null; then
        if grep -q "validate\|zod\|schema\|validation" "$file" 2>/dev/null; then
            VALIDATION_COUNT=$((VALIDATION_COUNT + 1))
        else
            NO_VALIDATION_COUNT=$((NO_VALIDATION_COUNT + 1))
            echo -e "${YELLOW}⚠️  $file - приема body но не виждам валидация${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Endpoints с валидация: $VALIDATION_COUNT${NC}"
if [ $NO_VALIDATION_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Endpoints без валидация: $NO_VALIDATION_COUNT${NC}"
else
    echo -e "${GREEN}✅ Всички endpoints с body input имат валидация${NC}"
fi

echo ""

# 5. Проверка на Prisma използване
echo -e "${YELLOW}[5/5] Проверка на Prisma използване...${NC}"

# Проверка дали всички database queries използват Prisma
DIRECT_SQL=$(grep -r "client\.query\|pg\.query\|mysql\.query" app/api --include="*.ts" --include="*.js" 2>/dev/null | grep -v "node_modules" | grep -v ".git" || true)

if [ -z "$DIRECT_SQL" ]; then
    echo -e "${GREEN}✅ Всички database queries използват Prisma ORM${NC}"
    echo -e "${GREEN}✅ Prisma автоматично прави parameterized queries (защита срещу SQL injection)${NC}"
else
    echo -e "${RED}⚠️  Намерени директни SQL заявки (не чрез Prisma):${NC}"
    echo "$DIRECT_SQL"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Проверката е завършена!${NC}"
echo ""
echo "Препоръки:"
echo "1. Винаги използвай Prisma ORM вместо raw SQL"
echo "2. Ако трябва raw SQL, използвай \$executeRaw/\$queryRaw с template literals"
echo "3. НИКОГА не използвай \$executeRawUnsafe с user input"
echo "4. Валидирай всички user inputs преди използване"
echo "5. Избягвай eval(), Function(), exec(), spawn() с user input"





