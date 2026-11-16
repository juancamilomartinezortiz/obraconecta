<?php

namespace Tests\Feature;

use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesObraData;
use Tests\TestCase;

/** RF-14, RF-15, RNF-05: administración, verificación y control por roles. */
class AdminTest extends TestCase
{
    use CreatesObraData, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalogs();
    }

    public function test_maestro_y_contratante_no_entran_al_panel(): void
    {
        Sanctum::actingAs($this->makeWorker());
        $this->getJson('/api/admin/stats')->assertForbidden();

        Sanctum::actingAs($this->makeClient());
        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_ve_estadisticas(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->getJson('/api/admin/stats')->assertOk();
    }

    public function test_admin_bloquea_usuario_y_revoca_sus_tokens(): void
    {
        $worker = $this->makeWorker();
        $worker->createToken('app');
        Sanctum::actingAs($this->makeAdmin());

        $this->patchJson("/api/admin/users/{$worker->id}/status", ['status' => 'blocked'])->assertOk();

        $this->assertDatabaseHas('users', ['id' => $worker->id, 'status' => 'blocked']);
        $this->assertSame(0, $worker->tokens()->count());
    }

    public function test_admin_no_puede_bloquearse_a_si_mismo(): void
    {
        $admin = $this->makeAdmin();
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/users/{$admin->id}/status", ['status' => 'blocked'])->assertStatus(422);
    }

    public function test_usuario_bloqueado_no_usa_rutas_de_su_rol(): void
    {
        Sanctum::actingAs($this->makeClient(['status' => 'blocked']));

        $this->getJson('/api/me/jobs')->assertForbidden();
    }

    public function test_aprobar_verificacion_marca_usuario_verificado(): void
    {
        $worker = $this->makeWorker();
        $verification = Verification::create([
            'user_id' => $worker->id,
            'type' => 'id_card',
            'document_url' => 'verifications/cedula.pdf',
            'status' => 'pending',
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->patchJson("/api/admin/verifications/{$verification->id}", ['status' => 'approved'])->assertOk();

        $this->assertNotNull($worker->fresh()->verified_at);
    }

    public function test_rechazo_de_verificacion_exige_motivo(): void
    {
        $verification = Verification::create([
            'user_id' => $this->makeWorker()->id,
            'type' => 'certificate',
            'document_url' => 'verifications/sena.pdf',
        ]);
        Sanctum::actingAs($this->makeAdmin());

        $this->patchJson("/api/admin/verifications/{$verification->id}", ['status' => 'rejected'])
            ->assertStatus(422)->assertJsonValidationErrors('rejection_reason');
    }

    public function test_admin_crea_especialidad_sin_duplicados(): void
    {
        Sanctum::actingAs($this->makeAdmin());

        $this->postJson('/api/admin/specialties', ['name' => 'Plomería'])->assertSuccessful();
        $this->postJson('/api/admin/specialties', ['name' => 'Plomería'])
            ->assertStatus(422)->assertJsonValidationErrors('name');
    }
}