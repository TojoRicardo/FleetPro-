<?php

namespace App\Console\Commands;

use App\Domain\Backup\BackupService;
use Illuminate\Console\Command;

class RestoreDatabaseCommand extends Command
{
    protected $signature = 'backup:restore {id : Backup run ID} {--force : Confirm restore in staging/production}';

    protected $description = 'Restore database from a backup run';

    public function handle(BackupService $backupService): int
    {
        if (! $this->option('force') && ! $this->confirm('This will overwrite the current database. Continue?')) {
            return self::SUCCESS;
        }

        try {
            $backupService->restore((int) $this->argument('id'), (bool) $this->option('force'));
            $this->info('Database restored successfully.');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Restore failed: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
