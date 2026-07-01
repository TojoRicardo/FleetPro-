<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->boolean('is_super_admin')->default(false)->after('role');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('maintenance', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('logs', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->json('before_value')->nullable()->after('metadata');
            $table->json('after_value')->nullable()->after('before_value');
            $table->string('ip_address', 45)->nullable()->after('after_value');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->string('route')->nullable()->after('user_agent');
        });

        $this->migrateExistingData();

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->unique(['tenant_id', 'email']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropUnique(['plate_number']);
            $table->unique(['tenant_id', 'plate_number']);
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropUnique(['license_number']);
            $table->unique(['tenant_id', 'license_number']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->index(['tenant_id', 'status']);
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->index(['tenant_id', 'availability_status']);
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->index(['tenant_id', 'status']);
        });

        Schema::table('logs', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at']);
        });
    }

    private function migrateExistingData(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        $defaultPlanId = DB::table('plans')->where('slug', 'free')->value('id');

        $tenantId = DB::table('tenants')->insertGetId([
            'name' => 'Default Fleet Company',
            'slug' => 'default-fleet',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($defaultPlanId) {
            DB::table('subscriptions')->insert([
                'tenant_id' => $tenantId,
                'plan_id' => $defaultPlanId,
                'status' => 'active',
                'billing_cycle' => 'monthly',
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach (['users', 'vehicles', 'drivers', 'trips', 'maintenance', 'assignments', 'logs'] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
            }
        }

        DB::table('users')->where('email', 'admin@fleetpro.com')->update(['is_super_admin' => true]);
    }

    public function down(): void
    {
        Schema::table('logs', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'created_at']);
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn(['before_value', 'after_value', 'ip_address', 'user_agent', 'route']);
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('maintenance', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('drivers', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'license_number']);
            $table->dropIndex(['tenant_id', 'availability_status']);
            $table->dropConstrainedForeignId('tenant_id');
            $table->unique('license_number');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'plate_number']);
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropConstrainedForeignId('tenant_id');
            $table->unique('plate_number');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'email']);
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropColumn('is_super_admin');
            $table->unique('email');
        });
    }
};
