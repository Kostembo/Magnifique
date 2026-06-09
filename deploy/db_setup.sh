#!/bin/bash
# Запускать на VPS под root после setup.sh

set -e

DB_NAME="magnifique"
DB_USER="magnifique_user"
# Сгенерируйте свой пароль: openssl rand -base64 24
DB_PASS="CHANGE_ME_STRONG_PASSWORD"

echo "=== Создание пользователя и базы данных ==="
sudo -u postgres psql <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo ""
echo "=== Готово! DATABASE_URL для .env.production: ==="
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME\""
echo "DIRECT_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME\""
