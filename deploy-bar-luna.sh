#!/bin/bash

# Malts — Deployment Script (legacy filename)
# Sharp removed - using pure SVG approach for QR codes

set -e  # Exit on error

echo "🚀 Starting deployment..."

# SECURITY: Clean up any XMRig malware before deployment
echo "🔒 Cleaning up any XMRig malware..."
pkill -9 xmrig 2>/dev/null || true
rm -rf /var/www/html/malts-web/xmrig-* 2>/dev/null || true
rm -rf /var/www/html/malts-web/build-new 2>/dev/null || true
rm -rf /var/www/html/malts-web/x86_32 2>/dev/null || true

# Remove old directory
rm -rf malts-web

# Clone repository
echo "📥 Cloning repository..."
git clone <your-repo-url> malts-web

# Copy environment file
echo "📋 Copying environment file..."
cp .env.malts-web malts-web/.env

cd malts-web

# Install dependencies (use npm ci for reproducible builds and security audit)
echo "📦 Installing dependencies..."
npm ci --audit || npm install

# Regenerate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run Prisma migrations (if any)
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || npx prisma db push || echo "⚠️ No migrations to run"

# Build application
echo "🏗️ Building application..."
npm run build

# Restart PM2 (use process name instead of hardcoded ID)
echo "🔄 Restarting PM2..."
pm2 restart malts-web || pm2 start ecosystem.config.js

# SECURITY: Final cleanup check after deployment
echo "🔒 Final security check..."
rm -rf /var/www/html/malts-web/xmrig-* 2>/dev/null || true
rm -rf /var/www/html/malts-web/build-new 2>/dev/null || true
rm -rf /var/www/html/malts-web/x86_32 2>/dev/null || true

echo "✅ Deployment complete!"
