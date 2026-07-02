<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For small fleets getting started',
                'price' => 19,
                'vehicle_limit' => 10,
                'price_monthly' => 19,
                'price_yearly' => 182.4,
                'max_vehicles' => 10,
                'max_users' => 5,
                'max_drivers' => 20,
                'features' => ['basic_dashboard', 'audit_logs'],
                'is_active' => true,
            ],
            [
                'name' => 'Business Standard',
                'slug' => 'business',
                'description' => 'For growing businesses',
                'price' => 49,
                'vehicle_limit' => 50,
                'price_monthly' => 49,
                'price_yearly' => 470.4,
                'max_vehicles' => 50,
                'max_users' => 15,
                'max_drivers' => 100,
                'features' => ['basic_dashboard', 'audit_logs', 'analytics'],
                'is_active' => true,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'For high-growth organizations',
                'price' => 149,
                'vehicle_limit' => 200,
                'price_monthly' => 149,
                'price_yearly' => 1430.4,
                'max_vehicles' => 200,
                'max_users' => 50,
                'max_drivers' => 500,
                'features' => ['basic_dashboard', 'audit_logs', 'analytics', 'billing'],
                'is_active' => true,
                'stripe_price_id' => 'price_mock_pro',
            ],
            [
                'name' => 'Enterprise Premium',
                'slug' => 'enterprise',
                'description' => 'Unlimited scale for large organizations',
                'price' => 399,
                'vehicle_limit' => 500,
                'price_monthly' => 399,
                'price_yearly' => 3830.4,
                'max_vehicles' => 500,
                'max_users' => 100,
                'max_drivers' => 1000,
                'features' => ['basic_dashboard', 'audit_logs', 'analytics', 'billing', 'api_access', 'priority_support'],
                'is_active' => true,
                'stripe_price_id' => 'price_mock_enterprise',
            ],
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Legacy free tier',
                'price' => 0,
                'vehicle_limit' => 5,
                'price_monthly' => 0,
                'price_yearly' => 0,
                'max_vehicles' => 5,
                'max_users' => 3,
                'max_drivers' => 10,
                'features' => ['basic_dashboard'],
                'is_active' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
