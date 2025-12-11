; DockSphere Container Hub Plus Windows Installer
; NSIS Script

!define APPNAME "DockSphere Container Hub Plus"
!define COMPANYNAME "DockSphere"
!define DESCRIPTION "Docker Management Web Application"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0
!define HELPURL "https://github.com/your-repo/container-hub-plus"
!define UPDATEURL "https://github.com/your-repo/container-hub-plus/releases"
!define ABOUTURL "https://github.com/your-repo/container-hub-plus"
!define INSTALLSIZE 150000 ; Estimate in KB

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES64\${COMPANYNAME}\${APPNAME}"
LicenseData "..\LICENSE"
Name "${APPNAME}"
Icon "..\public\favicon.ico"
outFile "..\dist\DockSphere-Installer.exe"

!include LogicLib.nsh
!include "MUI2.nsh"

; Modern UI Configuration
!define MUI_ABORTWARNING
!define MUI_ICON "..\public\favicon.ico"
!define MUI_UNICON "..\public\favicon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; Default section
section "DockSphere Application" SecApp
    SectionIn RO ; Read only section
    
    ; Set output path to the installation directory
    setOutPath $INSTDIR
    
    ; Copy application files
    file /r "..\*"
    
    ; Create uninstaller
    writeUninstaller "$INSTDIR\uninstall.exe"
    
    ; Create start menu shortcuts
    createDirectory "$SMPROGRAMS\${COMPANYNAME}"
    createShortCut "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk" "$INSTDIR\start-app.bat" "" "$INSTDIR\public\favicon.ico"
    createShortCut "$SMPROGRAMS\${COMPANYNAME}\Service Manager.lnk" "$INSTDIR\windows-service\service-manager.bat" "" "$INSTDIR\public\favicon.ico"
    createShortCut "$SMPROGRAMS\${COMPANYNAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" ""
    
    ; Create desktop shortcut
    createShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\start-app.bat" "" "$INSTDIR\public\favicon.ico"
    
    ; Registry information for add/remove programs
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayName" "${APPNAME}"
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "QuietUninstallString" "$\"$INSTDIR\uninstall.exe$\" /S"
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "InstallLocation" "$\"$INSTDIR$\""
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayIcon" "$\"$INSTDIR\public\favicon.ico$\""
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "Publisher" "${COMPANYNAME}"
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "HelpLink" "${HELPURL}"
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "URLUpdateInfo" "${UPDATEURL}"
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "URLInfoAbout" "${ABOUTURL}"
    writeRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    writeRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "VersionMajor" ${VERSIONMAJOR}
    writeRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "VersionMinor" ${VERSIONMINOR}
    writeRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "NoModify" 1
    writeRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "NoRepair" 1
    writeRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" "EstimatedSize" ${INSTALLSIZE}
sectionEnd

; Windows Service section
section "Install as Windows Service" SecService
    ; Install node-windows if not present
    ExecWait '"$INSTDIR\install-dependencies.bat"'
    
    ; Install the service
    ExecWait '"node" "$INSTDIR\windows-service\install-service.js"'
sectionEnd

; Section descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecApp} "Install DockSphere Container Hub Plus application files"
    !insertmacro MUI_DESCRIPTION_TEXT ${SecService} "Install DockSphere as a Windows service (runs automatically on startup)"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Uninstaller section
section "Uninstall"
    ; Stop and remove service if it exists
    ExecWait '"node" "$INSTDIR\windows-service\uninstall-service.js"'
    
    ; Remove registry keys
    deleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}"
    
    ; Remove shortcuts
    delete "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk"
    delete "$SMPROGRAMS\${COMPANYNAME}\Service Manager.lnk"
    delete "$SMPROGRAMS\${COMPANYNAME}\Uninstall.lnk"
    rmDir "$SMPROGRAMS\${COMPANYNAME}"
    delete "$DESKTOP\${APPNAME}.lnk"
    
    ; Remove files and directories
    rmDir /r "$INSTDIR"
sectionEnd