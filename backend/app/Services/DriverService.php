<?php

namespace App\Services;

use App\Repositories\Contracts\DriverRepositoryInterface;

class DriverService extends AbstractEntityService
{
    public function __construct(DriverRepositoryInterface $repository)
    {
        parent::__construct($repository);
    }
}
