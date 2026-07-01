<?php

namespace App\Repositories\Contracts;

interface AssignmentRepositoryInterface extends BaseRepositoryInterface
{
    public function findActiveByVehicle(int $vehicleId);

    public function findActiveByDriver(int $driverId);
}
