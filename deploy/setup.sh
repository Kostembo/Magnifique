#!/bin/bash
# Запускать на VPS под root: bash setup.sh

set -e

echo "=== 1. Обновление системы ==="
apt update && apt upgrade -y

echo "=== 2. Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== 3. PM2 ==="
npm install -g pm2

echo "=== 4. PostgreSQL 16 ==="
apt install -y postgresql postgresql-contrib

echo "=== 5. nginx ==="
apt install -y nginx

echo "=== 6. certbot (Let's Encrypt) ==="
apt install -y certbot python3-certbot-nginx

echo "=== 7. Директория приложения ==="
mkdir -p /var/www/magnifique
useradd -r -s /bin/false magnifique 2>/dev/null || true
chown -R $USER:$USER /var/www/magnifique

echo ""
echo "=== Готово! Следующий шаг — настройка PostgreSQL ==="
echo "Запустите: bash db_setup.sh"
