$base = 'http://localhost:9000/api/v1'
$results = @()

function Test-Api {
    param([string]$Name, [scriptblock]$Action)
    try {
        & $Action
        $script:results += [pscustomobject]@{ Test = $Name; Status = 'OK' }
        Write-Host "OK   $Name" -ForegroundColor Green
    } catch {
        $msg = $_.ErrorDetails.Message
        if (-not $msg) { $msg = $_.Exception.Message }
        $script:results += [pscustomobject]@{ Test = $Name; Status = "FAIL: $msg" }
        Write-Host "FAIL $Name -> $msg" -ForegroundColor Red
    }
}

# --- Auth (all demo accounts) ---
foreach ($acc in @(
    @{ email = 'admin@fleetpro.com'; role = 'super_admin' },
    @{ email = 'manager@fleetpro.com'; role = 'manager' },
    @{ email = 'mechanic@fleetpro.com'; role = 'mechanic' }
)) {
    Test-Api "Login $($acc.email)" {
        $r = Invoke-RestMethod -Uri "$base/login" -Method POST -Body (@{ email = $acc.email; password = 'password' } | ConvertTo-Json) -ContentType 'application/json'
        if (-not $r.data.token) { throw 'no token' }
        if ($r.data.user.role -ne $acc.role) { throw "role=$($r.data.user.role)" }
    }
}

$login = Invoke-RestMethod -Uri "$base/login" -Method POST -Body '{"email":"admin@fleetpro.com","password":"password"}' -ContentType 'application/json'
$token = $login.data.token
$h = @{ Authorization = "Bearer $token" }

Test-Api 'GET /me' {
    $r = Invoke-RestMethod -Uri "$base/me" -Headers $h
    if (-not $r.data.user) { throw 'no user' }
}

# --- Dashboard & analytics ---
Test-Api 'GET /dashboard' {
    Invoke-RestMethod -Uri "$base/dashboard" -Headers $h | Out-Null
}
Test-Api 'GET /analytics' {
    Invoke-RestMethod -Uri "$base/analytics" -Headers $h | Out-Null
}
Test-Api 'GET /audit-logs' {
    Invoke-RestMethod -Uri "$base/audit-logs?per_page=5" -Headers $h | Out-Null
}

# --- Notifications ---
Test-Api 'GET /notifications' {
    Invoke-RestMethod -Uri "$base/notifications?per_page=10" -Headers $h | Out-Null
}
Test-Api 'GET /notifications/unread-count' {
    Invoke-RestMethod -Uri "$base/notifications/unread-count" -Headers $h | Out-Null
}

# --- Billing ---
Test-Api 'GET /billing/subscription' {
    Invoke-RestMethod -Uri "$base/billing/subscription" -Headers $h | Out-Null
}
Test-Api 'GET /billing/plans' {
    Invoke-RestMethod -Uri "$base/billing/plans" -Headers $h | Out-Null
}
Test-Api 'GET /billing/invoices' {
    Invoke-RestMethod -Uri "$base/billing/invoices?per_page=5" -Headers $h | Out-Null
}

# --- Lookups ---
Test-Api 'GET /lookups/vehicles' {
    Invoke-RestMethod -Uri "$base/lookups/vehicles" -Headers $h | Out-Null
}
Test-Api 'GET /lookups/drivers' {
    Invoke-RestMethod -Uri "$base/lookups/drivers" -Headers $h | Out-Null
}

