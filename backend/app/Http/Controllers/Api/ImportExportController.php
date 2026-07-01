<?php

namespace App\Http\Controllers\Api;

use App\Application\ImportExport\ImportExportService;
use App\Http\Controllers\Controller;
use App\Jobs\GeneratePdfReport;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ImportExportController extends Controller
{
    use ApiResponse;

    public function __construct(private ImportExportService $importExportService) {}

    public function importVehicles(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt']]);

        $result = $this->importExportService->importVehicles($request->file('file'));

        return $this->success($result, "Imported {$result['imported']} vehicles.");
    }

    public function importDrivers(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt']]);

        $result = $this->importExportService->importDrivers($request->file('file'));

        return $this->success($result, "Imported {$result['imported']} drivers.");
    }

    public function exportVehicles()
    {
        $csv = $this->importExportService->exportVehiclesCsv();

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="vehicles.csv"',
        ]);
    }

    public function exportDrivers()
    {
        $csv = $this->importExportService->exportDriversCsv();

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="drivers.csv"',
        ]);
    }

    public function generatePdfReport(Request $request)
    {
        $request->validate([
            'report_type' => ['sometimes', 'string'],
        ]);

        GeneratePdfReport::dispatch(
            $request->user()->tenant_id,
            $request->user()->id,
            $request->report_type ?? 'fleet_summary'
        );

        return $this->success(null, 'PDF report generation queued.');
    }
}
