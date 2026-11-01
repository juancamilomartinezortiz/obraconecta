<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Verification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'document_url',
        'status',
        'rejection_reason',
    ];

    protected $hidden = ['document_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
