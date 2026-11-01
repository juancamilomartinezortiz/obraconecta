<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContractController extends Controller
{
    private const RELATIONS = [
        'application.jobPost.specialty',
        'application.jobPost.city',
        'application.jobPost.client.user',
        'application.worker.user',
        'reviews',
    ];

    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Contract::with(self::RELATIONS)->latest();

        if ($user->isWorker()) {
            $query->whereHas('application', fn ($a) => $a->where('worker_profile_id', $user->workerProfile->id));
        } else {
            $query->whereHas('application.jobPost', fn ($j) => $j->where('client_profile_id', $user->clientProfile->id));
        }

        $contracts = $query->get()->each(function (Contract $c) use ($user) {
            $c->application->worker->user->withContact();
            $c->application->jobPost->client->user->withContact();
            $c->setAttribute('my_review', $c->reviews->firstWhere('reviewer_id', $user->id));
            $c->setAttribute('their_review', $c->reviews->first(fn ($r) => $r->reviewer_id !== $user->id));
        });

        return response()->json($contracts);
    }

    public function finish(Request $request, Contract $contract): JsonResponse
    {
        $contract->load(self::RELATIONS);
        $this->ensureParty($request->user(), $contract);

        if ($contract->status !== 'active') {
            return response()->json(['message' => 'Este contrato ya no está activo.'], 422);
        }

        DB::transaction(function () use ($contract) {
            $contract->update(['status' => 'finished', 'end_date' => now()->toDateString()]);
            $contract->application->worker->increment('jobs_done');
        });

        return response()->json($contract->fresh(self::RELATIONS));
    }

    public function cancel(Request $request, Contract $contract): JsonResponse
    {
        $contract->load(self::RELATIONS);
        $this->ensureParty($request->user(), $contract);

        if ($contract->status !== 'active') {
            return response()->json(['message' => 'Este contrato ya no está activo.'], 422);
        }

        $contract->update(['status' => 'cancelled', 'end_date' => now()->toDateString()]);

        return response()->json($contract->fresh(self::RELATIONS));
    }

    public function review(Request $request, Contract $contract): JsonResponse
    {
        $user = $request->user();
        $contract->load(self::RELATIONS);
        $this->ensureParty($user, $contract);

        if ($contract->status !== 'finished') {
            return response()->json(['message' => 'Solo puedes calificar cuando el trabajo está finalizado.'], 422);
        }

        if ($contract->reviews->contains('reviewer_id', $user->id)) {
            return response()->json(['message' => 'Ya calificaste este trabajo.'], 422);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $workerUser = $contract->application->worker->user;
        $clientUser = $contract->application->jobPost->client->user;
        $reviewed = $user->id === $workerUser->id ? $clientUser : $workerUser;

        $review = DB::transaction(function () use ($contract, $user, $reviewed, $data) {
            $review = Review::create([
                'contract_id' => $contract->id,
                'reviewer_id' => $user->id,
                'reviewed_id' => $reviewed->id,
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
            ]);

            if ($reviewed->isWorker() && $reviewed->workerProfile) {
                $avg = Review::where('reviewed_id', $reviewed->id)->avg('rating');
                $reviewed->workerProfile->update(['rating_avg' => round((float) $avg, 2)]);
            }

            return $review;
        });

        return response()->json($review, 201);
    }

    private function ensureParty(User $user, Contract $contract): void
    {
        $isWorker = $contract->application->worker->user_id === $user->id;
        $isClient = $contract->application->jobPost->client->user_id === $user->id;

        abort_unless($isWorker || $isClient, 403, 'No participas en este contrato.');
    }
}
