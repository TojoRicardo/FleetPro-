<?php

namespace App\Events;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EntityAudited
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $action,
        public Model $model,
        public ?array $before = null,
        public ?array $after = null,
    ) {}
}
