<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'vehicle.create', 'group' => 'vehicles', 'description' => 'Create vehicles'],
            ['name' => 'vehicle.view', 'group' => 'vehicles', 'description' => 'View vehicles'],
            ['name' => 'vehicle.update', 'group' => 'vehicles', 'description' => 'Update vehicles'],
            ['name' => 'vehicle.delete', 'group' => 'vehicles', 'description' => 'Delete vehicles'],
            ['name' => 'driver.create', 'group' => 'drivers', 'description' => 'Create drivers'],
            ['name' => 'driver.view', 'group' => 'drivers', 'description' => 'View drivers'],
            ['name' => 'driver.update', 'group' => 'drivers', 'description' => 'Update drivers'],
            ['name' => 'driver.delete', 'group' => 'drivers', 'description' => 'Delete drivers'],
            ['name' => 'trip.create', 'group' => 'trips', 'description' => 'Create trips'],
            ['name' => 'trip.view', 'group' => 'trips', 'description' => 'View trips'],
            ['name' => 'trip.update', 'group' => 'trips', 'description' => 'Update trips'],
            ['name' => 'trip.assign', 'group' => 'trips', 'description' => 'Assign trips'],
            ['name' => 'trip.delete', 'group' => 'trips', 'description' => 'Delete trips'],
            ['name' => 'maintenance.create', 'group' => 'maintenance', 'description' => 'Create maintenance records'],
            ['name' => 'maintenance.view', 'group' => 'maintenance', 'description' => 'View maintenance records'],
            ['name' => 'maintenance.update', 'group' => 'maintenance', 'description' => 'Update maintenance records'],
            ['name' => 'maintenance.delete', 'group' => 'maintenance', 'description' => 'Delete maintenance records'],
            ['name' => 'assignment.create', 'group' => 'assignments', 'description' => 'Create assignments'],
            ['name' => 'assignment.view', 'group' => 'assignments', 'description' => 'View assignments'],
            ['name' => 'assignment.delete', 'group' => 'assignments', 'description' => 'Delete assignments'],
            ['name' => 'billing.manage', 'group' => 'billing', 'description' => 'Manage billing and subscriptions'],
            ['name' => 'billing.view', 'group' => 'billing', 'description' => 'View billing information'],
            ['name' => 'audit.view', 'group' => 'audit', 'description' => 'View audit logs'],
            ['name' => 'document.upload', 'group' => 'documents', 'description' => 'Upload documents'],
            ['name' => 'document.view', 'group' => 'documents', 'description' => 'View documents'],
            ['name' => 'report.generate', 'group' => 'reports', 'description' => 'Generate reports'],
            ['name' => 'dashboard.view', 'group' => 'dashboard', 'description' => 'View dashboard'],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(['name' => $perm['name']], $perm);
        }

        $rolePermissions = [
            'admin' => Permission::pluck('name')->toArray(),
            'manager' => [
                'vehicle.create', 'vehicle.view', 'vehicle.update',
                'driver.create', 'driver.view', 'driver.update',
                'trip.create', 'trip.view', 'trip.update', 'trip.assign',
                'maintenance.view',
                'assignment.view',
                'billing.view',
                'audit.view',
                'document.upload', 'document.view',
                'report.generate',
                'dashboard.view',
            ],
            'mechanic' => [
                'vehicle.view',
                'maintenance.create', 'maintenance.view', 'maintenance.update',
                'dashboard.view',
            ],
        ];

        DB::table('role_permissions')->truncate();

        foreach ($rolePermissions as $role => $perms) {
            foreach ($perms as $permName) {
                $permission = Permission::where('name', $permName)->first();
                if ($permission) {
                    DB::table('role_permissions')->insert([
                        'role' => $role,
                        'permission_id' => $permission->id,
                    ]);
                }
            }
        }

        Permission::clearCache();
    }
}
