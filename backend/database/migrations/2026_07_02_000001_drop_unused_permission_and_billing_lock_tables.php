<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('billing_job_locks');
    }

    public function down(): void
    {
        // Tables were part of legacy RBAC and Node billing workers — not restored.
    }
};
