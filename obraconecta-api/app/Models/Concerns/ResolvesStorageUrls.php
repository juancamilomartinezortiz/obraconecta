<?php

namespace App\Models\Concerns;

trait ResolvesStorageUrls
{
    /**
     * Convierte una ruta guardada en el disco "public" (ej. avatars/abc.jpg)
     * en una URL completa. Si ya es una URL (http...), la deja igual.
     */
    protected function storageUrl(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return asset('storage/'.$value);
    }
}
