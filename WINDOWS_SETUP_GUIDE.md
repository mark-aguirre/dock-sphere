# Windows Setup Guide for DockSphere Container Hub Plus

## Quick Setup Instructions

### 1. Install as Windows Service (Recommended)

Run this command as Administrator:

```cmd
npm run service:install
```

This will:
- Install the application as a Windows service
- Configure it to start automatically with Windows
- Set up the service to run on port 3009

### 2. Manual Installation Steps

If you prefer manual setup:

1. **Install dependencies:**
   ```cmd
   npm install
   ```

2. **Build the application:**
   ```cmd
   npm run build
   ```

3. **Install as service:**
   ```cmd
   npm run service:install
   ```

### 3. Service Management

Use these commands to manage the service:

```cmd
# Check service status
sc query "DockSphere Container Hub Plus"

# Start service
sc start "DockSphere Container Hub Plus"

# Stop service
sc stop "DockSphere Container Hub Plus"

# Or use the service manager
cd windows-service
service-manager.bat
```

### 4. Access the Application

Once the service is running, access the application at:
- **URL:** http://localhost:3009
- **Service Name:** DockSphere Container Hub Plus

### 5. Uninstall Service

To remove the service:

```cmd
npm run service:uninstall
```

## Building Windows Installer

To create a Windows installer (.exe):

1. **Install NSIS:** Download from https://nsis.sourceforge.io/
2. **Build installer:**
   ```cmd
   npm run build:installer
   ```
3. **Run installer:** `dist\DockSphere-Installer.exe`

## Troubleshooting

### Service won't start
- Ensure Node.js is installed and in PATH
- Run Command Prompt as Administrator
- Check Windows Event Viewer for errors

### Port 3009 in use
- Stop other services using port 3009
- Or modify the port in `windows-service/install-service.js`

### Permission errors
- Run installation commands as Administrator
- Ensure Windows Defender isn't blocking the service

## Files Created

The setup creates these files:
- `windows-service/` - Service management scripts
- `installer/` - Windows installer configuration
- `start-app.bat` - Manual application starter
- Service logs in Windows Event Viewer

## Next Steps

After installation:
1. Access http://localhost:3009
2. Complete the initial setup wizard
3. Configure Docker connection
4. Start managing your containers!