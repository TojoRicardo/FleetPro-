<?php

namespace App\Repositories\Contracts;

interface MaintenanceRepositoryInterface extends BaseRepositoryInterface
{
    public function getTotalCost(): float;
}
