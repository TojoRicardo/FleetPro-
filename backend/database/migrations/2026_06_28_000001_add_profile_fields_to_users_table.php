<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('name');
            }
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 32)->nullable()->after('email');
            }
            if (! Schema::hasColumn('users', 'job_title')) {
                $table->string('job_title')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('users', 'department')) {
                $table->string('department')->nullable()->after('job_title');
            }
            if (! Schema::hasColumn('users', 'avatar_url')) {
                $table->text('avatar_url')->nullable()->after('department');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['username', 'phone', 'job_title', 'department', 'avatar_url'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
