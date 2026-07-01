<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Driver;
use App\Models\Maintenance;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\Trip;
use App\Models\User;
use App\Models\Vehicle;
use App\Domain\Feature\FeatureFlagService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
            PermissionSeeder::class,
        ]);

        $freePlan = Plan::where('slug', 'free')->first();
        $featureFlags = app(FeatureFlagService::class);

        $tenant = Tenant::create([
            'name' => 'Acme Logistics',
            'slug' => 'acme-logistics',
            'email' => 'admin@fleetpro.com',
            'plan_id' => $freePlan->id,
            'status' => 'active',
            'stripe_customer_id' => 'cus_mock_acme',
        ]);

        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $freePlan->id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'billing_cycle' => 'monthly',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);

        $featureFlags->seedDefaults($tenant->id);

        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin User',
            'email' => 'admin@fleetpro.com',
            'password' => 'password',
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Fleet Manager',
            'email' => 'manager@fleetpro.com',
            'password' => 'password',
            'role' => 'manager',
            'status' => 'active',
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Workshop Mechanic',
            'email' => 'mechanic@fleetpro.com',
            'password' => 'password',
            'role' => 'mechanic',
            'status' => 'active',
        ]);

        $vehicles = [
            ['plate_number' => 'ABC-1234', 'brand' => 'Mercedes-Benz', 'model' => 'Sprinter', 'year' => 2022, 'mileage' => 45000, 'status' => 'active'],
            ['plate_number' => 'XYZ-5678', 'brand' => 'Ford', 'model' => 'Transit', 'year' => 2021, 'mileage' => 62000, 'status' => 'active'],
            ['plate_number' => 'DEF-9012', 'brand' => 'Volkswagen', 'model' => 'Crafter', 'year' => 2023, 'mileage' => 18000, 'status' => 'maintenance'],
            ['plate_number' => 'GHI-3456', 'brand' => 'Iveco', 'model' => 'Daily', 'year' => 2020, 'mileage' => 98000, 'status' => 'active'],
            ['plate_number' => 'JKL-7890', 'brand' => 'Renault', 'model' => 'Master', 'year' => 2019, 'mileage' => 120000, 'status' => 'inactive'],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::create(array_merge($vehicle, ['tenant_id' => $tenant->id]));
        }

        $drivers = [
            ['name' => 'John Smith', 'license_number' => 'DL-001234', 'phone' => '+1-555-0101', 'status' => 'available', 'score' => 4.8],
            ['name' => 'Maria Garcia', 'license_number' => 'DL-005678', 'phone' => '+1-555-0102', 'status' => 'on_trip', 'score' => 4.5],
            ['name' => 'David Chen', 'license_number' => 'DL-009012', 'phone' => '+1-555-0103', 'status' => 'available', 'score' => 4.9],
            ['name' => 'Sarah Johnson', 'license_number' => 'DL-003456', 'phone' => '+1-555-0104', 'status' => 'unavailable', 'score' => 4.2],
        ];

        foreach ($drivers as $driver) {
            Driver::create(array_merge($driver, ['tenant_id' => $tenant->id]));
        }

        Assignment::create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => 1,
            'driver_id' => 1,
            'assigned_at' => now()->subDays(5),
            'status' => 'active',
        ]);

        Trip::create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => 2,
            'driver_id' => 2,
            'start_location' => 'New York, NY',
            'end_location' => 'Boston, MA',
            'start_time' => now()->subHours(3),
            'distance' => 215.5,
            'cost_estimation' => 125.00,
            'status' => 'ongoing',
        ]);

        Trip::create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => 1,
            'driver_id' => 1,
            'start_location' => 'Chicago, IL',
            'end_location' => 'Detroit, MI',
            'start_time' => now()->subDays(2),
            'end_time' => now()->subDays(2)->addHours(5),
            'distance' => 283.0,
            'cost_estimation' => 180.00,
            'status' => 'completed',
        ]);

        Maintenance::create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => 3,
            'type' => 'Oil Change',
            'description' => 'Full synthetic oil change and filter replacement',
            'cost' => 89.99,
            'maintenance_date' => now()->subDays(1),
            'status' => 'done',
        ]);

        Maintenance::create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => 4,
            'type' => 'Brake Service',
            'description' => 'Front brake pad replacement',
            'cost' => 350.00,
            'maintenance_date' => now()->subDays(10),
            'status' => 'done',
        ]);

        Maintenance::create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => 1,
            'type' => 'Tire Rotation',
            'description' => 'Standard tire rotation and pressure check',
            'cost' => 45.00,
            'maintenance_date' => now()->addDays(7),
            'status' => 'planned',
        ]);

        $proPlan = Plan::where('slug', 'pro')->first();

        $tenant2 = Tenant::create([
            'name' => 'Global Transport Co',
            'slug' => 'global-transport',
            'email' => 'admin@globaltransport.com',
            'plan_id' => $proPlan->id,
            'status' => 'active',
        ]);

        Subscription::create([
            'tenant_id' => $tenant2->id,
            'plan_id' => $proPlan->id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'billing_cycle' => 'monthly',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ]);

        $featureFlags->seedDefaults($tenant2->id);

        User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Global Admin',
            'email' => 'admin@globaltransport.com',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
        ]);
    }
}
