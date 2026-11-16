<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesObraData;
use Tests\TestCase;

/** RNF-09: protección de datos personales (Ley 1581 de 2012). */
class PrivacyTest extends TestCase
{
    use CreatesObraData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalogs();
    }

    public function test_perfil_publico_oculta_correo_y_celular(): void
    {
        $worker = $this->makeWorker();

        $res = $this->getJson("/api/workers/{$worker->workerProfile->id}")->assertOk();

        $this->assertNull($res->json('worker.user.phone'));
        $this->assertNull($res->json('worker.user.email'));
        $res->assertJsonPath('can_contact', false);
    }

    public function test_listado_de_maestros_no_expone_contacto(): void
    {
        $this->makeWorker();

        $res = $this->getJson('/api/workers')->assertOk();

        $this->assertNull($res->json('data.0.user.phone'));
        $this->assertNull($res->json('data.0.user.email'));
    }

    public function test_contratante_con_postulacion_aceptada_ve_el_celular(): void
    {
        $client = $this->makeClient();
        $worker = $this->makeWorker(['phone' => '3209998877']);
        $this->makeApplication($this->makeJob($client), $worker, ['status' => 'accepted']);
        Sanctum::actingAs($client);

        $this->getJson("/api/workers/{$worker->workerProfile->id}")
            ->assertOk()
            ->assertJsonPath('can_contact', true)
            ->assertJsonPath('worker.user.phone', '3209998877');
    }

    public function test_contratante_sin_contratacion_no_ve_el_celular(): void
    {
        $worker = $this->makeWorker();
        Sanctum::actingAs($this->makeClient());

        $res = $this->getJson("/api/workers/{$worker->workerProfile->id}")->assertOk();
        $this->assertNull($res->json('worker.user.phone'));
    }
}