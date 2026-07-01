<?php

namespace App\Repositories\Contracts;

interface VehicleRepositoryInterface extends BaseRepositoryInterface
{
    public function countByStatus(string $status): int;

    public function getTotalCount(): int;
}