# --- Vehicles CRUD ---
$vehicleId = $null
$driverId = $null
$tripId = $null
$maintenanceId = $null
$assignmentId = $null
$assignVehicleId = $null
$assignDriverId = $null
$assignDriverId2 = $null
$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
Test-Api 'GET /vehicles' {
    $r = Invoke-RestMethod -Uri "$base/vehicles?per_page=15" -Headers $h
    if ($null -eq $r.data) { throw 'no data' }
}
Test-Api 'POST /vehicles (create)' {
    $body = (@{
        plate_number = "QA-$suffix"
        brand = 'QA'
        model = 'Test'
        year = 2024
        mileage = 1
        status = 'active'
    } | ConvertTo-Json -Compress)
    $r = Invoke-RestMethod -Uri "$base/vehicles" -Method POST -Headers $h -Body $body -ContentType 'application/json'
    $script:vehicleId = $r.data.id
    if (-not $vehicleId) { throw 'no id' }
}
if ($vehicleId) {
    Test-Api 'GET /vehicles/{id}' {
        Invoke-RestMethod -Uri "$base/vehicles/$vehicleId" -Headers $h | Out-Null
    }
    Test-Api 'PUT /vehicles/{id}' {
        $body = (@{
            plate_number = "QA-$suffix"
            brand = 'QA'
            model = 'Updated'
            year = 2024
            mileage = 2
            status = 'active'
        } | ConvertTo-Json -Compress)
        Invoke-RestMethod -Uri "$base/vehicles/$vehicleId" -Method PUT -Headers $h -Body $body -ContentType 'application/json' | Out-Null
    }
    Test-Api 'Vehicle appears in list after create' {
        $r = Invoke-RestMethod -Uri "$base/vehicles?per_page=50" -Headers $h
        $found = $r.data | Where-Object { $_.id -eq $vehicleId }
        if (-not $found) { throw 'not in list' }
    }
}

# --- Drivers CRUD ---
Test-Api 'GET /drivers' {
    Invoke-RestMethod -Uri "$base/drivers?per_page=15" -Headers $h | Out-Null
}
Test-Api 'POST /drivers (create)' {
    $body = (@{
        name = "QA Driver $suffix"
        license_number = "QA-LIC-$suffix"
        phone = '0600000000'
        status = 'available'
    } | ConvertTo-Json -Compress)
    $r = Invoke-RestMethod -Uri "$base/drivers" -Method POST -Headers $h -Body $body -ContentType 'application/json'
    $script:driverId = $r.data.id
    if (-not $driverId) { throw 'no id' }
}
if ($driverId) {
    Test-Api 'GET /drivers/{id}' {
        Invoke-RestMethod -Uri "$base/drivers/$driverId" -Headers $h | Out-Null
    }
    Test-Api 'PUT /drivers/{id}' {
        $body = (@{ name = "QA Driver Updated $suffix" } | ConvertTo-Json -Compress)
        Invoke-RestMethod -Uri "$base/drivers/$driverId" -Method PUT -Headers $h -Body $body -ContentType 'application/json' | Out-Null
    }
}

# --- Trips CRUD ---
Test-Api 'GET /trips' {
    Invoke-RestMethod -Uri "$base/trips?per_page=15" -Headers $h | Out-Null
}
if ($vehicleId -and $driverId) {
    Test-Api 'POST /trips (create)' {
        $body = (@{
            vehicle_id = $vehicleId
            driver_id = $driverId
            start_location = 'Paris'
            end_location = 'Lyon'
            start_time = '2026-06-28T08:00:00'
            status = 'scheduled'
        } | ConvertTo-Json -Compress)
        $r = Invoke-RestMethod -Uri "$base/trips" -Method POST -Headers $h -Body $body -ContentType 'application/json'
        $script:tripId = $r.data.id
        if (-not $tripId) { throw 'no id' }
    }
}
if ($tripId) {
    Test-Api 'GET /trips/{id}' {
        Invoke-RestMethod -Uri "$base/trips/$tripId" -Headers $h | Out-Null
    }
    Test-Api 'PUT /trips/{id}' {
        $body = (@{ end_location = 'Marseille' } | ConvertTo-Json -Compress)
        Invoke-RestMethod -Uri "$base/trips/$tripId" -Method PUT -Headers $h -Body $body -ContentType 'application/json' | Out-Null
    }
}

