#!/bin/bash

echo "Cleaning up old containers..."
docker compose down -v

echo "Removing old images..."
docker rmi saeoss-php 2>/dev/null || true

echo "Creating necessary directories..."
mkdir -p docker/nginx/conf.d
mkdir -p docker/postgres/data
mkdir -p src/public

echo "Starting fresh build..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

echo "Waiting for containers to initialize..."
sleep 20

echo "Container status:"
docker ps

echo ""
echo "========================================="
echo "Setup complete!"
echo "Access your portal at: http://localhost:8080"
echo "========================================="
echo ""
echo "To view logs: docker compose logs -f"
echo "To access PHP container: docker exec -it eo-php sh"
