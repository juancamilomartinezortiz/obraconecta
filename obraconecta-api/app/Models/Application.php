<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Application extends Model
{
    protected $fillable = [
        'job_post_id',
        'worker_profile_id',
        'message',
        'rate',
        'status',
        'is_invitation',
    ];

    protected function casts(): array
    {
        return [
            'is_invitation' => 'boolean',
        ];
    }

    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_profile_id');
    }

    public function contract(): HasOne
    {
        return $this->hasOne(Contract::class);
    }
}
