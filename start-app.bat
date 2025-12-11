@echo off
echo Starting DockSphere Container Hub Plus...
echo ========================================

REM Set environment variables
set NODE_ENV=production
set PORT=3009
set HOSTNAME=0.0.0.0

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Build the application if not already built
if not exist ".next" (
    echo Building application...
    npm run build
    if errorlevel 1 (
        echo Error: Failed to build application
        pause
        exit /b 1
    )
)

echo Starting server on http://localhost:3009
echo Press Ctrl+C to stop the server
echo.

REM Start the application using standalone server
node .next/standalone/server.js