# --- Maintenance CRUD ---
Test-Api 'GET /maintenance' {
    Invoke-RestMethod -Uri "$base/maintenance?per_page=15" -Headers $h | Out-Null
}
if ($vehicleId) {
    Test-Api 'POST /maintenance (create)' {
        $body = (@{
            vehicle_id = $vehicleId
            type = 'Oil change'
            description = 'QA maintenance test'
            cost = 99.5
            maintenance_date = '2026-06-28'
        } | ConvertTo-Json -Compress)
        $r = Invoke-RestMethod -Uri "$base/maintenance" -Method POST -Headers $h -Body $body -ContentType 'application/json'
        $script:maintenanceId = $r.data.id
        if (-not $maintenanceId) { throw 'no id' }
    }
}
if ($maintenanceId) {
    Test-Api 'GET /maintenance/{id}' {
        Invoke-RestMethod -Uri "$base/maintenance/$maintenanceId" -Headers $h | Out-Null
    }
    Test-Api 'PUT /maintenance/{id}' {
        $body = (@{ cost = 120 } | ConvertTo-Json -Compress)
        Invoke-RestMethod -Uri "$base/maintenance/$maintenanceId" -Method PUT -Headers $h -Body $body -ContentType 'application/json' | Out-Null
    }
}

# --- Assignments CRUD ---
Test-Api 'GET /assignments' {
    Invoke-RestMethod -Uri "$base/assignments?per_page=15" -Headers $h | Out-Null
}
Test-Api 'POST /vehicles (for assignment)' {
    $body = (@{
        plate_number = "QA-ASN-$suffix"
        brand = 'QA'
        model = 'Assign'
        year = 2024
        mileage = 1
        status = 'active'
    } | ConvertTo-Json -Compress)
    $r = Invoke-RestMethod -Uri "$base/vehicles" -Method POST -Headers $h -Body $body -ContentType 'application/json'
    $script:assignVehicleId = $r.data.id
    if (-not $assignVehicleId) { throw 'no id' }
}
Test-Api 'POST /drivers (for assignment)' {
    $body = (@{
        name = "QA Assign Driver $suffix"
        license_number = "QA-ASN-LIC-$suffix"
        phone = '0611111111'
        status = 'available'
    } | ConvertTo-Json -Compress)
    $r = Invoke-RestMethod -Uri "$base/drivers" -Method POST -Headers $h -Body $body -ContentType 'application/json'
    $script:assignDriverId = $r.data.id
    if (-not $assignDriverId) { throw 'no id' }
}
Test-Api 'POST /drivers (reassign target)' {
    $body = (@{
        name = "QA Reassign Driver $suffix"
        license_number = "QA-REAS-LIC-$suffix"
        phone = '0622222222'
        status = 'available'
    } | ConvertTo-Json -Compress)
    $r = Invoke-RestMethod -Uri "$base/drivers" -Method POST -Headers $h -Body $body -ContentType 'application/json'
    $script:assignDriverId2 = $r.data.id
    if (-not $assignDriverId2) { throw 'no id' }
}
if ($assignVehicleId -and $assignDriverId) {
    Test-Api 'POST /assignments (create)' {
        $body = (@{ vehicle_id = $assignVehicleId; driver_id = $assignDriverId } | ConvertTo-Json -Compress)
        $r = Invoke-RestMethod -Uri "$base/assignments" -Method POST -Headers $h -Body $body -ContentType 'application/json'
        $script:assignmentId = $r.data.id
        if (-not $assignmentId) { throw 'no id' }
    }
}
if ($assignmentId) {
    Test-Api 'GET /assignments/{id}' {
        Invoke-RestMethod -Uri "$base/assignments/$assignmentId" -Headers $h | Out-Null
    }
    Test-Api 'PUT /assignments/{id}' {
        $body = (@{ driver_id = $assignDriverId2 } | ConvertTo-Json -Compress)
        Invoke-RestMethod -Uri "$base/assignments/$assignmentId" -Method PUT -Headers $h -Body $body -ContentType 'application/json' | Out-Null
    }
    Test-Api 'POST /assignments/{id}/unassign' {
        Invoke-RestMethod -Uri "$base/assignments/$assignmentId/unassign" -Method POST -Headers $h | Out-Null
    }
}

