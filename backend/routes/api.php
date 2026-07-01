<?php

use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\ImportExportController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SaaSAnalyticsController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\GovernanceController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['force.json', 'security.headers', 'request.log'])->group(function () {
    Route::get('/health/live', [HealthController::class, 'liveness']);
    Route::get('/health/ready', [HealthController::class, 'readiness']);
    Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle']);

    Route::middleware('throttle:auth-login')->post('/login', [AuthController::class, 'login']);
    Route::middleware('throttle:auth-login')->post('/refresh', [AuthController::class, 'refresh']);
    Route::middleware('throttle:auth-register')->post('/register', [AuthController::class, 'register']);

    Route::middleware(['auth:sanctum', 'throttle:api', 'resolve.tenant'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/me', [AuthController::class, 'me']);

        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'show']);
            Route::put('/', [ProfileController::class, 'update']);
            Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
            Route::delete('/avatar', [ProfileController::class, 'deleteAvatar']);
            Route::put('/password', [ProfileController::class, 'updatePassword']);
            Route::get('/sessions', [ProfileController::class, 'sessions']);
            Route::get('/activity', [ProfileController::class, 'activity']);
            Route::delete('/sessions/{tokenId}', [ProfileController::class, 'revokeSession']);
            Route::get('/export', [GovernanceController::class, 'exportData']);
            Route::post('/delete-account', [GovernanceController::class, 'deleteAccount']);
        });

        // Super admin routes (no tenant scope required)
        Route::middleware('super.admin')->prefix('admin')->group(function () {
            Route::get('/tenants', [SuperAdminController::class, 'tenants']);
            Route::get('/tenants/{tenant}', [SuperAdminController::class, 'showTenant']);
            Route::post('/tenants/{tenant}/suspend', [SuperAdminController::class, 'suspendTenant']);
            Route::post('/tenants/{tenant}/activate', [SuperAdminController::class, 'activateTenant']);
            Route::get('/analytics', [SuperAdminController::class, 'analytics']);
            Route::get('/logs', [SuperAdminController::class, 'globalLogs']);
        });

        // Tenant-scoped routes
        Route::middleware('tenant.scope')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'statistics']);
            Route::get('/metrics', [HealthController::class, 'metrics'])->middleware('role:admin,super_admin');
            Route::get('/analytics', [SaaSAnalyticsController::class, 'tenantMetrics']);
            Route::get('/audit-logs', [DashboardController::class, 'auditLogs'])->middleware('role:admin,manager');
            Route::get('/audit-logs/stats', [DashboardController::class, 'auditLogStats'])->middleware('role:admin,manager');
            Route::get('/audit-logs/export', [DashboardController::class, 'exportAuditLogs'])->middleware('role:admin,manager');
            Route::post('/reports/generate', [DashboardController::class, 'generateReport'])->middleware('role:admin,manager');

            Route::get('/lookups/vehicles', [LookupController::class, 'vehicles']);
            Route::get('/lookups/drivers', [LookupController::class, 'drivers']);

            // Notifications
            Route::get('/notifications', [NotificationController::class, 'index']);
            Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

            // Billing
            Route::prefix('billing')->group(function () {
                Route::get('/subscription', [BillingController::class, 'subscription']);
                Route::get('/plans', [BillingController::class, 'plans']);
                Route::post('/subscribe', [BillingController::class, 'subscribe'])->middleware('role:admin');
                Route::post('/cancel', [BillingController::class, 'cancel'])->middleware('role:admin');
                Route::get('/revenue', [BillingController::class, 'revenue']);
                Route::get('/invoices', [BillingController::class, 'invoices']);
                Route::get('/invoices/{invoice}', [BillingController::class, 'showInvoice']);
                Route::post('/invoices/{invoice}/pay', [BillingController::class, 'payInvoice'])->middleware('role:admin');
            });

            // Documents
            Route::apiResource('documents', DocumentController::class)->except(['update']);

            // Import / Export
            Route::prefix('import-export')->group(function () {
                Route::post('/vehicles/import', [ImportExportController::class, 'importVehicles'])->middleware('role:admin,manager');
                Route::post('/drivers/import', [ImportExportController::class, 'importDrivers'])->middleware('role:admin,manager');
                Route::get('/vehicles/export', [ImportExportController::class, 'exportVehicles'])->middleware('role:admin,manager');
                Route::get('/drivers/export', [ImportExportController::class, 'exportDrivers'])->middleware('role:admin,manager');
                Route::post('/reports/pdf', [ImportExportController::class, 'generatePdfReport'])->middleware('role:admin,manager');
            });

            Route::apiResource('vehicles', VehicleController::class)
                ->middleware('plan.limit:vehicles');
            Route::apiResource('drivers', DriverController::class)
                ->middleware('plan.limit:drivers');
            Route::apiResource('trips', TripController::class);
            Route::apiResource('maintenance', MaintenanceController::class);

            Route::middleware('role:admin')->group(function () {
                Route::apiResource('assignments', AssignmentController::class);
                Route::post('/assignments/{assignment}/unassign', [AssignmentController::class, 'unassign']);
            });
        });
    });
});
