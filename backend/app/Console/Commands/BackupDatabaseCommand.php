<?php

namespace App\Console\Commands;

use App\Domain\Backup\BackupService;
use Illuminate\Console\Command;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'backup:database {--trigger=manual : scheduled or manual}';

    protected $description = 'Create a database backup';

    public function handle(BackupService $backupService): int
    {
        if (! config('backup.enabled')) {
            $this->warn('Backups are disabled (BACKUP_ENABLED=false).');

            return self::SUCCESS;
        }

        try {
            $run = $backupService->create($this->option('trigger'));
            $this->info("Backup completed: {$run->filename} ({$run->size_bytes} bytes)");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Backup failed: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
