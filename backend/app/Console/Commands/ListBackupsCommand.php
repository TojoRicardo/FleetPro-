<?php

namespace App\Console\Commands;

use App\Domain\Backup\BackupService;
use Illuminate\Console\Command;

class ListBackupsCommand extends Command
{
    protected $signature = 'backup:list';

    protected $description = 'List database backup history';

    public function handle(BackupService $backupService): int
    {
        $backups = $backupService->history();

        if ($backups->isEmpty()) {
            $this->info('No backups found.');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Filename', 'Driver', 'Trigger', 'Status', 'Size', 'Created'],
            $backups->map(fn ($b) => [
                $b->id,
                $b->filename,
                $b->driver,
                $b->trigger,
                $b->status,
                number_format($b->size_bytes).' B',
                $b->created_at?->toDateTimeString(),
            ])
        );

        return self::SUCCESS;
    }
}
