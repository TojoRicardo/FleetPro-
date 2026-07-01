# FleetPro — full data reset (database + server-side app data)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

Write-Host "Resetting FleetPro database (empty, no demo data)..." -ForegroundColor Cyan
Push-Location "$Root\backend"
php artisan migrate:fresh --force
php artisan db:seed --class=EssentialSeeder --force
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
Pop-Location

Write-Host "Clearing sessions and logs..." -ForegroundColor Cyan
Get-ChildItem "$Root\backend\storage\framework\sessions\*" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem "$Root\backend\storage\logs\*.log" -File -ErrorAction SilentlyContinue | ForEach-Object { Clear-Content $_.FullName }

Write-Host ""
Write-Host "Reset complete. Database is empty (plans/permissions only)." -ForegroundColor Green
Write-Host "Create an account at http://localhost:5173/register" -ForegroundColor White
Write-Host "Then hard-refresh the browser (Ctrl+Shift+R) to clear local app data." -ForegroundColor Yellow
