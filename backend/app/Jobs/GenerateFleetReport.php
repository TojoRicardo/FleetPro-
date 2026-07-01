<?php

namespace App\Jobs;

use App\Models\User;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateFleetReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private User $user) {}

    public function handle(AuditLogRepositoryInterface $auditLogRepository): void
    {
        Log::info('Generating fleet report for user: '.$this->user->email);

        $auditLogRepository->log(
            $this->user->id,
            'report_generated',
            'report',
            null,
            ['generated_at' => now()->toIso8601String()]
        );
    }
}
