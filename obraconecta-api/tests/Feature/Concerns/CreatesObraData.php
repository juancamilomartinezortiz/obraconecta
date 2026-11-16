<?php

namespace Tests\Feature\Concerns;

use App\Models\Application;
use App\Models\City;
use App\Models\ClientProfile;
use App\Models\Contract;
use App\Models\JobPost;
use App\Models\Specialty;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

trait CreatesObraData
{
    protected City $city;

    protected Specialty $specialty;

    protected function seedCatalogs(): void
    {
        $this->city = City::create(['name' => 'Popayán', 'department' => 'Cauca']);
        $this->specialty = Specialty::create(['name' => 'Albañilería']);
    }

    protected function makeUser(string $role, array $attrs = []): User
    {
        return User::create(array_merge([
            'name' => ucfirst($role).' '.Str::random(5),
            'email' => Str::lower(Str::random(8)).'@test.com',
            'phone' => '3001234567',
            'password' => Hash::make('password123'),
            'role' => $role,
            'city_id' => $this->city->id ?? null,
            'status' => 'active',
        ], $attrs));
    }

    protected function makeWorker(array $attrs = []): User
    {
        $user = $this->makeUser('worker', $attrs);
        WorkerProfile::create(['user_id' => $user->id, 'years_experience' => 5, 'daily_rate' => 90000]);

        return $user->fresh();
    }

    protected function makeClient(array $attrs = []): User
    {
        $user = $this->makeUser('client', $attrs);
        ClientProfile::create(['user_id' => $user->id, 'type' => 'company', 'business_name' => 'Constructora Test']);

        return $user->fresh();
    }

    protected function makeAdmin(): User
    {
        return $this->makeUser('admin');
    }

    protected function makeJob(User $client, array $attrs = []): JobPost
    {
        return JobPost::create(array_merge([
            'client_profile_id' => $client->clientProfile->id,
            'specialty_id' => $this->specialty->id,
            'city_id' => $this->city->id,
            'title' => 'Levantar muro de bloque',
            'description' => 'Muro de 20 m2 en vivienda.',
            'budget' => 1500000,
            'budget_type' => 'total',
            'workers_needed' => 1,
            'status' => 'open',
        ], $attrs));
    }

    protected function makeApplication(JobPost $job, User $worker, array $attrs = []): Application
    {
        return Application::create(array_merge([
            'job_post_id' => $job->id,
            'worker_profile_id' => $worker->workerProfile->id,
            'message' => 'Tengo experiencia.',
            'status' => 'sent',
            'is_invitation' => false,
        ], $attrs));
    }

    protected function makeContract(JobPost $job, User $worker, string $status = 'active'): Contract
    {
        $application = $this->makeApplication($job, $worker, ['status' => 'accepted']);

        return Contract::create([
            'application_id' => $application->id,
            'agreed_value' => $job->budget,
            'start_date' => now()->toDateString(),
            'status' => $status,
        ]);
    }
}