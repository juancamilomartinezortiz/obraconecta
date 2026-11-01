<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\JobPostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Controllers\Api\WorkerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ObraConecta API  ·  prefijo /api
|--------------------------------------------------------------------------
*/

// ---------- Públicas ----------
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/catalogs', [CatalogController::class, 'index']);
Route::get('/stats', [CatalogController::class, 'stats']);

Route::get('/workers', [WorkerController::class, 'index']);
Route::get('/workers/{worker}', [WorkerController::class, 'show']);

Route::get('/jobs', [JobPostController::class, 'index']);
Route::get('/jobs/{job}', [JobPostController::class, 'show']);

// ---------- Con sesión ----------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::put('/me/profile', [ProfileController::class, 'update']);
    Route::post('/me/photo', [ProfileController::class, 'photo']);

    Route::get('/me/verifications', [VerificationController::class, 'mine']);
    Route::post('/me/verifications', [VerificationController::class, 'store']);

    Route::get('/me/contracts', [ContractController::class, 'mine'])->middleware('role:worker,client');
    Route::patch('/contracts/{contract}/finish', [ContractController::class, 'finish']);
    Route::patch('/contracts/{contract}/cancel', [ContractController::class, 'cancel']);
    Route::post('/contracts/{contract}/reviews', [ContractController::class, 'review']);

    Route::patch('/applications/{application}', [ApplicationController::class, 'updateStatus']);

    Route::post('/reports', [ReportController::class, 'store']);

    // Maestro
    Route::middleware('role:worker')->group(function () {
        Route::get('/me/portfolio', [ProfileController::class, 'portfolio']);
        Route::post('/me/portfolio', [ProfileController::class, 'storePortfolio']);
        Route::delete('/me/portfolio/{item}', [ProfileController::class, 'destroyPortfolio']);

        Route::get('/me/applications', [ApplicationController::class, 'mine']);
        Route::post('/jobs/{job}/apply', [ApplicationController::class, 'store']);
    });

    // Contratante
    Route::middleware('role:client')->group(function () {
        Route::get('/me/jobs', [JobPostController::class, 'mine']);
        Route::post('/jobs', [JobPostController::class, 'store']);
        Route::put('/jobs/{job}', [JobPostController::class, 'update']);
        Route::patch('/jobs/{job}/status', [JobPostController::class, 'updateStatus']);
        Route::delete('/jobs/{job}', [JobPostController::class, 'destroy']);
        Route::get('/jobs/{job}/applications', [JobPostController::class, 'applications']);
        Route::post('/workers/{worker}/invite', [WorkerController::class, 'invite']);
    });

    // Administrador
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}/status', [AdminController::class, 'updateUserStatus']);
        Route::get('/verifications', [AdminController::class, 'verifications']);
        Route::get('/verifications/{verification}/document', [AdminController::class, 'verificationDocument']);
        Route::patch('/verifications/{verification}', [AdminController::class, 'reviewVerification']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::patch('/reports/{report}', [AdminController::class, 'updateReport']);
        Route::post('/specialties', [AdminController::class, 'storeSpecialty']);
        Route::delete('/specialties/{specialty}', [AdminController::class, 'destroySpecialty']);
        Route::post('/cities', [AdminController::class, 'storeCity']);
        Route::delete('/cities/{city}', [AdminController::class, 'destroyCity']);
    });
});
