<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesObraData;
use Tests\TestCase;

/** RF-12, RF-13: cierre de contratos y calificaciones. */
class ContractReviewTest extends TestCase
{
    use CreatesObraData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalogs();
    }

    public function test_no_se_califica_un_contrato_activo(): void
    {
        $client = $this->makeClient();
        $contract = $this->makeContract($this->makeJob($client), $this->makeWorker());
        Sanctum::actingAs($client);

        $this->postJson("/api/contracts/{$contract->id}/reviews", ['rating' => 5])->assertStatus(422);
    }

    public function test_finalizar_contrato_suma_trabajo_al_maestro(): void
    {
        $client = $this->makeClient();
        $worker = $this->makeWorker();
        $contract = $this->makeContract($this->makeJob($client), $worker);
        Sanctum::actingAs($client);

        $this->patchJson("/api/contracts/{$contract->id}/finish")->assertOk();

        $this->assertDatabaseHas('contracts', ['id' => $contract->id, 'status' => 'finished']);
        $this->assertSame(1, (int) $worker->workerProfile->fresh()->jobs_done);
    }

    public function test_no_se_finaliza_dos_veces(): void
    {
        $client = $this->makeClient();
        $contract = $this->makeContract($this->makeJob($client), $this->makeWorker(), 'finished');
        Sanctum::actingAs($client);

        $this->patchJson("/api/contracts/{$contract->id}/finish")->assertStatus(422);
    }

    public function test_calificacion_actualiza_promedio_del_maestro(): void
    {
        $client = $this->makeClient();
        $worker = $this->makeWorker();
        $c1 = $this->makeContract($this->makeJob($client), $worker, 'finished');
        $c2 = $this->makeContract($this->makeJob($client), $worker, 'finished');
        Sanctum::actingAs($client);

        $this->postJson("/api/contracts/{$c1->id}/reviews", ['rating' => 5, 'comment' => 'Excelente'])->assertCreated();
        $this->postJson("/api/contracts/{$c2->id}/reviews", ['rating' => 4])->assertCreated();

        $this->assertEquals(4.5, (float) $worker->workerProfile->fresh()->rating_avg);
    }

    public function test_no_se_califica_dos_veces_el_mismo_contrato(): void
    {
        $client = $this->makeClient();
        $contract = $this->makeContract($this->makeJob($client), $this->makeWorker(), 'finished');
        Sanctum::actingAs($client);

        $this->postJson("/api/contracts/{$contract->id}/reviews", ['rating' => 5])->assertCreated();
        $this->postJson("/api/contracts/{$contract->id}/reviews", ['rating' => 1])->assertStatus(422);
    }

    public function test_calificacion_fuera_de_rango_es_rechazada(): void
    {
        $client = $this->makeClient();
        $contract = $this->makeContract($this->makeJob($client), $this->makeWorker(), 'finished');
        Sanctum::actingAs($client);

        $this->postJson("/api/contracts/{$contract->id}/reviews", ['rating' => 6])
            ->assertStatus(422)->assertJsonValidationErrors('rating');
    }

    public function test_maestro_califica_al_contratante(): void
    {
        $client = $this->makeClient();
        $worker = $this->makeWorker();
        $contract = $this->makeContract($this->makeJob($client), $worker, 'finished');
        Sanctum::actingAs($worker);

        $this->postJson("/api/contracts/{$contract->id}/reviews", ['rating' => 4])->assertCreated();
        $this->assertDatabaseHas('reviews', ['reviewer_id' => $worker->id, 'reviewed_id' => $client->id]);
    }

    public function test_tercero_no_participa_en_el_contrato(): void
    {
        $contract = $this->makeContract($this->makeJob($this->makeClient()), $this->makeWorker());
        Sanctum::actingAs($this->makeClient());

        $this->patchJson("/api/contracts/{$contract->id}/finish")->assertForbidden();
        $this->patchJson("/api/contracts/{$contract->id}/cancel")->assertForbidden();
    }
}