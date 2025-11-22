#!/bin/bash

# Luna Bar v2.2+ Deployment Script
# Sharp removed - using pure SVG approach for QR codes

set -e  # Exit on error

echo "🚀 Starting deployment..."

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

echo "✅ Deployment complete!"
