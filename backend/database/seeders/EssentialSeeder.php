<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/** Plans only — no demo tenants or users. */
class EssentialSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
        ]);
    }
}
