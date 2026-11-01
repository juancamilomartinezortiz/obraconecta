<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Contract;
use App\Models\JobPost;
use App\Models\Review;
use App\Models\Specialty;
use App\Models\WorkerProfile;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'cities' => City::orderBy('name')->get(),
            'specialties' => Specialty::withCount('workers')->orderBy('name')->get(),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'workers' => WorkerProfile::count(),
            'open_jobs' => JobPost::where('status', 'open')->count(),
            'finished_contracts' => Contract::where('status', 'finished')->count(),
            'avg_rating' => round((float) Review::avg('rating'), 1),
        ]);
    }
}
