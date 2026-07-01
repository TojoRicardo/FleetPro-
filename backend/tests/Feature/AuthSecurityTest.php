<?php

namespace Tests\Feature;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_login_is_audited(): void
    {
        User::factory()->create(['email' => 'test@fleetpro.com', 'password' => 'password']);

        $this->postJson('/api/v1/login', [
            'email' => 'test@fleetpro.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);

        $this->assertDatabaseHas('login_attempts', [
            'email' => 'test@fleetpro.com',
            'success' => false,
        ]);
    }

    public function test_successful_login_returns_token(): void
    {
        User::factory()->create(['email' => 'test@fleetpro.com', 'password' => 'password']);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'test@fleetpro.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['success', 'data' => ['token', 'user']]);
    }
}
