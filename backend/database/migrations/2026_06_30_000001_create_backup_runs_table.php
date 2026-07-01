<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_runs', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('disk')->default('local');
            $table->string('path');
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('driver'); // pgsql, sqlite
            $table->string('trigger')->default('scheduled'); // scheduled, manual
            $table->string('status')->default('completed'); // started, completed, failed
            $table->text('error_message')->nullable();
            $table->timestamp('retention_until')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_runs');
    }
};
