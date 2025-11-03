#!/bin/bash
set -e

echo "Fixing file permissions..."
chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
chmod -R 775 /var/www/html/wp-content

echo "Permissions fixed. Starting WordPress..."

exec docker-entrypoint.sh "$@"
