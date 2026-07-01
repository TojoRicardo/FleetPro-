<?php

namespace App\Repositories\Contracts;

interface DashboardRepositoryInterface
{
    /**
     * Fetch all dashboard metrics in a single optimized SQL query.
     */
    public function getAggregatedStatistics(): array;
}
