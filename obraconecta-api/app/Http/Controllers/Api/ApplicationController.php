<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Contract;
use App\Models\JobPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ApplicationController extends Controller
{
    public function store(Request $request, JobPost $job): JsonResponse
    {
        $worker = $request->user()->workerProfile;

        if ($job->status !== 'open') {
            return response()->json(['message' => 'Esta oferta ya no recibe postulaciones.'], 422);
        }

        if (Application::where('job_post_id', $job->id)->where('worker_profile_id', $worker->id)->exists()) {
            return response()->json(['message' => 'Ya te postulaste a esta oferta.'], 422);
        }

        $data = $request->validate([
            'message' => ['nullable', 'string', 'max:1000'],
            'rate' => ['nullable', 'integer', 'min:0'],
        ]);

        $application = Application::create([
            'job_post_id' => $job->id,
            'worker_profile_id' => $worker->id,
            'message' => $data['message'] ?? null,
            'rate' => $data['rate'] ?? null,
            'status' => 'sent',
        ]);

        return response()->json($application, 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $applications = Application::with([
            'jobPost.specialty',
            'jobPost.city',
            'jobPost.client.user:id,name,photo_url,verified_at,email,phone',
            'contract',
        ])
            ->where('worker_profile_id', $request->user()->workerProfile->id)
            ->latest()
            ->get()
            ->each(function (Application $a) {
                if ($a->status === 'accepted') {
                    $a->jobPost->client->user->withContact();
                }
            });

        return response()->json($applications);
    }

    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['seen', 'accepted', 'rejected'])],
        ]);

        $user = $request->user();
        $application->load('jobPost', 'worker');

        // Las invitaciones las responde el maestro; las postulaciones, el contratante.
        if ($application->is_invitation) {
            abort_unless($user->workerProfile?->id === $application->worker_profile_id, 403, 'No puedes responder esta invitación.');
        } else {
            abort_unless($user->clientProfile?->id === $application->jobPost->client_profile_id, 403, 'No puedes responder esta postulación.');
        }

        if ($application->status === 'accepted') {
            return response()->json(['message' => 'Esta postulación ya fue aceptada.'], 422);
        }

        DB::transaction(function () use ($application, $data) {
            $application->update(['status' => $data['status']]);

            if ($data['status'] === 'accepted' && ! $application->contract) {
                Contract::create([
                    'application_id' => $application->id,
                    'agreed_value' => $application->rate ?? $application->jobPost->budget,
                    'start_date' => $application->jobPost->start_date ?? now()->toDateString(),
                    'status' => 'active',
                ]);
            }
        });

        $application->load(['contract', 'worker.user', 'jobPost.client.user']);
        if ($application->status === 'accepted') {
            $application->worker->user->withContact();
            $application->jobPost->client->user->withContact();
        }

        return response()->json($application);
    }
}
