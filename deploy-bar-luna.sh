#!/bin/bash
# Bar Luna Deploy Script
# Usage: sudo bash deploy-bar-luna.sh

set -e  # Exit on error

echo "🚀 Starting Bar Luna deployment..."

# Navigate to project
cd /var/www/html/bar-luna || exit 1

# Pull latest code
echo "📥 Pulling latest code from git..."
git pull

# Install dependencies (if package.json changed)
echo "📦 Installing dependencies..."
npm install

# Build Next.js
echo "🔨 Building Next.js application..."
npm run build

# Ensure uploads directory exists with correct permissions
echo "📁 Checking uploads directory..."
sudo mkdir -p /var/www/uploads/bar-luna
sudo chown -R www-data:www-data /var/www/uploads/bar-luna
sudo chmod -R 755 /var/www/uploads/bar-luna

# Restart PM2
echo "♻️  Restarting PM2 process..."
pm2 restart bar-luna

# Show status
echo "✅ Deployment complete!"
pm2 status bar-luna
pm2 logs bar-luna --lines 10

echo ""
echo "🔍 To monitor logs: pm2 logs bar-luna"
echo "📊 To check status: pm2 status"

