<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Uso en rutas: ->middleware('role:client') o 'role:worker,admin'
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'No tienes permiso para esta acción.'], 403);
        }

        if ($user->status === 'blocked') {
            return response()->json(['message' => 'Tu cuenta está bloqueada.'], 403);
        }

        return $next($request);
    }
}
