# Docker Socket Permission Issue - Container Hub Plus

## Issue Summary
Container Hub Plus application deployed on Ubuntu server (192.168.1.15) was experiencing Docker socket permission errors, preventing the application from accessing Docker daemon functionality.

## Error Details

### Error Messages
```
Error streaming stats: Error: connect EACCES /var/run/docker.sock
at PipeConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
at PipeConnectWrap.callbackTrampoline (node:internal/async_hooks:128:17) {
  errno: -13,
  code: 'EACCES',
  syscall: 'connect',
  address: '/var/run/docker.sock'
}

Error listing networks: Failed to list networks: connect EACCES /var/run/docker.sock
Error getting aggregate stats: Failed to get aggregate stats: connect EACCES /var/run/docker.sock
```

### Symptoms
- Application unable to connect to Docker daemon
- Docker API calls failing with permission denied errors
- Container stats, network listing, and other Docker operations not working
- Application logs showing repeated EACCES errors for `/var/run/docker.sock`

## Root Cause Analysis

### Primary Cause
The Docker socket (`/var/run/docker.sock`) on the Ubuntu server had restrictive permissions that prevented the containerized application from accessing it.

### Technical Details
1. **Docker Socket Ownership**: The Docker socket is typically owned by `root:docker` with permissions `srw-rw----`
2. **Container User Context**: The application container was running with a user that didn't have proper group membership to access the Docker socket
3. **Group ID Mismatch**: The container's docker group GID didn't match the host system's docker group GID
4. **Permission Inheritance**: When mounting `/var/run/docker.sock` into the container, the host permissions were preserved, but the container user lacked the necessary group access

### Contributing Factors
- Fresh Ubuntu server deployment without proper Docker group configuration
- Container running with user that wasn't added to the docker group on the host
- Docker socket permissions not configured for container access

## Solution Applied

### Immediate Fix (Manual Script)
Created and executed `manual-server-fix.sh` on the Ubuntu server:

```bash
#!/bin/bash

# 1. Set Docker socket permissions
sudo chmod 666 /var/run/docker.sock

# 2. Add user to docker group
sudo usermod -aG docker $USER

# 3. Restart Docker service
sudo systemctl restart docker

# 4. Test Docker access
docker ps

# 5. Restart container with proper permissions
docker stop container-hub-plus 2>/dev/null || true
docker rm container-hub-plus 2>/dev/null || true

# Get Docker socket group ID and run container with proper group access
DOCKER_GID=$(stat -c %g /var/run/docker.sock)
docker run -d \
  --name container-hub-plus \
  -p 3009:3009 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --group-add $DOCKER_GID \
  --user 0:0 \
  --restart unless-stopped \
  --env-file .env \
  container-hub-plus:latest
```

### Long-term Solution (Automated Deployment)
Updated deployment scripts to automatically handle Docker permissions:

1. **Enhanced Deployment Script** (`deploy-to-server.bat`):
   - Copies Docker permission fix script to server
   - Executes permission fix before container deployment
   - Uses `--group-add` with dynamic Docker socket GID
   - Improved error handling and logging

2. **Automated Permission Fix** (`fix-server-docker-permissions.sh`):
   - Checks Docker service status
   - Adds user to docker group
   - Sets appropriate socket permissions
   - Tests Docker access before deployment

## Prevention Measures

### Server Setup Checklist
- [ ] Ensure Docker is properly installed and running
- [ ] Add deployment user to docker group: `sudo usermod -aG docker $USER`
- [ ] Set Docker socket permissions: `sudo chmod 666 /var/run/docker.sock`
- [ ] Test Docker access: `docker ps`
- [ ] Restart Docker service if needed: `sudo systemctl restart docker`

### Container Configuration
- [ ] Use `--group-add $(stat -c %g /var/run/docker.sock)` when running containers
- [ ] Mount Docker socket with proper volume mapping: `-v /var/run/docker.sock:/var/run/docker.sock`
- [ ] Run container with appropriate user permissions (`--user 0:0` for Docker access)

### Deployment Script Features
- [ ] Automatic Docker permission checking and fixing
- [ ] Dynamic Docker socket GID detection
- [ ] Proper error handling and rollback procedures
- [ ] Comprehensive logging for troubleshooting

## Verification Steps

After applying the fix, verify the solution:

1. **Check Docker Socket Permissions**:
   ```bash
   ls -la /var/run/docker.sock
   # Should show: srw-rw-rw- 1 root docker
   ```

2. **Verify User Group Membership**:
   ```bash
   groups $USER
   # Should include 'docker' group
   ```

3. **Test Docker Access**:
   ```bash
   docker ps
   # Should list containers without permission errors
   ```

4. **Check Application Logs**:
   ```bash
   docker logs container-hub-plus --tail 20
   # Should show successful Docker socket connection
   ```

5. **Test Application Functionality**:
   - Access http://192.168.1.15:3009
   - Verify Docker stats are loading
   - Check network listing functionality
   - Confirm container management features work

## Files Created/Modified

### New Files
- `manual-server-fix.sh` - Quick manual fix script
- `fix-server-docker-permissions.sh` - Automated permission fix
- `DOCKER_SOCKET_PERMISSION_ISSUE.md` - This documentation

### Modified Files
- `deploy-to-server.bat` - Enhanced with automatic permission fixing
- `DOCKER_PERMISSIONS_FIX.md` - Updated with server-specific information

## Status
✅ **RESOLVED** - Docker socket permission issue fixed on Ubuntu server (192.168.1.15)

The Container Hub Plus application is now running successfully with full Docker daemon access at http://192.168.1.15:3009.