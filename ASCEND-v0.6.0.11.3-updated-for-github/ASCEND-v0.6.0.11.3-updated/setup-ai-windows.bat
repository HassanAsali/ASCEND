@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-ai-windows.ps1"
if errorlevel 1 (
  echo.
  echo AI setup did not complete.
)
echo.
pause