# --- Admin (super admin) ---
Test-Api 'GET /admin/tenants' {
    Invoke-RestMethod -Uri "$base/admin/tenants?per_page=10" -Headers $h | Out-Null
}
Test-Api 'GET /admin/analytics' {
    Invoke-RestMethod -Uri "$base/admin/analytics" -Headers $h | Out-Null
}

# --- Role restrictions (mechanic cannot access drivers list? check trips) ---
$mechLogin = Invoke-RestMethod -Uri "$base/login" -Method POST -Body '{"email":"mechanic@fleetpro.com","password":"password"}' -ContentType 'application/json'
$mh = @{ Authorization = "Bearer $($mechLogin.data.token)" }
Test-Api 'Mechanic GET /maintenance' {
    Invoke-RestMethod -Uri "$base/maintenance?per_page=5" -Headers $mh | Out-Null
}
Test-Api 'Mechanic GET /vehicles' {
    Invoke-RestMethod -Uri "$base/vehicles?per_page=5" -Headers $mh | Out-Null
}

# Cleanup test records (reverse dependency order)
if ($assignmentId) {
    Test-Api 'DELETE /assignments/{id}' {
        Invoke-RestMethod -Uri "$base/assignments/$assignmentId" -Method DELETE -Headers $h | Out-Null
    }
}
if ($tripId) {
    Test-Api 'DELETE /trips/{id}' {
        Invoke-RestMethod -Uri "$base/trips/$tripId" -Method DELETE -Headers $h | Out-Null
    }
}
if ($maintenanceId) {
    Test-Api 'DELETE /maintenance/{id}' {
        Invoke-RestMethod -Uri "$base/maintenance/$maintenanceId" -Method DELETE -Headers $h | Out-Null
    }
}
if ($driverId) {
    Test-Api 'DELETE /drivers/{id}' {
        Invoke-RestMethod -Uri "$base/drivers/$driverId" -Method DELETE -Headers $h | Out-Null
    }
}
if ($assignDriverId2) {
    Test-Api 'DELETE /drivers/{id} (reassign)' {
        Invoke-RestMethod -Uri "$base/drivers/$assignDriverId2" -Method DELETE -Headers $h | Out-Null
    }
}
if ($assignDriverId) {
    Test-Api 'DELETE /drivers/{id} (assignment)' {
        Invoke-RestMethod -Uri "$base/drivers/$assignDriverId" -Method DELETE -Headers $h | Out-Null
    }
}
if ($vehicleId) {
    Test-Api 'DELETE /vehicles/{id}' {
        Invoke-RestMethod -Uri "$base/vehicles/$vehicleId" -Method DELETE -Headers $h | Out-Null
    }
}
if ($assignVehicleId) {
    Test-Api 'DELETE /vehicles/{id} (assignment)' {
        Invoke-RestMethod -Uri "$base/vehicles/$assignVehicleId" -Method DELETE -Headers $h | Out-Null
    }
}

Test-Api 'POST /logout' {
    Invoke-RestMethod -Uri "$base/logout" -Method POST -Headers $h | Out-Null
}

Write-Host ""
$ok = ($results | Where-Object { $_.Status -eq 'OK' }).Count
$fail = ($results | Where-Object { $_.Status -ne 'OK' }).Count
Write-Host "=== SUMMARY: $ok passed, $fail failed / $($results.Count) total ===" -ForegroundColor Cyan
if ($fail -gt 0) {
    $results | Where-Object { $_.Status -ne 'OK' } | Format-Table -AutoSize
    exit 1
}
