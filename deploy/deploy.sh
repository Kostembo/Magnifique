#!/bin/bash
# Запускать на VPS в /var/www/magnifique при каждом обновлении

set -e

APP_DIR="/var/www/magnifique"

echo "=== Установка зависимостей ==="
cd $APP_DIR
npm ci --production=false

echo "=== Применение миграций БД ==="
npm run db:push

echo "=== Сборка приложения ==="
npm run build

echo "=== Перезапуск PM2 ==="
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "=== Готово! ==="
pm2 status
