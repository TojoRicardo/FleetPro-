<?php

namespace App\Interfaces\Http\Controllers;

/**
 * Marker namespace for DDD-lite architecture.
 * New controllers should be placed here as the API grows.
 * Existing controllers remain in App\Http\Controllers\Api for backward compatibility.
 */
abstract class BaseApiController extends \App\Http\Controllers\Controller
{
    use \App\Traits\ApiResponse;
}
