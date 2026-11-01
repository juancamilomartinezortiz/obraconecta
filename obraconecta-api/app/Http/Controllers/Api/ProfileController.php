<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city_id' => ['nullable', 'exists:cities,id'],
            // Maestro
            'bio' => ['nullable', 'string', 'max:2000'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:70'],
            'daily_rate' => ['nullable', 'integer', 'min:0'],
            'availability' => ['nullable', Rule::in(['available', 'busy'])],
            'available_from' => ['nullable', 'date'],
            'work_zones' => ['nullable', 'string', 'max:255'],
            'specialties' => ['nullable', 'array', 'max:8'],
            'specialties.*' => ['integer', 'exists:specialties,id'],
            // Contratante
            'client_type' => ['nullable', Rule::in(['company', 'person'])],
            'business_name' => ['nullable', 'string', 'max:160'],
            'nit' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($user, $data, $request) {
            $user->update(collect($data)->only(['name', 'phone', 'city_id'])->all());

            if ($user->isWorker() && $user->workerProfile) {
                $user->workerProfile->update(collect($data)->only([
                    'bio', 'years_experience', 'daily_rate', 'availability', 'available_from', 'work_zones',
                ])->all());

                if ($request->has('specialties')) {
                    $user->workerProfile->specialties()->sync($data['specialties'] ?? []);
                }
            }

            if ($user->isClient() && $user->clientProfile) {
                $client = collect($data)->only(['business_name', 'nit', 'description'])->all();
                if (array_key_exists('client_type', $data)) {
                    $client['type'] = $data['client_type'];
                }
                $user->clientProfile->update($client);
            }
        });

        return response()->json(AuthController::profile($user));
    }

    public function photo(Request $request): JsonResponse
    {
        $request->validate(['photo' => ['required', 'image', 'max:4096']]);

        $user = $request->user();
        $old = $user->getRawOriginal('photo_url');
        if ($old && ! str_starts_with($old, 'http')) {
            Storage::disk('public')->delete($old);
        }

        $user->update(['photo_url' => $request->file('photo')->store('avatars', 'public')]);

        return response()->json(AuthController::profile($user));
    }

    public function portfolio(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->workerProfile->portfolioItems()->with(['photos', 'city'])->latest()->get()
        );
    }

    public function storePortfolio(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'description' => ['nullable', 'string', 'max:2000'],
            'city_id' => ['nullable', 'exists:cities,id'],
            'work_date' => ['nullable', 'date'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['image', 'max:4096'],
        ]);

        $item = DB::transaction(function () use ($request, $data) {
            $item = $request->user()->workerProfile->portfolioItems()->create(
                collect($data)->except('photos')->all()
            );

            foreach ($request->file('photos', []) as $i => $file) {
                $item->photos()->create([
                    'url' => $file->store('portfolio', 'public'),
                    'position' => $i,
                ]);
            }

            return $item;
        });

        return response()->json($item->load(['photos', 'city']), 201);
    }

    public function destroyPortfolio(Request $request, PortfolioItem $item): JsonResponse
    {
        abort_unless($request->user()->workerProfile?->id === $item->worker_profile_id, 403, 'Esta obra no es tuya.');

        foreach ($item->photos as $photo) {
            $path = $photo->getRawOriginal('url');
            if ($path && ! str_starts_with($path, 'http')) {
                Storage::disk('public')->delete($path);
            }
        }

        $item->delete();

        return response()->json(['message' => 'Obra eliminada.']);
    }
}
