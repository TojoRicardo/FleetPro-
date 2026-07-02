<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('backup:database --trigger=scheduled')
    ->cron(config('backup.schedule', '0 2 * * *'))
    ->when(fn () => config('backup.enabled'))
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    app(\App\Domain\Billing\PaymentService::class)->markOverdueInvoices();
})->daily();

Schedule::command('billing:generate-invoices')
    ->cron('5 0 1 * *')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::call(function () {
    app(\App\Domain\Backup\BackupService::class)->purgeExpired();
})->daily();

Schedule::command('governance:archive-logs')
    ->weekly()
    ->when(fn () => config('app.env') !== 'local');
