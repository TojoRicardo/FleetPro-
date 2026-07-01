<?php

use App\Domain\Document\DocumentService;
use App\Models\Document;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'FleetPro API',
        'version' => '1.0.0',
        'status' => 'running',
    ]);
});

Route::get('/documents/{document}/download', function (Document $document) {
    return app(DocumentService::class)->download($document);
})->middleware('signed')->name('documents.download');
