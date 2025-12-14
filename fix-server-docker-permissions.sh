#!/bin/bash

echo "🔧 Fixing Docker permissions on Ubuntu server..."

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "❌ Docker is not running. Starting Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Check Docker socket permissions
echo "📋 Current Docker socket permissions:"
ls -la /var/run/docker.sock

# Get Docker socket group ID
DOCKER_GID=$(stat -c %g /var/run/docker.sock)
echo "Docker socket group ID: $DOCKER_GID"

# Add current user to docker group if not already
if ! groups $USER | grep -q docker; then
    echo "➕ Adding $USER to docker group..."
    sudo usermod -aG docker $USER
    echo "✅ User added to docker group"
    echo "⚠️  You may need to logout and login again for group changes to take effect"
else
    echo "✅ User $USER is already in docker group"
fi

# Ensure Docker socket has correct permissions
echo "🔧 Setting Docker socket permissions..."
sudo chmod 666 /var/run/docker.sock

# Test Docker access
echo "🧪 Testing Docker access..."
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker access test successful"
else
    echo "❌ Docker access test failed"
    echo "Current user groups: $(groups)"
    echo "Docker socket info: $(ls -la /var/run/docker.sock)"
fi

# Stop and remove existing container if running
echo "🛑 Stopping existing container..."
docker stop container-hub-plus 2>/dev/null || true
docker rm container-hub-plus 2>/dev/null || true

echo "✅ Docker permissions fix completed!"
echo ""
echo "Next steps:"
echo "1. Deploy your application using the deployment script"
echo "2. If issues persist, run: newgrp docker"
echo "3. Or logout and login again to refresh group membership"