@echo off
echo Installing DockSphere dependencies...
echo ====================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install production dependencies
echo Installing production dependencies...
npm ci --only=production
if errorlevel 1 (
    echo Error: Failed to install production dependencies
    pause
    exit /b 1
)

REM Install node-windows for service management
echo Installing node-windows for service management...
npm install node-windows
if errorlevel 1 (
    echo Error: Failed to install node-windows
    pause
    exit /b 1
)

echo Dependencies installed successfully!
pause