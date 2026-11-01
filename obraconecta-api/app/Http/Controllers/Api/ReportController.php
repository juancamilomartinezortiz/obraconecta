<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'target_type' => ['required', Rule::in(['user', 'job_post', 'review'])],
            'target_id' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $report = Report::create($data + ['reporter_id' => $request->user()->id, 'status' => 'pending']);

        return response()->json($report, 201);
    }
}
