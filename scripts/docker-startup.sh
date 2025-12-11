#!/bin/sh

# Docker startup script to ensure proper file permissions and configuration

echo "Starting Container Hub Plus in Docker..."

# Ensure .env file exists and has proper permissions
if [ ! -f "/app/.env" ]; then
    echo "Creating default .env file..."
    touch /app/.env
fi

# Set proper permissions for configuration files
chmod 644 /app/.env 2>/dev/null || echo "Warning: Could not set .env permissions"

# Ensure backup directory exists
mkdir -p /app/.env-backups 2>/dev/null || echo "Warning: Could not create backup directory"
chmod 755 /app/.env-backups 2>/dev/null || echo "Warning: Could not set backup directory permissions"

# Log environment info
echo "Docker environment detected:"
echo "- Node environment: $NODE_ENV"
echo "- Hostname: $HOSTNAME"
echo "- Port: $PORT"
echo "- Docker socket: $DOCKER_SOCKET"

# Start the Next.js application
echo "Starting Next.js server..."
exec node server.js