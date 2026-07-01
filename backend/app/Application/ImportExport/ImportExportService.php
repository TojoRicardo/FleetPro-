<?php

namespace App\Application\ImportExport;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Services\TenantContext;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ImportExportService
{
    public function __construct(private TenantContext $tenantContext) {}

    public function importVehicles(UploadedFile $file): array
    {
        $tenantId = $this->tenantContext->id();
        $rows = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_map('trim', array_shift($rows));
        $imported = 0;
        $errors = [];

        DB::transaction(function () use ($rows, $header, $tenantId, &$imported, &$errors) {
            foreach ($rows as $index => $row) {
                if (count($row) < count($header)) {
                    continue;
                }

                $data = array_combine($header, $row);

                try {
                    Vehicle::create([
                        'tenant_id' => $tenantId,
                        'plate_number' => $data['plate_number'] ?? $data['plate'] ?? '',
                        'brand' => $data['brand'] ?? '',
                        'model' => $data['model'] ?? '',
                        'year' => (int) ($data['year'] ?? date('Y')),
                        'mileage' => (int) ($data['mileage'] ?? 0),
                        'status' => $data['status'] ?? 'active',
                    ]);
                    $imported++;
                } catch (\Throwable $e) {
                    $errors[] = ['row' => $index + 2, 'message' => $e->getMessage()];
                }
            }
        });

        return ['imported' => $imported, 'errors' => $errors];
    }

    public function importDrivers(UploadedFile $file): array
    {
        $tenantId = $this->tenantContext->id();
        $rows = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_map('trim', array_shift($rows));
        $imported = 0;
        $errors = [];

        DB::transaction(function () use ($rows, $header, $tenantId, &$imported, &$errors) {
            foreach ($rows as $index => $row) {
                if (count($row) < count($header)) {
                    continue;
                }

                $data = array_combine($header, $row);

                try {
                    Driver::create([
                        'tenant_id' => $tenantId,
                        'name' => $data['name'] ?? '',
                        'license_number' => $data['license_number'] ?? $data['license'] ?? '',
                        'phone' => $data['phone'] ?? '',
                        'status' => $data['status'] ?? $data['availability_status'] ?? 'available',
                        'score' => (float) ($data['score'] ?? 5.0),
                    ]);
                    $imported++;
                } catch (\Throwable $e) {
                    $errors[] = ['row' => $index + 2, 'message' => $e->getMessage()];
                }
            }
        });

        return ['imported' => $imported, 'errors' => $errors];
    }

    public function exportVehiclesCsv(): string
    {
        $vehicles = Vehicle::orderBy('plate_number')->get();
        $output = fopen('php://temp', 'r+');
        fputcsv($output, ['plate_number', 'brand', 'model', 'year', 'mileage', 'status']);

        foreach ($vehicles as $vehicle) {
            fputcsv($output, [
                $vehicle->plate_number,
                $vehicle->brand,
                $vehicle->model,
                $vehicle->year,
                $vehicle->mileage,
                $vehicle->status,
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    public function exportDriversCsv(): string
    {
        $drivers = Driver::orderBy('name')->get();
        $output = fopen('php://temp', 'r+');
        fputcsv($output, ['name', 'license_number', 'phone', 'status', 'score']);

        foreach ($drivers as $driver) {
            fputcsv($output, [
                $driver->name,
                $driver->license_number,
                $driver->phone,
                $driver->status,
                $driver->score,
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}
