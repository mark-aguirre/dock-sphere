#!/bin/bash

echo "🔧 Fixing Docker socket permissions for Container Hub Plus..."

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container"
    
    # Check if Docker socket exists
    if [ -S /var/run/docker.sock ]; then
        echo "Docker socket found at /var/run/docker.sock"
        
        # Get the Docker socket group ID
        DOCKER_GID=$(stat -c %g /var/run/docker.sock)
        echo "Docker socket group ID: $DOCKER_GID"
        
        # Check current user groups
        echo "Current user: $(whoami)"
        echo "Current groups: $(groups)"
        
        # If we're root, we can fix the permissions
        if [ "$(id -u)" = "0" ]; then
            echo "Running as root - fixing permissions..."
            
            # Create or update docker group with correct GID
            if ! getent group docker > /dev/null 2>&1; then
                groupadd -g $DOCKER_GID docker
                echo "Created docker group with GID $DOCKER_GID"
            else
                groupmod -g $DOCKER_GID docker
                echo "Updated docker group to GID $DOCKER_GID"
            fi
            
            # Add current user to docker group if not root
            if [ "$USER" != "root" ] && [ -n "$USER" ]; then
                usermod -aG docker $USER
                echo "Added $USER to docker group"
            fi
            
        else
            echo "Not running as root - cannot fix permissions automatically"
            echo "Please run this script as root or add your user to the docker group"
        fi
        
    else
        echo "Docker socket not found at /var/run/docker.sock"
    fi
else
    echo "Not running in Docker container"
    
    # For host system, just check if user is in docker group
    if groups | grep -q docker; then
        echo "✅ User is already in docker group"
    else
        echo "❌ User is not in docker group"
        echo "Run: sudo usermod -aG docker $USER"
        echo "Then logout and login again"
    fi
fi

echo "Done!"