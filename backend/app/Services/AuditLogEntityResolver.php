<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Collection;

class AuditLogEntityResolver
{
    /** @var array<int, User> */
    private array $users = [];

    /** @var array<int, Driver> */
    private array $drivers = [];

    /** @var array<int, Vehicle> */
    private array $vehicles = [];

    public function preload(Collection $logs): void
    {
        $userIds = $logs->where('entity_type', 'user')->pluck('entity_id')->filter()->unique()->values();
        $driverIds = $logs->where('entity_type', 'driver')->pluck('entity_id')->filter()->unique()->values();
        $vehicleIds = $logs->where('entity_type', 'vehicle')->pluck('entity_id')->filter()->unique()->values();

        if ($userIds->isNotEmpty()) {
            $this->users = User::query()
                ->whereIn('id', $userIds)
                ->get(['id', 'name', 'email'])
                ->keyBy('id')
                ->all();
        }

        if ($driverIds->isNotEmpty()) {
            $this->drivers = Driver::query()
                ->whereIn('id', $driverIds)
                ->get(['id', 'name', 'license_number', 'phone'])
                ->keyBy('id')
                ->all();
        }

        if ($vehicleIds->isNotEmpty()) {
            $this->vehicles = Vehicle::query()
                ->whereIn('id', $vehicleIds)
                ->get(['id', 'plate_number', 'brand', 'model'])
                ->keyBy('id')
                ->all();
        }
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    public function resolve(string $entityType, ?int $entityId, array $before, array $after): array
    {
        $data = array_merge($before, $after);

        return match ($entityType) {
            'user' => $this->resolveUser($entityId, $data),
            'driver' => $this->resolveDriver($entityId, $data),
            'vehicle' => $this->resolveVehicle($entityId, $data),
            'trip' => [
                'Trajet',
                $this->formatTripRoute($data) ?? ($entityId ? "#TR-{$entityId}" : null),
            ],
            'maintenance' => [
                $data['type'] ?? 'Maintenance',
                $entityId ? "#MT-{$entityId}" : null,
            ],
            'assignment' => [
                'Affectation',
                $entityId ? "#AS-{$entityId}" : null,
            ],
            'document' => [
                $data['title'] ?? $data['name'] ?? 'Document',
                $entityId ? "#DOC-{$entityId}" : null,
            ],
            'report' => [
                $data['title'] ?? $data['name'] ?? 'Rapport',
                $entityId ? "#RP-{$entityId}" : null,
            ],
            default => [
                ucfirst($entityType),
                $entityId ? "#{$entityId}" : null,
            ],
        };
    }

    private function resolveUser(?int $entityId, array $data): array
    {
        $model = $entityId ? ($this->users[$entityId] ?? null) : null;
        $name = $data['name'] ?? $model?->name ?? 'Utilisateur inconnu';
        $email = $data['email'] ?? $model?->email;

        return [$name, $email];
    }

    private function resolveDriver(?int $entityId, array $data): array
    {
        $model = $entityId ? ($this->drivers[$entityId] ?? null) : null;
        $name = $data['name'] ?? $model?->name ?? 'Conducteur inconnu';
        $ref = $data['license_number'] ?? $model?->license_number ?? $model?->phone;

        return [$name, $ref];
    }

    private function resolveVehicle(?int $entityId, array $data): array
    {
        $model = $entityId ? ($this->vehicles[$entityId] ?? null) : null;
        $plate = $data['plate_number'] ?? $model?->plate_number ?? 'Véhicule';
        $brand = $data['brand'] ?? $model?->brand ?? '';
        $modelName = $data['model'] ?? $model?->model ?? '';
        $subtitle = trim("{$brand} {$modelName}") ?: null;

        return [$plate, $subtitle];
    }

    private function formatTripRoute(array $data): ?string
    {
        $start = $data['start_location'] ?? null;
        $end = $data['end_location'] ?? null;

        if ($start && $end) {
            return "{$start} → {$end}";
        }

        return $start ?? $end;
    }
}
