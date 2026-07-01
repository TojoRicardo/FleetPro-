<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_liveness_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/v1/health/live');

        $response->assertOk()
            ->assertJsonStructure(['success', 'message', 'code', 'data'])
            ->assertJsonPath('data.status', 'ok');
    }

    public function test_readiness_endpoint_checks_database(): void
    {
        $response = $this->getJson('/api/v1/health/ready');

        $response->assertOk()
            ->assertJsonPath('data.checks.database.status', 'ok');
    }
}
