<?php

namespace App\Models;

use App\Models\Concerns\ResolvesStorageUrls;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientProfile extends Model
{
    use ResolvesStorageUrls;

    protected $fillable = [
        'user_id',
        'type',
        'business_name',
        'nit',
        'logo_url',
        'description',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobPosts(): HasMany
    {
        return $this->hasMany(JobPost::class);
    }

    public function getLogoUrlAttribute(?string $value): ?string
    {
        return $this->storageUrl($value);
    }
}
