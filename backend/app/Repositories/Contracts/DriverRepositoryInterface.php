<?php

namespace App\Repositories\Contracts;

interface DriverRepositoryInterface extends BaseRepositoryInterface
{
    public function getTotalCount(): int;
}
