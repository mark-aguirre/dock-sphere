@echo off
setlocal

echo DockSphere Container Hub Plus - Service Manager
echo ================================================

:menu
echo.
echo 1. Install Service
echo 2. Uninstall Service
echo 3. Start Service
echo 4. Stop Service
echo 5. Restart Service
echo 6. Check Service Status
echo 7. Exit
echo.
set /p choice="Please select an option (1-7): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto uninstall
if "%choice%"=="3" goto start
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto restart
if "%choice%"=="6" goto status
if "%choice%"=="7" goto exit

echo Invalid choice. Please try again.
goto menu

:install
echo Installing DockSphere service...
node install-service.js
pause
goto menu

:uninstall
echo Uninstalling DockSphere service...
node uninstall-service.js
pause
goto menu

:start
echo Starting DockSphere service...
sc start "DockSphere Container Hub Plus"
pause
goto menu

:stop
echo Stopping DockSphere service...
sc stop "DockSphere Container Hub Plus"
pause
goto menu

:restart
echo Restarting DockSphere service...
sc stop "DockSphere Container Hub Plus"
timeout /t 3 /nobreak >nul
sc start "DockSphere Container Hub Plus"
pause
goto menu

:status
echo Checking DockSphere service status...
sc query "DockSphere Container Hub Plus"
pause
goto menu

:exit
echo Goodbye!
exit /b 0