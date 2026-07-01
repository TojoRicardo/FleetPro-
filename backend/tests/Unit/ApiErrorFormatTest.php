<?php

namespace Tests\Unit;

use App\Support\ApiErrorCode;
use App\Support\ApiExceptionRenderer;
use Tests\TestCase;

class ApiErrorFormatTest extends TestCase
{
    public function test_error_response_includes_code(): void
    {
        $response = ApiExceptionRenderer::json('Forbidden.', 403, ApiErrorCode::Forbidden);

        $this->assertSame(403, $response->getStatusCode());
        $payload = json_decode($response->getContent(), true);
        $this->assertFalse($payload['success']);
        $this->assertSame('FORBIDDEN', $payload['code']);
    }
}
