<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PortfolioItem extends Model
{
    protected $fillable = [
        'worker_profile_id',
        'title',
        'description',
        'city_id',
        'work_date',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
        ];
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_profile_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(PortfolioPhoto::class)->orderBy('position');
    }
}
