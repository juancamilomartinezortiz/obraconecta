<?php

namespace App\Models;

use App\Models\Concerns\ResolvesStorageUrls;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioPhoto extends Model
{
    use ResolvesStorageUrls;

    protected $fillable = ['portfolio_item_id', 'url', 'position'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(PortfolioItem::class, 'portfolio_item_id');
    }

    public function getUrlAttribute(?string $value): ?string
    {
        return $this->storageUrl($value);
    }
}
