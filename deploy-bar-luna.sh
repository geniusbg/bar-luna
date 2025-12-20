#!/bin/bash

# Luna Bar v2.2+ Deployment Script
# Sharp removed - using pure SVG approach for QR codes

set -e  # Exit on error

echo "🚀 Starting deployment..."

# SECURITY: Clean up any XMRig malware before deployment
echo "🔒 Cleaning up any XMRig malware..."
pkill -9 xmrig 2>/dev/null || true
rm -rf /var/www/html/bar-luna/xmrig-* 2>/dev/null || true
rm -rf /var/www/html/bar-luna/build-new 2>/dev/null || true
rm -rf /var/www/html/bar-luna/x86_32 2>/dev/null || true

# Remove old directory
rm -rf bar-luna

# Clone repository
echo "📥 Cloning repository..."
git clone -b luna-v2.2 https://github.com/geniusbg/bar-luna.git

# Copy environment file
echo "📋 Copying environment file..."
cp .env.bar-luna bar-luna/.env

cd bar-luna

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Regenerate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run Prisma migrations (if any)
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || npx prisma db push || echo "⚠️ No migrations to run"

# Build application
echo "🏗️ Building application..."
npm run build

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart 6

# SECURITY: Final cleanup check after deployment
echo "🔒 Final security check..."
rm -rf /var/www/html/bar-luna/xmrig-* 2>/dev/null || true
rm -rf /var/www/html/bar-luna/build-new 2>/dev/null || true
rm -rf /var/www/html/bar-luna/x86_32 2>/dev/null || true

echo "✅ Deployment complete!"
