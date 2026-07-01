@echo off
title FleetPro - Starting...
echo.
echo  ========================================
echo   FleetPro - Fleet Management System
echo  ========================================
echo.

set "PHP_DIR=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe"
set "PATH=%PHP_DIR%;%PATH%"

cd /d "%~dp0"

if not exist "backend\vendor" (
    echo [setup] Installing backend dependencies...
    cd backend
    php "%PHP_DIR%\composer.phar" install --no-interaction
    cd ..
)

if not exist "backend\database\database.sqlite" (
    echo [setup] Creating database...
    type nul > "backend\database\database.sqlite"
    cd backend
    php artisan key:generate --force
    php artisan migrate --force --seed
    cd ..
)

if not exist "frontend\node_modules" (
    echo [setup] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env"

echo [1/2] Starting Backend API on http://localhost:9000 ...
start "FleetPro Backend" cmd /k "cd /d "%~dp0backend" && php artisan serve --host=127.0.0.1 --port=9000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend on http://localhost:5173 ...
start "FleetPro Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo  Backend:  http://localhost:9000
echo  Frontend: http://localhost:5173
echo  Login:    admin@fleetpro.com / password
echo.
start http://localhost:5173
echo  Servers running in separate windows.
pause
