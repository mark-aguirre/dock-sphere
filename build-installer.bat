@echo off
echo Building DockSphere Windows Installer...
echo =======================================

REM Check if NSIS is installed
makensis /VERSION >nul 2>&1
if errorlevel 1 (
    echo Error: NSIS (Nullsoft Scriptable Install System) is not installed
    echo Please download and install NSIS from https://nsis.sourceforge.io/
    echo Make sure makensis.exe is in your PATH
    pause
    exit /b 1
)

REM Create dist directory if it doesn't exist
if not exist "dist" mkdir dist

REM Create a basic LICENSE file if it doesn't exist
if not exist "LICENSE" (
    echo MIT License > LICENSE
    echo. >> LICENSE
    echo Copyright ^(c^) 2024 DockSphere >> LICENSE
    echo. >> LICENSE
    echo Permission is hereby granted, free of charge, to any person obtaining a copy >> LICENSE
    echo of this software and associated documentation files ^(the "Software"^), to deal >> LICENSE
    echo in the Software without restriction, including without limitation the rights >> LICENSE
    echo to use, copy, modify, merge, publish, distribute, sublicense, and/or sell >> LICENSE
    echo copies of the Software, and to permit persons to whom the Software is >> LICENSE
    echo furnished to do so, subject to the following conditions: >> LICENSE
    echo. >> LICENSE
    echo The above copyright notice and this permission notice shall be included in all >> LICENSE
    echo copies or substantial portions of the Software. >> LICENSE
    echo. >> LICENSE
    echo THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR >> LICENSE
    echo IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, >> LICENSE
    echo FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE >> LICENSE
    echo AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER >> LICENSE
    echo LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, >> LICENSE
    echo OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE >> LICENSE
    echo SOFTWARE. >> LICENSE
)

REM Build the Next.js application first
echo Building Next.js application...
npm run build
if errorlevel 1 (
    echo Error: Failed to build Next.js application
    pause
    exit /b 1
)

REM Build the installer
echo Building Windows installer...
makensis installer\installer.nsi
if errorlevel 1 (
    echo Error: Failed to build installer
    pause
    exit /b 1
)

echo.
echo Installer built successfully!
echo Location: dist\DockSphere-Installer.exe
echo.
pause