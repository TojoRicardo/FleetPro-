<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('analytics_events');
        Schema::dropIfExists('documents');
    }

    public function down(): void
    {
        // Legacy tables removed — not restored.
    }
};
