# scripts/setup-laravel.sh
#!/bin/bash

cd /var/www/html

# Create Laravel project if not exists
if [ ! -f "artisan" ]; then
    composer create-project --prefer-dist laravel/laravel . --quiet
fi

# Create .env file
cat > .env << 'EOF'
APP_NAME="South Africa EO Metadata Portal"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=datastore
DB_USERNAME=alamba
DB_PASSWORD=lamba

BROADCAST_DRIVER=log
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
EOF

# Generate application key
php artisan key:generate
