<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (! Schema::hasColumn('plans', 'price_per_vehicle')) {
                $table->decimal('price_per_vehicle', 10, 2)->default(0)->after('price_yearly');
            }
        });

        if (Schema::hasColumn('plans', 'price_per_vehicle') && Schema::hasColumn('plans', 'price_monthly')) {
            DB::table('plans')
                ->where('price_per_vehicle', 0)
                ->update(['price_per_vehicle' => DB::raw('price_monthly')]);
        }

        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'billing_period')) {
                $table->date('billing_period')->nullable()->after('status');
            }
            if (! Schema::hasColumn('invoices', 'vehicle_count')) {
                $table->unsignedInteger('vehicle_count')->default(0)->after('billing_period');
            }
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::table('invoices')->whereNull('billing_period')->update([
                'billing_period' => DB::raw("DATE_TRUNC('month', created_at)::date"),
            ]);
        } else {
            DB::table('invoices')->whereNull('billing_period')->update([
                'billing_period' => DB::raw("date(created_at, 'start of month')"),
            ]);
        }

        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'idempotency_key')) {
                $table->string('idempotency_key', 64)->nullable()->after('payment_method');
            }
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 64)->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['started', 'succeeded', 'failed', 'rejected']);
            $table->string('error_code', 50)->nullable();
            $table->text('error_message')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['invoice_id', 'created_at']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('billing_job_locks', function (Blueprint $table) {
            $table->id();
            $table->string('job_name', 100);
            $table->string('lock_key', 100);
            $table->timestamp('locked_at');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->unique(['job_name', 'lock_key']);
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key ON payments (idempotency_key) WHERE idempotency_key IS NOT NULL');
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_one_completed_per_invoice ON payments (invoice_id) WHERE status = 'completed'");
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_subscription_period ON invoices (subscription_id, billing_period) WHERE subscription_id IS NOT NULL');

            DB::statement('ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check');
            DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'open', 'paid', 'void', 'overdue'))");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS uq_invoices_subscription_period');
            DB::statement('DROP INDEX IF EXISTS uq_payments_one_completed_per_invoice');
            DB::statement('DROP INDEX IF EXISTS uq_payments_idempotency_key');
        }

        Schema::dropIfExists('billing_job_locks');
        Schema::dropIfExists('payment_attempts');

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'idempotency_key')) {
                $table->dropColumn('idempotency_key');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'vehicle_count')) {
                $table->dropColumn('vehicle_count');
            }
            if (Schema::hasColumn('invoices', 'billing_period')) {
                $table->dropColumn('billing_period');
            }
        });

        Schema::table('plans', function (Blueprint $table) {
            if (Schema::hasColumn('plans', 'price_per_vehicle')) {
                $table->dropColumn('price_per_vehicle');
            }
        });
    }
};
