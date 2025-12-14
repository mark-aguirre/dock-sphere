@echo off
echo 🔍 Validating deployment configuration...

echo.
echo ✅ Checking Dockerfile warnings...
docker build --no-cache -t container-hub-plus-test . 2>&1 | findstr /C:"warning" /C:"Warning" /C:"WARNING"
if %errorlevel% equ 0 (
    echo ⚠️ Warnings found in Dockerfile
) else (
    echo ✅ No warnings found in Dockerfile
)

echo.
echo ✅ Checking environment file...
if exist .env (
    echo ✅ .env file exists
) else (
    echo ❌ .env file missing - copy from .env.example
)

if exist .env.production (
    echo ✅ .env.production file exists
) else (
    echo ❌ .env.production file missing
)

echo.
echo ✅ Checking docker-compose configuration...
docker-compose config > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ docker-compose.yml is valid
) else (
    echo ❌ docker-compose.yml has errors
)

echo.
echo ✅ Cleaning up test image...
docker rmi container-hub-plus-test > nul 2>&1

echo.
echo 🎯 Validation complete!
pause