<?php

namespace App\Domain\Backup;

use App\Models\BackupRun;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class BackupService
{
    public function create(string $trigger = 'manual'): BackupRun
    {
        $driver = config('database.default');
        $disk = config('backup.disk', 'local');
        $basePath = config('backup.path', 'backups/database');
        $timestamp = now()->format('Y-m-d_His');
        $filename = "fleetpro_{$driver}_{$timestamp}.sql";
        $relativePath = "{$basePath}/{$filename}";

        $run = BackupRun::create([
            'filename' => $filename,
            'disk' => $disk,
            'path' => $relativePath,
            'driver' => $driver,
            'trigger' => $trigger,
            'status' => 'started',
            'retention_until' => now()->addDays((int) config('backup.retention_days', 30)),
        ]);

        try {
            Storage::disk($disk)->makeDirectory($basePath);
            $absolutePath = Storage::disk($disk)->path($relativePath);

            if ($driver === 'pgsql') {
                $this->backupPostgres($absolutePath);
            } elseif ($driver === 'sqlite') {
                $this->backupSqlite($absolutePath, $filename);
            } else {
                throw new \RuntimeException("Unsupported database driver for backup: {$driver}");
            }

            $size = File::exists($absolutePath) ? File::size($absolutePath) : 0;

            $run->update([
                'status' => 'completed',
                'size_bytes' => $size,
            ]);

            $this->purgeExpired();

            return $run->fresh();
        } catch (\Throwable $e) {
            $run->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function restore(int $backupId, bool $force = false): void
    {
        $run = BackupRun::findOrFail($backupId);

        if ($run->status !== 'completed') {
            throw new \RuntimeException('Cannot restore from a failed or incomplete backup.');
        }

        if (! $force && ! app()->environment('local', 'staging')) {
            throw new \RuntimeException('Restore requires --force in non-local environments.');
        }

        $absolutePath = Storage::disk($run->disk)->path($run->path);

        if (! File::exists($absolutePath)) {
            throw new \RuntimeException("Backup file not found: {$run->path}");
        }

        if ($run->driver === 'pgsql') {
            $this->restorePostgres($absolutePath);
        } elseif ($run->driver === 'sqlite') {
            $this->restoreSqlite($absolutePath);
        } else {
            throw new \RuntimeException("Unsupported database driver for restore: {$run->driver}");
        }
    }

    public function history(int $limit = 50)
    {
        return BackupRun::orderByDesc('created_at')->limit($limit)->get();
    }

    public function purgeExpired(): int
    {
        $expired = BackupRun::where('retention_until', '<', now())->get();
        $count = 0;

        foreach ($expired as $run) {
            if (Storage::disk($run->disk)->exists($run->path)) {
                Storage::disk($run->disk)->delete($run->path);
            }
            $run->delete();
            $count++;
        }

        return $count;
    }

    private function backupPostgres(string $absolutePath): void
    {
        $config = config('database.connections.pgsql');
        $binary = config('backup.pg_dump_binary', 'pg_dump');

        $process = new Process([
            $binary,
            '--host='.$config['host'],
            '--port='.$config['port'],
            '--username='.$config['username'],
            '--format=plain',
            '--no-owner',
            '--file='.$absolutePath,
            $config['database'],
        ]);

        $process->setEnv(array_filter([
            'PGPASSWORD' => $config['password'] ?? '',
        ]));

        $process->setTimeout(600);
        $process->mustRun();
    }

    private function backupSqlite(string $absolutePath, string $filename): void
    {
        $dbPath = config('database.connections.sqlite.database');
        File::copy($dbPath, str_replace('.sql', '.sqlite', $absolutePath));
    }

    private function restorePostgres(string $absolutePath): void
    {
        $config = config('database.connections.pgsql');
        $binary = env('PSQL_BINARY', 'psql');

        DB::disconnect();

        $process = new Process([
            $binary,
            '--host='.$config['host'],
            '--port='.$config['port'],
            '--username='.$config['username'],
            '--dbname='.$config['database'],
            '--file='.$absolutePath,
        ]);

        $process->setEnv(array_filter([
            'PGPASSWORD' => $config['password'] ?? '',
        ]));

        $process->setTimeout(600);
        $process->mustRun();
    }

    private function restoreSqlite(string $absolutePath): void
    {
        $dbPath = config('database.connections.sqlite.database');
        File::copy($absolutePath, $dbPath);
    }
}
