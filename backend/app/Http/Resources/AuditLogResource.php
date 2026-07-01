<?php

namespace App\Http\Resources;

use App\Services\AuditLogEntityResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function __construct($resource, private readonly ?AuditLogEntityResolver $entityResolver = null)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $before = $this->before_value ?? [];
        $after = $this->after_value ?? $this->metadata ?? [];
        $changedKeys = $this->changedFieldKeys($before, $after);
        $meta = is_array($this->metadata) ? $this->metadata : [];

        [$resourceLabel, $resourceReference] = $this->resolveResource($this->entity_type, $this->entity_id, $before, $after);

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'user_id' => $this->user_id,
            'action' => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'before_value' => $this->before_value,
            'after_value' => $this->after_value,
            'metadata' => $this->metadata,
            'user_agent' => $this->user_agent,
            'route' => $this->route,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'role' => $this->user->role?->value ?? $this->user->role,
            ]),
            'result' => $meta['result'] ?? 'success',
            'duration_ms' => $meta['duration_ms'] ?? null,
            'session_id' => $this->resolveSessionId($meta),
            'device_type' => $this->resolveDeviceType($this->user_agent),
            'resource_label' => $resourceLabel,
            'resource_reference' => $resourceReference,
            'changed_fields_count' => count($changedKeys),
            'changed_fields_preview' => $this->previewChanges($before, $after, $changedKeys),
        ];
    }

    private function changedFieldKeys(array $before, array $after): array
    {
        $skip = ['created_at', 'updated_at', 'deleted_at', 'tenant_id', 'password', 'remember_token'];
        $keys = array_unique(array_merge(array_keys($before), array_keys($after)));

        return array_values(array_filter($keys, function ($key) use ($before, $after, $skip) {
            if (in_array($key, $skip, true)) {
                return false;
            }

            return json_encode($before[$key] ?? null) !== json_encode($after[$key] ?? null);
        }));
    }

    private function previewChanges(array $before, array $after, array $keys): ?array
    {
        if ($keys === []) {
            return null;
        }

        $key = $keys[0];
        $label = ucfirst(str_replace('_', ' ', $key));

        return [
            'field' => $key,
            'label' => $label,
            'before' => $before[$key] ?? null,
            'after' => $after[$key] ?? null,
        ];
    }

    private function resolveSessionId(array $meta): string
    {
        if (! empty($meta['session_id'])) {
            return (string) $meta['session_id'];
        }

        $seed = ($this->user_id ?? 0).'|'.($this->ip_address ?? '').'|'.$this->created_at?->format('Y-m-d');

        return 'S-'.strtoupper(substr(md5($seed), 0, 4));
    }

    private function resolveDeviceType(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Desktop';
        }

        $ua = strtolower($userAgent);

        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'Mobile';
        }

        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'Tablet';
        }

        return 'Desktop';
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function resolveResource(string $entityType, ?int $entityId, array $before, array $after): array
    {
        if ($this->entityResolver) {
            return $this->entityResolver->resolve($entityType, $entityId, $before, $after);
        }

        $data = array_merge($before, $after);

        return match ($entityType) {
            'user' => [
                $data['name'] ?? 'Utilisateur inconnu',
                $data['email'] ?? $this->formatEntityReference('US', $entityId),
            ],
            'driver' => [
                $data['name'] ?? 'Conducteur inconnu',
                $data['license_number'] ?? $data['phone'] ?? $this->formatEntityReference('DR', $entityId),
            ],
            'vehicle' => [
                $data['plate_number'] ?? 'Véhicule',
                trim(($data['brand'] ?? '').' '.($data['model'] ?? '')) ?: null,
            ],
            default => [
                $this->legacyResourceLabel($entityType),
                $this->legacyResourceReference($entityType, $entityId, $after, $before),
            ],
        };
    }

    private function formatEntityReference(string $prefix, ?int $entityId): ?string
    {
        if (! $entityId) {
            return null;
        }

        return '#'.$prefix.'-'.str_pad((string) $entityId, 5, '0', STR_PAD_LEFT);
    }

    private function legacyResourceLabel(string $entityType): string
    {
        return match ($entityType) {
            'vehicle' => 'Véhicule',
            'driver' => 'Conducteur',
            'trip' => 'Trajet',
            'maintenance' => 'Maintenance',
            'assignment' => 'Affectation',
            'user' => 'Utilisateur',
            'document' => 'Document',
            'report' => 'Rapport',
            default => ucfirst($entityType),
        };
    }

    private function legacyResourceReference(string $entityType, ?int $entityId, array $after, array $before): ?string
    {
        $prefix = match ($entityType) {
            'vehicle' => 'VH',
            'driver' => 'DR',
            'trip' => 'TR',
            'maintenance' => 'MT',
            'assignment' => 'AS',
            'user' => 'US',
            'document' => 'DOC',
            'report' => 'RP',
            default => 'REF',
        };

        if (! $entityId) {
            return null;
        }

        $plate = $after['plate_number'] ?? $before['plate_number'] ?? null;
        if ($entityType === 'vehicle' && $plate) {
            return (string) $plate;
        }

        return '#'.$prefix.'-'.str_pad((string) $entityId, 5, '0', STR_PAD_LEFT);
    }
}
