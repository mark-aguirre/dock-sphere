# Docker Socket Permission Fix

## Problem
The application is getting `EACCES` errors when trying to connect to `/var/run/docker.sock` because the container user doesn't have permission to access the Docker socket.

## Root Cause
- The app runs as user `nextjs` (UID 1001) inside the container
- The Docker socket is owned by the `docker` group on the host
- The container user isn't in the correct group to access the socket

## Solutions Applied

### 1. Updated Dockerfile
- Added `su-exec` package for secure user switching
- Created docker group and added nextjs user to it
- Modified startup script to:
  - Run as root initially
  - Fix Docker socket group permissions
  - Switch to nextjs user before starting the app

### 2. Updated docker-compose.yml
- Set `user: "0:0"` to run as root initially
- The startup script handles switching to the correct user

### 3. Alternative Manual Fix
If you're still having issues, you can manually fix permissions on the host:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Or if running the container manually:
docker run -d \
  --name container-hub-plus \
  -p 3009:3009 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --group-add $(stat -c %g /var/run/docker.sock) \
  container-hub-plus:latest
```

## Verification
After applying the fix, you should see in the logs:
```
Starting Container Hub Plus in Docker...
Docker environment detected:
- Node environment: production
- Hostname: 0.0.0.0
- Port: 3009
- Docker socket: /var/run/docker.sock

Docker socket GID: 999
Docker socket permissions fixed
Switching to nextjs user and starting server...
```

## Security Note
The container runs as root initially only to fix the Docker socket permissions, then immediately switches to the unprivileged `nextjs` user for running the application. This is a secure approach that maintains the principle of least privilege.

## Deployment Commands
```bash
# Rebuild and deploy with the fix
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check logs to verify the fix
docker-compose logs -f container-hub-plus
```