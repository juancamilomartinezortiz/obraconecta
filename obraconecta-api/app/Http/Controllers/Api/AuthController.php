<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['worker', 'client'])],
            'city_id' => ['nullable', 'exists:cities,id'],
            'client_type' => ['nullable', Rule::in(['company', 'person'])],
            'business_name' => ['nullable', 'string', 'max:160'],
            'accept_terms' => ['accepted'],
        ], [
            'accept_terms.accepted' => 'Debes aceptar la política de tratamiento de datos.',
            'email.unique' => 'Ya existe una cuenta con este correo.',
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'role' => $data['role'],
                'city_id' => $data['city_id'] ?? null,
            ]);

            if ($user->isWorker()) {
                WorkerProfile::create(['user_id' => $user->id]);
            } else {
                ClientProfile::create([
                    'user_id' => $user->id,
                    'type' => $data['client_type'] ?? 'person',
                    'business_name' => $data['business_name'] ?? null,
                ]);
            }

            return $user;
        });

        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user' => self::profile($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'El correo o la contraseña no son correctos.',
            ]);
        }

        if ($user->status === 'blocked') {
            return response()->json(['message' => 'Tu cuenta está bloqueada. Escribe a soporte.'], 403);
        }

        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user' => self::profile($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(self::profile($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    /**
     * Datos completos del usuario autenticado (incluye correo y celular).
     */
    public static function profile(User $user): User
    {
        return $user->fresh()
            ->load(['city', 'workerProfile.specialties', 'clientProfile'])
            ->withContact();
    }
}
