<?php

namespace App\Repositories\Contracts;

interface TripRepositoryInterface extends BaseRepositoryInterface
{
    public function countOngoing(): int;
}
