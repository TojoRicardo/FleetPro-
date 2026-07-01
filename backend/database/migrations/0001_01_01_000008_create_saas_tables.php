<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable()->unique();
            $table->enum('status', ['active', 'suspended', 'trial'])->default('active');
            $table->json('settings')->nullable();
            $table->string('stripe_customer_id')->nullable();
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->unsignedInteger('max_vehicles')->default(5);
            $table->unsignedInteger('max_users')->default(3);
            $table->unsignedInteger('max_drivers')->default(10);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('stripe_price_id')->nullable();
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained();
            $table->enum('status', ['active', 'cancelled', 'past_due', 'trialing'])->default('active');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('stripe_subscription_id')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['draft', 'open', 'paid', 'void'])->default('draft');
            $table->timestamp('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('stripe_invoice_id')->nullable();
            $table->json('line_items')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('stripe_payment_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('group')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role');
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->unique(['role', 'permission_id']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('original_name');
            $table->string('path');
            $table->string('disk')->default('private');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->enum('category', ['driver_license', 'vehicle_document', 'invoice', 'contract', 'other'])->default('other');
            $table->string('documentable_type')->nullable();
            $table->unsignedBigInteger('documentable_id')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'category']);
            $table->index(['documentable_type', 'documentable_id']);
        });

        Schema::create('app_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at']);
            $table->index(['tenant_id', 'created_at']);
        });

        $this->seedPlans();
    }

    private function seedPlans(): void
    {
        $now = now();
        $plans = [
            ['name' => 'Free', 'slug' => 'free', 'description' => 'Get started', 'price_monthly' => 0, 'price_yearly' => 0, 'max_vehicles' => 5, 'max_users' => 3, 'max_drivers' => 10, 'features' => json_encode(['basic_dashboard']), 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Pro', 'slug' => 'pro', 'description' => 'Growing fleets', 'price_monthly' => 49.99, 'price_yearly' => 499.99, 'max_vehicles' => 50, 'max_users' => 15, 'max_drivers' => 100, 'features' => json_encode(['reports', 'import_export']), 'is_active' => true, 'stripe_price_id' => 'price_mock_pro', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Enterprise', 'slug' => 'enterprise', 'description' => 'Large organizations', 'price_monthly' => 199.99, 'price_yearly' => 1999.99, 'max_vehicles' => 500, 'max_users' => 100, 'max_drivers' => 1000, 'features' => json_encode(['api_access', 'priority_support']), 'is_active' => true, 'stripe_price_id' => 'price_mock_enterprise', 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($plans as $plan) {
            if (! DB::table('plans')->where('slug', $plan['slug'])->exists()) {
                DB::table('plans')->insert($plan);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('tenants');
    }
};
