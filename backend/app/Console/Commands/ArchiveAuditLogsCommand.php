<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ArchiveAuditLogsCommand extends Command
{
    protected $signature = 'governance:archive-logs {--days=365 : Delete logs older than N days}';

    protected $description = 'Archive (delete) audit logs older than retention period';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $deleted = DB::table('logs')->where('created_at', '<', $cutoff)->delete();

        $this->info("Archived {$deleted} audit log entries older than {$days} days.");

        return self::SUCCESS;
    }
}
