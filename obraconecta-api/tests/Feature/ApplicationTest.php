<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesObraData;
use Tests\TestCase;

/** RF-09, RF-10, RF-11: postulaciones, invitaciones y contratación. */
class ApplicationTest extends TestCase
{
    use CreatesObraData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalogs();
    }

    public function test_maestro_se_postula_a_oferta_abierta(): void
    {
        $job = $this->makeJob($this->makeClient());
        Sanctum::actingAs($this->makeWorker());

        $this->postJson("/api/jobs/{$job->id}/apply", ['message' => 'Disponible', 'rate' => 1200000])
            ->assertCreated()->assertJsonPath('status', 'sent');
    }

    public function test_no_permite_postularse_dos_veces(): void
    {
        $job = $this->makeJob($this->makeClient());
        $worker = $this->makeWorker();
        $this->makeApplication($job, $worker);
        Sanctum::actingAs($worker);

        $this->postJson("/api/jobs/{$job->id}/apply", ['message' => 'Otra vez'])->assertStatus(422);
    }

    public function test_no_permite_postularse_a_oferta_pausada(): void
    {
        $job = $this->makeJob($this->makeClient(), ['status' => 'paused']);
        Sanctum::actingAs($this->makeWorker());

        $this->postJson("/api/jobs/{$job->id}/apply", [])->assertStatus(422);
    }

    public function test_contratante_no_puede_postularse(): void
    {
        $job = $this->makeJob($this->makeClient());
        Sanctum::actingAs($this->makeClient());

        $this->postJson("/api/jobs/{$job->id}/apply", [])->assertForbidden();
    }

    public function test_duenio_acepta_postulacion_y_se_crea_contrato(): void
    {
        $client = $this->makeClient();
        $job = $this->makeJob($client, ['budget' => 1500000]);
        $app = $this->makeApplication($job, $this->makeWorker(), ['rate' => 1300000]);
        Sanctum::actingAs($client);

        $this->patchJson("/api/applications/{$app->id}", ['status' => 'accepted'])->assertOk();

        $this->assertDatabaseHas('contracts', [
            'application_id' => $app->id,
            'agreed_value' => 1300000,
            'status' => 'active',
        ]);
    }

    public function test_sin_tarifa_el_contrato_toma_el_presupuesto(): void
    {
        $client = $this->makeClient();
        $job = $this->makeJob($client, ['budget' => 900000]);
        $app = $this->makeApplication($job, $this->makeWorker(), ['rate' => null]);
        Sanctum::actingAs($client);

        $this->patchJson("/api/applications/{$app->id}", ['status' => 'accepted'])->assertOk();
        $this->assertDatabaseHas('contracts', ['application_id' => $app->id, 'agreed_value' => 900000]);
    }

    public function test_otro_contratante_no_puede_responder_postulacion(): void
    {
        $app = $this->makeApplication($this->makeJob($this->makeClient()), $this->makeWorker());
        Sanctum::actingAs($this->makeClient());

        $this->patchJson("/api/applications/{$app->id}", ['status' => 'accepted'])->assertForbidden();
        $this->assertDatabaseCount('contracts', 0);
    }

    public function test_maestro_no_puede_aceptar_su_propia_postulacion(): void
    {
        $worker = $this->makeWorker();
        $app = $this->makeApplication($this->makeJob($this->makeClient()), $worker);
        Sanctum::actingAs($worker);

        $this->patchJson("/api/applications/{$app->id}", ['status' => 'accepted'])->assertForbidden();
    }

    public function test_postulacion_aceptada_no_se_vuelve_a_responder(): void
    {
        $client = $this->makeClient();
        $app = $this->makeApplication($this->makeJob($client), $this->makeWorker(), ['status' => 'accepted']);
        Sanctum::actingAs($client);

        $this->patchJson("/api/applications/{$app->id}", ['status' => 'rejected'])->assertStatus(422);
    }

    public function test_estado_invalido_es_rechazado(): void
    {
        $client = $this->makeClient();
        $app = $this->makeApplication($this->makeJob($client), $this->makeWorker());
        Sanctum::actingAs($client);

        $this->patchJson("/api/applications/{$app->id}", ['status' => 'aprobada'])
            ->assertStatus(422)->assertJsonValidationErrors('status');
    }

    public function test_contratante_invita_y_el_maestro_acepta(): void
    {
        $client = $this->makeClient();
        $worker = $this->makeWorker();
        $job = $this->makeJob($client);

        Sanctum::actingAs($client);
        $appId = $this->postJson("/api/workers/{$worker->workerProfile->id}/invite", ['job_post_id' => $job->id])
            ->assertCreated()->assertJsonPath('is_invitation', true)->json('id');

        $this->postJson("/api/workers/{$worker->workerProfile->id}/invite", ['job_post_id' => $job->id])
            ->assertStatus(422);

        Sanctum::actingAs($worker);
        $this->patchJson("/api/applications/{$appId}", ['status' => 'accepted'])->assertOk();
        $this->assertDatabaseHas('contracts', ['application_id' => $appId]);
    }
}