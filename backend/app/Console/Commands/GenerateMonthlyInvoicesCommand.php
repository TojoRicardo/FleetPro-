<?php

namespace App\Console\Commands;

use App\Domain\Billing\InvoiceGenerationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateMonthlyInvoicesCommand extends Command
{
    protected $signature = 'billing:generate-invoices {--date= : Simulate run date (Y-m-d)}';

    protected $description = 'Generate monthly invoices for active subscriptions';

    public function handle(InvoiceGenerationService $service): int
    {
        $runDate = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : null;

        $summary = $service->generateMonthlyInvoices($runDate);

        if ($summary['locked']) {
            $this->warn("Invoice generation already running or completed for {$summary['period']}.");

            return self::SUCCESS;
        }

        $this->info("Period: {$summary['period']}");
        $this->info("Generated: {$summary['generated']}, skipped: {$summary['skipped']}, errors: ".count($summary['errors']));

        foreach ($summary['errors'] as $error) {
            $this->error("Subscription {$error['subscription_id']}: {$error['message']}");
        }

        return empty($summary['errors']) ? self::SUCCESS : self::FAILURE;
    }
}
