<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'bio',
        'years_experience',
        'daily_rate',
        'availability',
        'available_from',
        'work_zones',
        'rating_avg',
        'jobs_done',
    ];

    protected function casts(): array
    {
        return [
            'available_from' => 'date',
            'rating_avg' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(Specialty::class, 'worker_specialty');
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
