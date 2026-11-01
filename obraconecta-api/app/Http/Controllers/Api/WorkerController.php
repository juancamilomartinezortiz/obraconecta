<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPost;
use App\Models\Review;
use App\Models\WorkerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkerProfile::query()
            ->with(['user.city', 'specialties'])
            ->withCount('portfolioItems')
            ->whereHas('user', fn ($u) => $u->where('status', 'active'));

        if ($request->filled('specialty_id')) {
            $query->whereHas('specialties', fn ($s) => $s->where('specialties.id', $request->integer('specialty_id')));
        }

        if ($request->filled('city_id')) {
            $query->whereHas('user', fn ($u) => $u->where('city_id', $request->integer('city_id')));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->trim().'%';
            $query->where(function ($w) use ($term) {
                $w->where('bio', 'like', $term)
                    ->orWhere('work_zones', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term))
                    ->orWhereHas('specialties', fn ($s) => $s->where('name', 'like', $term));
            });
        }

        if ($request->filled('min_rating')) {
            $query->where('rating_avg', '>=', (float) $request->input('min_rating'));
        }

        if ($request->boolean('verified')) {
            $query->whereHas('user', fn ($u) => $u->whereNotNull('verified_at'));
        }

        if ($request->boolean('available')) {
            $query->where('availability', 'available');
        }

        match ($request->input('sort', 'rating')) {
            'experience' => $query->orderByDesc('years_experience'),
            'price' => $query->orderByRaw('daily_rate IS NULL, daily_rate ASC'),
            'jobs' => $query->orderByDesc('jobs_done'),
            default => $query->orderByDesc('rating_avg')->orderByDesc('jobs_done'),
        };

        return response()->json($query->paginate($request->integer('per_page', 12)));
    }

    public function show(Request $request, WorkerProfile $worker): JsonResponse
    {
        $worker->load(['user.city', 'specialties', 'portfolioItems' => fn ($p) => $p->latest('work_date'), 'portfolioItems.photos', 'portfolioItems.city']);

        $reviews = Review::with(['reviewer:id,name,photo_url,role,verified_at', 'reviewer.clientProfile:id,user_id,business_name,type'])
            ->where('reviewed_id', $worker->user_id)
            ->latest()
            ->take(30)
            ->get();

        $distribution = collect([5, 4, 3, 2, 1])->mapWithKeys(fn ($star) => [
            $star => $reviews->where('rating', $star)->count(),
        ]);

        // El contacto solo se muestra si el visitante tiene una postulación aceptada con este maestro.
        $viewer = auth('sanctum')->user();
        $canContact = false;
        if ($viewer && $viewer->isClient() && $viewer->clientProfile) {
            $canContact = Application::where('worker_profile_id', $worker->id)
                ->where('status', 'accepted')
                ->whereHas('jobPost', fn ($j) => $j->where('client_profile_id', $viewer->clientProfile->id))
                ->exists();
        }
        if ($canContact || ($viewer && ($viewer->id === $worker->user_id || $viewer->isAdmin()))) {
            $worker->user->withContact();
        }

        return response()->json([
            'worker' => $worker,
            'reviews' => $reviews,
            'rating_distribution' => $distribution,
            'can_contact' => $canContact,
        ]);
    }

    public function invite(Request $request, WorkerProfile $worker): JsonResponse
    {
        $client = $request->user()->clientProfile;

        $data = $request->validate([
            'job_post_id' => ['required', 'integer'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $job = JobPost::where('id', $data['job_post_id'])
            ->where('client_profile_id', $client->id)
            ->firstOrFail();

        if ($job->status !== 'open') {
            return response()->json(['message' => 'La oferta no está abierta.'], 422);
        }

        if (Application::where('job_post_id', $job->id)->where('worker_profile_id', $worker->id)->exists()) {
            return response()->json(['message' => 'Este maestro ya está en esa oferta.'], 422);
        }

        $application = Application::create([
            'job_post_id' => $job->id,
            'worker_profile_id' => $worker->id,
            'message' => $data['message'] ?? null,
            'status' => 'sent',
            'is_invitation' => true,
        ]);

        return response()->json($application, 201);
    }
}
