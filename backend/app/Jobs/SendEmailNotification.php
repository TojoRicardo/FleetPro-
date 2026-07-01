<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendEmailNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $type,
        public string $subject,
        public string $body,
    ) {}

    public function handle(): void
    {
        Log::info('[Email Mock] Notification sent', [
            'type' => $this->type,
            'subject' => $this->subject,
            'body' => $this->body,
        ]);
    }
}
