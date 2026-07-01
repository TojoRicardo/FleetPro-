<?php

namespace App\Domain\Tenant;

use App\Domain\Billing\Contracts\PaymentGatewayInterface;
use App\Domain\Feature\FeatureFlagService;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway,
        private FeatureFlagService $featureFlagService,
    ) {}

    public function create(array $data, User $owner): Tenant
    {
        return DB::transaction(function () use ($data, $owner) {
            $slug = Str::slug($data['company_name'] ?? $data['name']);
            $baseSlug = $slug;
            $counter = 1;

            while (Tenant::where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.$counter++;
            }

            $freePlan = Plan::where('slug', 'free')->first();

            $tenant = Tenant::create([
                'name' => $data['company_name'] ?? $data['name'],
                'slug' => $slug,
                'email' => $data['email'] ?? $owner->email,
                'plan_id' => $freePlan?->id,
                'status' => 'active',
                'settings' => $data['settings'] ?? [],
            ]);

            if (config('services.stripe.secret')) {
                $customer = $this->paymentGateway->createCustomer($tenant);
                $tenant->update(['stripe_customer_id' => $customer['customer_id']]);
            }

            if ($freePlan) {
                Subscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $freePlan->id,
                    'status' => 'active',
                    'start_date' => now()->toDateString(),
                    'end_date' => now()->addDays(14)->toDateString(),
                    'billing_cycle' => 'monthly',
                    'current_period_start' => now(),
                    'current_period_end' => now()->addDays(14),
                ]);
            }

            $owner->update([
                'tenant_id' => $tenant->id,
                'role' => 'admin',
                'status' => 'active',
            ]);

            $this->featureFlagService->seedDefaults($tenant->id);

            return $tenant->load(['subscription.plan', 'plan']);
        });
    }

    public function suspend(Tenant $tenant): Tenant
    {
        $tenant->update(['status' => 'suspended']);

        return $tenant;
    }

    public function activate(Tenant $tenant): Tenant
    {
        $tenant->update(['status' => 'active']);

        return $tenant;
    }

    public function listAll(array $filters = [], int $perPage = 15)
    {
        $query = Tenant::with(['subscription.plan', 'plan'])
            ->withCount(['users', 'vehicles']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('slug', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }
}
