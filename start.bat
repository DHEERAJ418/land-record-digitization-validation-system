@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 18+ and run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\express\package.json" (
  echo Installing project dependencies. This may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Please run npm install manually.
    pause
    exit /b 1
  )
)
echo Starting BhuRakshak...
call npm start
pause
