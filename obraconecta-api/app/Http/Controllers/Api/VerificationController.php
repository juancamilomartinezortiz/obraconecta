<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Verification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VerificationController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        return response()->json($request->user()->verifications()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['id_card', 'certificate'])],
            'title' => ['nullable', 'string', 'max:140'],
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        // Los documentos se guardan en el disco privado (no son públicos).
        $verification = Verification::create([
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'title' => $data['title'] ?? null,
            'document_url' => $request->file('document')->store('verifications', 'local'),
            'status' => 'pending',
        ]);

        return response()->json($verification, 201);
    }
}
