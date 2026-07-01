<?php

use Illuminate\Support\Facades\Route;

/*
| API v2 — Future-ready stub.
| New endpoints will be added here without breaking v1 clients.
*/

Route::prefix('v2')->middleware(['force.json', 'security.headers'])->group(function () {
    Route::middleware(['auth:sanctum', 'throttle:api', 'resolve.tenant'])->group(function () {
        Route::get('/health', fn () => response()->json([
            'success' => true,
            'message' => 'FleetPro API v2 is ready.',
            'version' => '2.0.0',
        ]));
    });
});
