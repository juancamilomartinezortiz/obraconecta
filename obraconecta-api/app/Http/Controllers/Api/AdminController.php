<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\City;
use App\Models\Contract;
use App\Models\JobPost;
use App\Models\Report;
use App\Models\Specialty;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        $months = collect(range(5, 0))->map(function (int $back) {
            $start = now()->startOfMonth()->subMonths($back);

            return [
                'month' => $start->translatedFormat('M Y'),
                'key' => $start->format('Y-m'),
                'contracts' => Contract::whereBetween('created_at', [$start, $start->copy()->endOfMonth()])->count(),
                'jobs' => JobPost::whereBetween('created_at', [$start, $start->copy()->endOfMonth()])->count(),
                'users' => User::whereBetween('created_at', [$start, $start->copy()->endOfMonth()])->count(),
            ];
        })->values();

        return response()->json([
            'users' => [
                'workers' => User::where('role', 'worker')->count(),
                'clients' => User::where('role', 'client')->count(),
                'verified' => User::whereNotNull('verified_at')->count(),
                'blocked' => User::where('status', 'blocked')->count(),
            ],
            'jobs' => [
                'open' => JobPost::where('status', 'open')->count(),
                'paused' => JobPost::where('status', 'paused')->count(),
                'closed' => JobPost::where('status', 'closed')->count(),
            ],
            'applications' => Application::count(),
            'contracts' => [
                'active' => Contract::where('status', 'active')->count(),
                'finished' => Contract::where('status', 'finished')->count(),
                'cancelled' => Contract::where('status', 'cancelled')->count(),
            ],
            'pending_verifications' => Verification::where('status', 'pending')->count(),
            'pending_reports' => Report::where('status', 'pending')->count(),
            'monthly' => $months,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::with('city')->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->trim().'%';
            $query->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('email', 'like', $term));
        }

        $page = $query->paginate(15);
        $page->getCollection()->each->withContact();

        return response()->json($page);
    }

    public function updateUserStatus(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['active', 'blocked'])]]);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'No puedes bloquear tu propia cuenta.'], 422);
        }

        $user->update($data);

        if ($data['status'] === 'blocked') {
            $user->tokens()->delete();
        }

        return response()->json($user->withContact());
    }

    public function verifications(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');

        $items = Verification::with('user.city')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()
            ->get()
            ->each(fn ($v) => $v->user->withContact());

        return response()->json($items);
    }

    public function verificationDocument(Verification $verification): StreamedResponse
    {
        abort_unless(Storage::disk('local')->exists($verification->document_url), 404, 'Documento no encontrado.');

        return Storage::disk('local')->response($verification->document_url);
    }

    public function reviewVerification(Request $request, Verification $verification): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string', 'max:255'],
        ]);

        $verification->update([
            'status' => $data['status'],
            'rejection_reason' => $data['status'] === 'rejected' ? $data['rejection_reason'] : null,
        ]);

        if ($data['status'] === 'approved' && ! $verification->user->verified_at) {
            $verification->user->update(['verified_at' => now()]);
        }

        return response()->json($verification->load('user'));
    }

    public function reports(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');

        return response()->json(
            Report::with('reporter:id,name,role')
                ->when($status !== 'all', fn ($q) => $q->where('status', $status))
                ->latest()
                ->get()
        );
    }

    public function updateReport(Request $request, Report $report): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'resolved', 'dismissed'])]]);
        $report->update($data);

        return response()->json($report);
    }

    public function storeSpecialty(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:60', 'unique:specialties,name']]);

        return response()->json(Specialty::create($data), 201);
    }

    public function destroySpecialty(Specialty $specialty): JsonResponse
    {
        if ($specialty->jobPosts()->exists()) {
            return response()->json(['message' => 'Hay ofertas que usan esta especialidad.'], 422);
        }

        $specialty->delete();

        return response()->json(['message' => 'Especialidad eliminada.']);
    }

    public function storeCity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'department' => ['required', 'string', 'max:80'],
        ]);

        return response()->json(City::create($data), 201);
    }

    public function destroyCity(City $city): JsonResponse
    {
        if ($city->jobPosts()->exists() || $city->users()->exists()) {
            return response()->json(['message' => 'Hay usuarios u ofertas en esta ciudad.'], 422);
        }

        $city->delete();

        return response()->json(['message' => 'Ciudad eliminada.']);
    }
}
