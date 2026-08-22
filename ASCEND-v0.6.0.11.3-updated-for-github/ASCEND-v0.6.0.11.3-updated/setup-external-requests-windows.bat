@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-external-requests-windows.ps1"
if errorlevel 1 (
  echo.
  echo Setup failed. Read the message above and try again.
)
pause
