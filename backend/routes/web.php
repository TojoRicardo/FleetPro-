<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'FleetPro API',
        'version' => '1.0.0',
        'status' => 'running',
    ]);
});
