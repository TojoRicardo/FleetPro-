<?php

namespace App\Services;

use App\Repositories\Contracts\VehicleRepositoryInterface;

class VehicleService extends AbstractEntityService
{
    public function __construct(VehicleRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }
}
