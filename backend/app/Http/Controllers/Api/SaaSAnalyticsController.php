<?php

namespace App\Http\Controllers\Api;

use App\Domain\Analytics\SaaSAnalyticsService;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

class SaaSAnalyticsController extends Controller
{
    use ApiResponse;

    public function __construct(private SaaSAnalyticsService $analyticsService) {}

    public function tenantMetrics()
    {
        return $this->success($this->analyticsService->getTenantDashboard());
    }
}
