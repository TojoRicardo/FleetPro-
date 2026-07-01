<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->upgradeTenants();
        $this->upgradeUsers();
        $this->upgradeDrivers();
        $this->upgradeTrips();
        $this->upgradeMaintenance();
        $this->upgradeAssignments();
        $this->upgradeLogs();
        $this->upgradeNotifications();
        $this->upgradePlans();
        $this->upgradeSubscriptions();
        $this->upgradeDocuments();
        $this->createFeatureFlags();
        $this->createAnalyticsEvents();
    }

    private function upgradeTenants(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'email')) {
                $table->string('email')->nullable()->after('slug');
            }
            if (! Schema::hasColumn('tenants', 'plan_id')) {
                $table->foreignId('plan_id')->nullable()->after('email')->constrained('plans')->nullOnDelete();
            }
        });

        if (Schema::hasTable('subscriptions') && Schema::hasColumn('tenants', 'plan_id')) {
            $tenants = DB::table('tenants')->whereNull('plan_id')->get(['id']);
            foreach ($tenants as $tenant) {
                $planId = DB::table('subscriptions')
                    ->where('tenant_id', $tenant->id)
                    ->orderByDesc('id')
                    ->value('plan_id');
                if ($planId) {
                    DB::table('tenants')->where('id', $tenant->id)->update(['plan_id' => $planId]);
                }
            }
        }
    }

    private function upgradeUsers(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status', 20)->default('active')->after('role');
            }
            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('status');
            }
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        }

        if (Schema::hasColumn('users', 'is_super_admin')) {
            DB::table('users')->where('is_super_admin', true)->update(['role' => 'super_admin']);
        }

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'mechanic', 'driver'))");
        }
    }

    private function upgradeDrivers(): void
    {
        if (Schema::hasColumn('drivers', 'availability_status') && ! Schema::hasColumn('drivers', 'status')) {
            Schema::table('drivers', function (Blueprint $table) {
                $table->string('status', 20)->default('available')->after('phone');
            });

            DB::table('drivers')->update([
                'status' => DB::raw('availability_status'),
            ]);

            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                DB::statement('DROP INDEX IF EXISTS drivers_tenant_id_availability_status_index');
            }

            Schema::table('drivers', function (Blueprint $table) {
                $table->dropColumn('availability_status');
            });
        }

        Schema::table('drivers', function (Blueprint $table) {
            if (! Schema::hasColumn('drivers', 'score')) {
                $table->decimal('score', 3, 1)->default(5.0)->after('status');
            }
        });
    }

    private function upgradeTrips(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            if (! Schema::hasColumn('trips', 'cost_estimation')) {
                $table->decimal('cost_estimation', 10, 2)->nullable()->after('distance');
            }
        });
    }

    private function upgradeMaintenance(): void
    {
        Schema::table('maintenance', function (Blueprint $table) {
            if (! Schema::hasColumn('maintenance', 'status')) {
                $table->string('status', 20)->default('planned')->after('maintenance_date');
            }
        });
    }

    private function upgradeAssignments(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('assignments', 'status')) {
                $table->string('status', 20)->default('active')->after('unassigned_at');
            }
        });

        if (Schema::hasColumn('assignments', 'status')) {
            DB::table('assignments')->whereNull('unassigned_at')->update(['status' => 'active']);
            DB::table('assignments')->whereNotNull('unassigned_at')->update(['status' => 'ended']);
        }
    }

    private function upgradeLogs(): void
    {
        if (Schema::hasColumn('logs', 'entity') && ! Schema::hasColumn('logs', 'entity_type')) {
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                Schema::table('logs', function (Blueprint $table) {
                    $table->string('entity_type')->nullable()->after('action');
                });
                DB::table('logs')->update(['entity_type' => DB::raw('entity')]);
                DB::statement('DROP INDEX IF EXISTS logs_entity_entity_id_index');
                Schema::table('logs', function (Blueprint $table) {
                    $table->dropColumn('entity');
                });
            } else {
                Schema::table('logs', function (Blueprint $table) {
                    $table->renameColumn('entity', 'entity_type');
                });
            }
        }

        DB::table('logs')->where('action', 'created')->update(['action' => 'create']);
        DB::table('logs')->where('action', 'updated')->update(['action' => 'update']);
        DB::table('logs')->where('action', 'deleted')->update(['action' => 'delete']);
    }

    private function upgradeNotifications(): void
    {
        if (Schema::hasTable('app_notifications') && ! Schema::hasTable('notifications')) {
            Schema::rename('app_notifications', 'notifications');
        }
    }

    private function upgradePlans(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (! Schema::hasColumn('plans', 'price')) {
                $table->decimal('price', 10, 2)->default(0)->after('slug');
            }
            if (! Schema::hasColumn('plans', 'vehicle_limit')) {
                $table->unsignedInteger('vehicle_limit')->default(5)->after('price');
            }
        });

        if (Schema::hasColumn('plans', 'price_monthly')) {
            DB::table('plans')->whereNull('price')->orWhere('price', 0)->update([
                'price' => DB::raw('price_monthly'),
            ]);
        }

        if (Schema::hasColumn('plans', 'max_vehicles')) {
            DB::table('plans')->update([
                'vehicle_limit' => DB::raw('max_vehicles'),
            ]);
        }
    }

    private function upgradeSubscriptions(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'start_date')) {
                $table->date('start_date')->nullable()->after('status');
            }
            if (! Schema::hasColumn('subscriptions', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });

        if (Schema::hasColumn('subscriptions', 'current_period_start')) {
            DB::table('subscriptions')->whereNull('start_date')->update([
                'start_date' => DB::raw('DATE(current_period_start)'),
                'end_date' => DB::raw('DATE(current_period_end)'),
            ]);
        }

        DB::table('subscriptions')->where('status', 'past_due')->update(['status' => 'expired']);
        DB::table('subscriptions')->where('status', 'trialing')->update(['status' => 'active']);
    }

    private function upgradeDocuments(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            if (Schema::hasColumn('documents', 'path') && ! Schema::hasColumn('documents', 'file_path')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->string('file_path')->nullable();
                    $table->string('file_type')->nullable();
                    $table->string('entity_type')->nullable();
                    $table->unsignedBigInteger('entity_id')->nullable();
                });
                DB::table('documents')->update([
                    'file_path' => DB::raw('path'),
                    'file_type' => DB::raw('mime_type'),
                    'entity_type' => DB::raw('documentable_type'),
                    'entity_id' => DB::raw('documentable_id'),
                ]);
                DB::statement('DROP INDEX IF EXISTS documents_documentable_type_documentable_id_index');
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropColumn(['path', 'mime_type', 'documentable_type', 'documentable_id']);
                });
            }

            return;
        }

        if (Schema::hasColumn('documents', 'path') && ! Schema::hasColumn('documents', 'file_path')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('path', 'file_path');
            });
        }

        if (Schema::hasColumn('documents', 'mime_type') && ! Schema::hasColumn('documents', 'file_type')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('mime_type', 'file_type');
            });
        }

        if (Schema::hasColumn('documents', 'documentable_type') && ! Schema::hasColumn('documents', 'entity_type')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('documentable_type', 'entity_type');
                $table->renameColumn('documentable_id', 'entity_id');
            });
        }
    }

    private function createFeatureFlags(): void
    {
        if (Schema::hasTable('feature_flags')) {
            return;
        }

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('feature_name');
            $table->boolean('is_enabled')->default(false);
            $table->timestamps();
            $table->unique(['tenant_id', 'feature_name']);
            $table->index(['tenant_id', 'is_enabled']);
        });
    }

    private function createAnalyticsEvents(): void
    {
        if (Schema::hasTable('analytics_events')) {
            return;
        }

        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('event_type');
            $table->json('payload')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'event_type']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
        Schema::dropIfExists('feature_flags');

        if (Schema::hasTable('notifications') && ! Schema::hasTable('app_notifications')) {
            Schema::rename('notifications', 'app_notifications');
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'start_date')) {
                $table->dropColumn(['start_date', 'end_date']);
            }
        });

        Schema::table('plans', function (Blueprint $table) {
            if (Schema::hasColumn('plans', 'price')) {
                $table->dropColumn(['price', 'vehicle_limit']);
            }
        });

        Schema::table('assignments', function (Blueprint $table) {
            if (Schema::hasColumn('assignments', 'status')) {
                $table->dropColumn('status');
            }
        });

        Schema::table('maintenance', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance', 'status')) {
                $table->dropColumn('status');
            }
        });

        Schema::table('trips', function (Blueprint $table) {
            if (Schema::hasColumn('trips', 'cost_estimation')) {
                $table->dropColumn('cost_estimation');
            }
        });

        Schema::table('drivers', function (Blueprint $table) {
            if (Schema::hasColumn('drivers', 'score')) {
                $table->dropColumn('score');
            }
            if (Schema::hasColumn('drivers', 'status') && ! Schema::hasColumn('drivers', 'availability_status')) {
                $table->string('availability_status', 20)->default('available');
            }
        });

        if (Schema::hasColumn('drivers', 'availability_status') && Schema::hasColumn('drivers', 'status')) {
            DB::table('drivers')->update(['availability_status' => DB::raw('status')]);
            Schema::table('drivers', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'status')) {
                $table->dropColumn(['status', 'last_login_at']);
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'plan_id')) {
                $table->dropConstrainedForeignId('plan_id');
            }
            if (Schema::hasColumn('tenants', 'email')) {
                $table->dropColumn('email');
            }
        });
    }
};
