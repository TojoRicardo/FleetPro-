<?php

namespace App\Domain\Document;

use App\Models\Document;
use App\Services\TenantContext;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentService
{
    public function __construct(private TenantContext $tenantContext) {}

    public function upload(UploadedFile $file, string $category, ?int $userId = null, ?string $entityType = null, ?int $entityId = null): Document
    {
        $tenantId = $this->tenantContext->id();
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $filePath = "tenants/{$tenantId}/{$category}/{$filename}";

        Storage::disk('private')->put($filePath, file_get_contents($file->getRealPath()));

        return Document::create([
            'tenant_id' => $tenantId,
            'uploaded_by' => $userId,
            'name' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'disk' => 'private',
            'file_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'category' => $category,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }

    public function getSignedUrl(Document $document, int $minutes = 30): string
    {
        return \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'documents.download',
            now()->addMinutes($minutes),
            ['document' => $document->id]
        );
    }

    public function download(Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        return Storage::disk($document->disk)->download(
            $document->file_path,
            $document->original_name
        );
    }

    public function list(array $filters = [], int $perPage = 15)
    {
        $query = Document::with('uploader')->orderByDesc('created_at');

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        return $query->paginate($perPage);
    }

    public function delete(Document $document): bool
    {
        Storage::disk($document->disk)->delete($document->file_path);

        return $document->delete();
    }
}
