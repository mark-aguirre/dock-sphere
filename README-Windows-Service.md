# DockSphere Windows Service Setup

This guide explains how to install and run DockSphere Container Hub Plus as a Windows service.

## Prerequisites

1. **Node.js** (v18 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **NSIS** (for building installer) - Download from [nsis.sourceforge.io](https://nsis.sourceforge.io/)
3. **Administrator privileges** - Required for service installation

## Quick Start

### Option 1: Using the Windows Installer (Recommended)

1. Build the installer:
   ```cmd
   build-installer.bat
   ```

2. Run the installer:
   ```cmd
   dist\DockSphere-Installer.exe
   ```

3. During installation, check "Install as Windows Service" to automatically set up the service

### Option 2: Manual Service Installation

1. Install dependencies:
   ```cmd
   install-dependencies.bat
   ```

2. Install the service:
   ```cmd
   cd windows-service
   node install-service.js
   ```

## Service Management

Use the Service Manager for easy service control:

```cmd
cd windows-service
service-manager.bat
```

Or use Windows Service Control Manager:

```cmd
# Start service
sc start "DockSphere Container Hub Plus"

# Stop service
sc stop "DockSphere Container Hub Plus"

# Check status
sc query "DockSphere Container Hub Plus"
```

## Service Configuration

The service runs with the following configuration:

- **Service Name**: DockSphere Container Hub Plus
- **Port**: 3009
- **URL**: http://localhost:3009
- **Environment**: Production
- **Auto-start**: Yes (starts with Windows)

## Environment Variables

The service uses these environment variables:

- `NODE_ENV=production`
- `PORT=3009`
- `HOSTNAME=0.0.0.0`

To modify these, edit `windows-service/install-service.js` before installation.

## Logs

Service logs are available in Windows Event Viewer:

1. Open Event Viewer
2. Navigate to: Windows Logs > Application
3. Filter by source: "DockSphere Container Hub Plus"

## Troubleshooting

### Service won't start
- Check if Node.js is installed and in PATH
- Verify all dependencies are installed
- Check Windows Event Viewer for error details

### Port conflicts
- Ensure port 3009 is not used by another application
- Modify the port in `install-service.js` if needed

### Permission issues
- Run installation as Administrator
- Check that the service account has necessary permissions

## Uninstalling

### Using the installer
Run the uninstaller from Control Panel > Programs and Features

### Manual uninstallation
```cmd
cd windows-service
node uninstall-service.js
```

## Files Structure

```
container-hub-plus/
├── windows-service/
│   ├── install-service.js      # Service installation script
│   ├── uninstall-service.js    # Service removal script
│   └── service-manager.bat     # Service management utility
├── installer/
│   └── installer.nsi           # NSIS installer script
├── start-app.bat               # Manual application starter
├── install-dependencies.bat    # Dependency installer
└── build-installer.bat         # Installer builder
```

## Support

For issues and support:
1. Check the Windows Event Viewer for service logs
2. Review the application logs in the installation directory
3. Ensure all prerequisites are properly installed