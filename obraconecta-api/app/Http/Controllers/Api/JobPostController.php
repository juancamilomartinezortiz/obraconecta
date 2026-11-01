<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JobPostController extends Controller
{
    private const RELATIONS = ['specialty', 'city', 'client.user:id,name,photo_url,verified_at,city_id'];

    public function index(Request $request): JsonResponse
    {
        $query = JobPost::query()
            ->with(self::RELATIONS)
            ->withCount('applications')
            ->where('status', 'open');

        if ($request->filled('specialty_id')) {
            $query->where('specialty_id', $request->integer('specialty_id'));
        }

        if ($request->filled('city_id')) {
            $query->where('city_id', $request->integer('city_id'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->trim().'%';
            $query->where(fn ($w) => $w->where('title', 'like', $term)->orWhere('description', 'like', $term));
        }

        if ($request->filled('min_budget')) {
            $query->where('budget', '>=', $request->integer('min_budget'));
        }

        match ($request->input('sort', 'recent')) {
            'budget' => $query->orderByDesc('budget'),
            'start' => $query->orderByRaw('start_date IS NULL, start_date ASC'),
            default => $query->latest(),
        };

        $page = $query->paginate($request->integer('per_page', 12));

        $appliedIds = $this->appliedJobIds($request);
        $page->through(function (JobPost $job) use ($appliedIds) {
            $job->setAttribute('has_applied', in_array($job->id, $appliedIds, true));

            return $job;
        });

        return response()->json($page);
    }

    public function show(Request $request, JobPost $job): JsonResponse
    {
        $job->load(self::RELATIONS)->loadCount('applications');

        $viewer = auth('sanctum')->user();
        $myApplication = null;
        if ($viewer && $viewer->isWorker() && $viewer->workerProfile) {
            $myApplication = Application::where('job_post_id', $job->id)
                ->where('worker_profile_id', $viewer->workerProfile->id)
                ->first();
        }

        $isOwner = $viewer && $viewer->clientProfile && $viewer->clientProfile->id === $job->client_profile_id;

        if (! $isOwner && $job->status !== 'open' && ! $myApplication) {
            abort(404);
        }

        return response()->json([
            'job' => $job,
            'my_application' => $myApplication,
            'is_owner' => $isOwner,
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $jobs = JobPost::with(['specialty', 'city'])
            ->withCount([
                'applications',
                'applications as new_applications_count' => fn ($q) => $q->where('status', 'sent')->where('is_invitation', false),
                'applications as accepted_count' => fn ($q) => $q->where('status', 'accepted'),
            ])
            ->where('client_profile_id', $request->user()->clientProfile->id)
            ->latest()
            ->get();

        return response()->json($jobs);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['client_profile_id'] = $request->user()->clientProfile->id;
        $data['status'] = 'open';

        $job = JobPost::create($data)->load(self::RELATIONS);

        return response()->json($job, 201);
    }

    public function update(Request $request, JobPost $job): JsonResponse
    {
        $this->ensureOwner($request, $job);

        $rules = collect($this->rules())->map(fn ($r) => array_merge(['sometimes'], $r))->all();
        $job->update($request->validate($rules));

        return response()->json($job->fresh(self::RELATIONS));
    }

    public function updateStatus(Request $request, JobPost $job): JsonResponse
    {
        $this->ensureOwner($request, $job);

        $data = $request->validate(['status' => ['required', Rule::in(['open', 'paused', 'closed'])]]);
        $job->update($data);

        return response()->json($job);
    }

    public function destroy(Request $request, JobPost $job): JsonResponse
    {
        $this->ensureOwner($request, $job);

        if ($job->applications()->where('status', 'accepted')->exists()) {
            return response()->json(['message' => 'No puedes eliminar una oferta con contrataciones. Ciérrala en su lugar.'], 422);
        }

        $job->delete();

        return response()->json(['message' => 'Oferta eliminada.']);
    }

    public function applications(Request $request, JobPost $job): JsonResponse
    {
        $this->ensureOwner($request, $job);

        $applications = Application::with(['worker.user.city', 'worker.specialties', 'contract'])
            ->where('job_post_id', $job->id)
            ->orderByRaw("CASE status WHEN 'sent' THEN 0 WHEN 'seen' THEN 1 WHEN 'accepted' THEN 2 ELSE 3 END")
            ->latest()
            ->get()
            ->each(function (Application $a) {
                if ($a->status === 'accepted') {
                    $a->worker->user->withContact();
                }
            });

        // Al abrir la lista, las postulaciones nuevas pasan a "vista".
        Application::where('job_post_id', $job->id)
            ->where('status', 'sent')
            ->where('is_invitation', false)
            ->update(['status' => 'seen']);

        return response()->json($applications);
    }

    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:140'],
            'description' => ['required', 'string', 'max:3000'],
            'specialty_id' => ['required', 'exists:specialties,id'],
            'city_id' => ['required', 'exists:cities,id'],
            'address' => ['nullable', 'string', 'max:160'],
            'budget' => ['nullable', 'integer', 'min:0'],
            'budget_type' => ['required', Rule::in(['total', 'daily', 'm2'])],
            'start_date' => ['nullable', 'date'],
            'days' => ['nullable', 'integer', 'min:1', 'max:730'],
            'workers_needed' => ['required', 'integer', 'min:1', 'max:50'],
        ];
    }

    private function ensureOwner(Request $request, JobPost $job): void
    {
        abort_unless($request->user()->clientProfile?->id === $job->client_profile_id, 403, 'Esta oferta no es tuya.');
    }

    private function appliedJobIds(Request $request): array
    {
        $viewer = auth('sanctum')->user();
        if (! $viewer || ! $viewer->isWorker() || ! $viewer->workerProfile) {
            return [];
        }

        return Application::where('worker_profile_id', $viewer->workerProfile->id)->pluck('job_post_id')->all();
    }
}
