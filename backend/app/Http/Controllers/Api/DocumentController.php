<?php

namespace App\Http\Controllers\Api;

use App\Domain\Document\DocumentService;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    use ApiResponse;

    public function __construct(private DocumentService $documentService) {}

    public function index(Request $request)
    {
        return $this->success(
            $this->documentService->list($request->all(), (int) $request->get('per_page', 15))
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'category' => ['required', 'in:driver_license,vehicle_document,invoice,contract,other'],
            'entity_type' => ['nullable', 'string'],
            'entity_id' => ['nullable', 'integer'],
        ]);

        $document = $this->documentService->upload(
            $request->file('file'),
            $request->category,
            $request->user()->id,
            $request->entity_type,
            $request->entity_id
        );

        return $this->success($document, 'Document uploaded successfully.', 201);
    }

    public function show(Document $document)
    {
        return $this->success([
            'document' => $document->load('uploader'),
            'signed_url' => $this->documentService->getSignedUrl($document),
        ]);
    }

    public function destroy(Document $document)
    {
        $this->documentService->delete($document);

        return $this->success(null, 'Document deleted successfully.');
    }
}
