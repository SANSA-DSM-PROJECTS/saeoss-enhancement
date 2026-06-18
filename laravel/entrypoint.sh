#!/bin/sh

# Fix permissions for Laravel
chown -R www-data:www-data /var/www/laravel/storage /var/www/laravel/bootstrap/cache
chmod -R 775 /var/www/laravel/storage /var/www/laravel/bootstrap/cache

# Start PHP-FPM
exec php-fpm

