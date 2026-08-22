@echo off
cd /d "%~dp0"
echo.
echo ============================================================
echo     ASCEND // SYSTEM v0.6.0.4 // SHAREABLE ENCRYPTED BETA
echo ============================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js 20+ and run this file again.
  pause
  exit /b 1
)

set "ASCEND_URL=http://localhost:3000"
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME (
  start "" "%CHROME%" "%ASCEND_URL%"
) else (
  start "" "%ASCEND_URL%"
)

node server.mjs
pause
