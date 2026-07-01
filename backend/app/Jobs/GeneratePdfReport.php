<?php

namespace App\Jobs;

use App\Services\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GeneratePdfReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $userId,
        public string $reportType = 'fleet_summary',
    ) {}

    public function handle(TenantContext $tenantContext): void
    {
        $tenantContext->setId($this->tenantId);

        Log::info('[PDF Report Mock] Generated report', [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->userId,
            'type' => $this->reportType,
        ]);
    }
}
