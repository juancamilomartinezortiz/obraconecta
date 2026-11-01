<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialty extends Model
{
    protected $fillable = ['name', 'icon'];

    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(WorkerProfile::class, 'worker_specialty');
    }

    public function jobPosts(): HasMany
    {
        return $this->hasMany(JobPost::class);
    }
}
