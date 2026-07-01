<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:database --trigger=scheduled')
    ->cron(config('backup.schedule', '0 2 * * *'))
    ->when(fn () => config('backup.enabled'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    app(\App\Domain\Billing\PaymentService::class)->markOverdueInvoices();
})->daily();

Schedule::call(function () {
    app(\App\Domain\Backup\BackupService::class)->purgeExpired();
})->daily();

Schedule::command('governance:archive-logs')
    ->weekly()
    ->when(fn () => config('app.env') !== 'local');
