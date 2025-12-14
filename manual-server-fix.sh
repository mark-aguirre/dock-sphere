#!/bin/bash

echo "🚨 Manual Docker Permission Fix for Container Hub Plus"
echo "Run this script on your Ubuntu server (192.168.1.15) if deployment fails"
echo ""

# Quick Docker socket permission fix
echo "1. Setting Docker socket permissions..."
sudo chmod 666 /var/run/docker.sock

# Add user to docker group
echo "2. Adding user to docker group..."
sudo usermod -aG docker $USER

# Restart Docker service
echo "3. Restarting Docker service..."
sudo systemctl restart docker

# Test Docker access
echo "4. Testing Docker access..."
docker ps

echo ""
echo "5. Now restart your container with proper permissions:"
echo "   docker stop container-hub-plus 2>/dev/null || true"
echo "   docker rm container-hub-plus 2>/dev/null || true"
echo ""
echo "   # Get Docker socket group ID"
echo "   DOCKER_GID=\$(stat -c %g /var/run/docker.sock)"
echo "   echo \"Docker GID: \$DOCKER_GID\""
echo ""
echo "   # Run container with proper group access"
echo "   docker run -d \\"
echo "     --name container-hub-plus \\"
echo "     -p 3009:3009 \\"
echo "     -v /var/run/docker.sock:/var/run/docker.sock \\"
echo "     --group-add \$DOCKER_GID \\"
echo "     --user 0:0 \\"
echo "     --restart unless-stopped \\"
echo "     --env-file .env \\"
echo "     container-hub-plus:latest"
echo ""
echo "6. Check logs:"
echo "   docker logs container-hub-plus -f"