<?php

namespace App\Models;

use App\Models\Concerns\ResolvesStorageUrls;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, ResolvesStorageUrls;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'city_id',
        'photo_url',
        'status',
        'verified_at',
    ];

    /**
     * El correo y el celular se ocultan por defecto (privacidad, RNF-09).
     * Se muestran solo en /auth/me, al administrador o cuando hay una
     * postulación aceptada entre las dos partes.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email',
        'phone',
    ];

    protected $appends = ['is_verified'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verified_at !== null;
    }

    public function getPhotoUrlAttribute(?string $value): ?string
    {
        return $this->storageUrl($value);
    }

    public function withContact(): static
    {
        return $this->makeVisible(['email', 'phone']);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function workerProfile(): HasOne
    {
        return $this->hasOne(WorkerProfile::class);
    }

    public function clientProfile(): HasOne
    {
        return $this->hasOne(ClientProfile::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(Verification::class);
    }

    public function reviewsGiven(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewed_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function isWorker(): bool
    {
        return $this->role === 'worker';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
