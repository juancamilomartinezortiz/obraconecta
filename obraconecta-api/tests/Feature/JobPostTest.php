<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesObraData;
use Tests\TestCase;

/** RF-06, RF-07, RF-08: publicación, búsqueda y gestión de ofertas. */
class JobPostTest extends TestCase
{
    use CreatesObraData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalogs();
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'title' => 'Enchape de baño',
            'description' => 'Enchape de piso y pared, 12 m2.',
            'specialty_id' => $this->specialty->id,
            'city_id' => $this->city->id,
            'budget' => 800000,
            'budget_type' => 'total',
            'workers_needed' => 1,
        ], $override);
    }

    public function test_contratante_publica_oferta(): void
    {
        Sanctum::actingAs($this->makeClient());

        $this->postJson('/api/jobs', $this->payload())
            ->assertCreated()->assertJsonPath('status', 'open');
        $this->assertDatabaseHas('job_posts', ['title' => 'Enchape de baño']);
    }

    public function test_maestro_no_puede_publicar_ofertas(): void
    {
        Sanctum::actingAs($this->makeWorker());

        $this->postJson('/api/jobs', $this->payload())->assertForbidden();
    }

    public function test_publicar_valida_datos(): void
    {
        Sanctum::actingAs($this->makeClient());

        $this->postJson('/api/jobs', $this->payload([
            'title' => '',
            'budget' => -5,
            'budget_type' => 'semanal',
            'workers_needed' => 0,
            'specialty_id' => 9999,
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'budget', 'budget_type', 'workers_needed', 'specialty_id']);
    }

    public function test_listado_publico_muestra_solo_ofertas_abiertas(): void
    {
        $client = $this->makeClient();
        $this->makeJob($client, ['title' => 'Abierta']);
        $this->makeJob($client, ['title' => 'Pausada', 'status' => 'paused']);
        $this->makeJob($client, ['title' => 'Cerrada', 'status' => 'closed']);

        $res = $this->getJson('/api/jobs')->assertOk();

        $this->assertSame(['Abierta'], collect($res->json('data'))->pluck('title')->all());
    }

    public function test_filtros_por_texto_y_presupuesto(): void
    {
        $client = $this->makeClient();
        $this->makeJob($client, ['title' => 'Pintura fachada', 'budget' => 300000]);
        $this->makeJob($client, ['title' => 'Muro en bloque', 'budget' => 2000000]);

        $this->getJson('/api/jobs?q=fachada')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/jobs?min_budget=1000000')->assertOk()
            ->assertJsonPath('data.0.title', 'Muro en bloque');
    }

    public function test_otro_contratante_no_puede_editar_la_oferta(): void
    {
        $job = $this->makeJob($this->makeClient());
        Sanctum::actingAs($this->makeClient());

        $this->putJson("/api/jobs/{$job->id}", $this->payload())->assertForbidden();
        $this->deleteJson("/api/jobs/{$job->id}")->assertForbidden();
    }

    public function test_duenio_edita_y_pausa_su_oferta(): void
    {
        $client = $this->makeClient();
        $job = $this->makeJob($client);
        Sanctum::actingAs($client);

        $this->putJson("/api/jobs/{$job->id}", $this->payload(['title' => 'Título nuevo']))->assertOk();
        $this->patchJson("/api/jobs/{$job->id}/status", ['status' => 'paused'])->assertOk();

        $this->assertDatabaseHas('job_posts', ['id' => $job->id, 'title' => 'Título nuevo', 'status' => 'paused']);
    }

    public function test_no_se_elimina_oferta_con_contratacion(): void
    {
        $client = $this->makeClient();
        $job = $this->makeJob($client);
        $this->makeApplication($job, $this->makeWorker(), ['status' => 'accepted']);
        Sanctum::actingAs($client);

        $this->deleteJson("/api/jobs/{$job->id}")->assertStatus(422);
        $this->assertDatabaseHas('job_posts', ['id' => $job->id]);
    }
}