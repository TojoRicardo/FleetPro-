<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/** Plans and permissions only — no demo tenants or users. */
class EssentialSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
            PermissionSeeder::class,
        ]);
    }
}
