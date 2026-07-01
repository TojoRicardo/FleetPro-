<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_access_other_tenant_vehicle(): void
    {
        $tenantA = Tenant::create(['name' => 'A', 'slug' => 'a', 'status' => 'active']);
        $tenantB = Tenant::create(['name' => 'B', 'slug' => 'b', 'status' => 'active']);

        $userA = User::factory()->create(['tenant_id' => $tenantA->id]);
        $vehicleB = Vehicle::create([
            'tenant_id' => $tenantB->id,
            'plate_number' => 'XYZ-999',
            'brand' => 'Ford',
            'model' => 'Transit',
            'year' => 2022,
            'mileage' => 1000,
            'status' => 'active',
        ]);

        $token = $userA->createAuthToken()->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-Id', (string) $tenantA->id)
            ->getJson("/api/v1/vehicles/{$vehicleB->id}")
            ->assertStatus(403);
    }
}
