$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PhpDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe"
$BackendPort = 9000
$FrontendPort = 5173
$env:Path = "$PhpDir;" + [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host " ========================================" -ForegroundColor Cyan
Write-Host "  FleetPro - Fleet Management System" -ForegroundColor Cyan
Write-Host " ========================================" -ForegroundColor Cyan
Write-Host ""

Push-Location "$Root\backend"
if (-not (Test-Path "vendor")) {
    Write-Host "[setup] Installing backend dependencies..." -ForegroundColor Yellow
    php "$PhpDir\composer.phar" config audit.block-insecure false
    php "$PhpDir\composer.phar" install --no-interaction
}
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" -Force | Out-Null
}
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
if ((Get-Content ".env" -Raw) -notmatch "APP_KEY=base64:") {
    php artisan key:generate --force | Out-Null
}
if ((php artisan migrate:status 2>&1) -match "Pending") {
    php artisan migrate --force | Out-Null
    php artisan db:seed --class=EssentialSeeder --force | Out-Null
}
Pop-Location

Push-Location "$Root\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "[setup] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}
"VITE_API_URL=/api/v1`nVITE_ENABLE_WS=false" | Set-Content ".env"
Pop-Location

Push-Location "$Root\api"
if (-not (Test-Path "node_modules")) {
    Write-Host "[setup] Installing billing API dependencies..." -ForegroundColor Yellow
    npm install
}
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    (Get-Content "$Root\backend\.env" -Raw) -match 'DB_PASSWORD=(.+)' | Out-Null
    $dbPass = if ($Matches) { $Matches[1].Trim() } else { 'secret' }
    $dbUrl = "postgresql://postgres:${dbPass}@127.0.0.1:5432/fleetpro?schema=public"
    @"
DATABASE_URL=$dbUrl
PORT=5000
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
BIND_HOST=127.0.0.1
INVOICE_CRON=5 0 1 * *
"@ | Set-Content ".env"
}
npx prisma migrate deploy 2>$null
Pop-Location

Push-Location "$Root\billing-worker"
if (-not (Test-Path "node_modules")) {
    Write-Host "[setup] Installing billing-worker dependencies..." -ForegroundColor Yellow
    npm install
}
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    (Get-Content "$Root\backend\.env" -Raw) -match 'DB_HOST=(.+)' | Out-Null
    $dbHost = if ($Matches) { $Matches[1].Trim() } else { '127.0.0.1' }
    (Get-Content "$Root\backend\.env" -Raw) -match 'DB_PORT=(.+)' | Out-Null
    $dbPort = if ($Matches) { $Matches[1].Trim() } else { '5432' }
    (Get-Content "$Root\backend\.env" -Raw) -match 'DB_DATABASE=(.+)' | Out-Null
    $dbName = if ($Matches) { $Matches[1].Trim() } else { 'fleetpro' }
    (Get-Content "$Root\backend\.env" -Raw) -match 'DB_USERNAME=(.+)' | Out-Null
    $dbUser = if ($Matches) { $Matches[1].Trim() } else { 'postgres' }
    (Get-Content "$Root\backend\.env" -Raw) -match 'DB_PASSWORD=(.+)' | Out-Null
    $dbPass = if ($Matches) { $Matches[1].Trim() } else { 'secret' }
    @"
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_DATABASE=$dbName
DB_USERNAME=$dbUser
DB_PASSWORD=$dbPass
INVOICE_CRON=5 0 1 * *
JOB_LOCK_TTL_MINUTES=120
LOG_LEVEL=info
"@ | Set-Content ".env"
}
Pop-Location

Write-Host "[1/4] Starting Backend       -> http://localhost:$BackendPort" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; `$env:Path='$PhpDir;' + `$env:Path; php artisan serve --host=127.0.0.1 --port=$BackendPort"

Start-Sleep -Seconds 2

Write-Host "[2/4] Starting Billing API   -> http://localhost:5000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\api'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[3/4] Starting Frontend      -> http://localhost:$FrontendPort" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[4/4] Starting Billing Worker (monthly invoices cron)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\billing-worker'; npm start"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "  Backend:         http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Billing API:     http://localhost:5000/api" -ForegroundColor White
Write-Host "  Frontend:        http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  Billing Worker:  cron 1st of month (00:05 UTC)" -ForegroundColor White
Write-Host "  Register: http://localhost:$FrontendPort/register" -ForegroundColor Yellow
Write-Host ""

Start-Process "http://localhost:$FrontendPort"
Write-Host "Servers started in separate windows." -ForegroundColor Green
