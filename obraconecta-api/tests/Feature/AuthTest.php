<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesObraData;
use Tests\TestCase;

/** RF-01, RF-02, RNF-05: registro, inicio de sesión y control de acceso. */
class AuthTest extends TestCase
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
            'name' => 'Pedro Gómez',
            'email' => 'pedro@test.com',
            'phone' => '3105556677',
            'password' => 'secreta123',
            'role' => 'worker',
            'city_id' => $this->city->id,
            'accept_terms' => true,
        ], $override);
    }

    public function test_maestro_se_registra_y_recibe_token(): void
    {
        $res = $this->postJson('/api/auth/register', $this->payload());

        $res->assertCreated()->assertJsonStructure(['token', 'user' => ['id', 'name', 'role']]);
        $this->assertDatabaseHas('users', ['email' => 'pedro@test.com', 'role' => 'worker']);
        $this->assertDatabaseCount('worker_profiles', 1);
    }

    public function test_contratante_se_registra_con_perfil_de_cliente(): void
    {
        $this->postJson('/api/auth/register', $this->payload([
            'role' => 'client',
            'client_type' => 'company',
            'business_name' => 'Constructora Cauca',
        ]))->assertCreated();

        $this->assertDatabaseCount('client_profiles', 1);
    }

    public function test_registro_exige_aceptar_politica_de_datos(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['accept_terms' => false]))
            ->assertStatus(422)->assertJsonValidationErrors('accept_terms');
    }

    public function test_registro_rechaza_correo_duplicado(): void
    {
        $this->makeWorker(['email' => 'pedro@test.com']);

        $this->postJson('/api/auth/register', $this->payload())
            ->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_registro_valida_campos(): void
    {
        $this->postJson('/api/auth/register', $this->payload([
            'email' => 'no-es-correo',
            'password' => '123',
            'role' => 'admin',
            'name' => '',
        ]))->assertStatus(422)->assertJsonValidationErrors(['email', 'password', 'role', 'name']);
    }

    public function test_login_correcto_devuelve_token(): void
    {
        $user = $this->makeWorker(['email' => 'ana@test.com']);

        $this->postJson('/api/auth/login', ['email' => 'ana@test.com', 'password' => 'password123'])
            ->assertOk()->assertJsonPath('user.id', $user->id)->assertJsonStructure(['token']);
    }

    public function test_login_con_clave_incorrecta_falla(): void
    {
        $this->makeWorker(['email' => 'ana@test.com']);

        $this->postJson('/api/auth/login', ['email' => 'ana@test.com', 'password' => 'otraclave'])
            ->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_usuario_bloqueado_no_puede_ingresar(): void
    {
        $this->makeWorker(['email' => 'ana@test.com', 'status' => 'blocked']);

        $this->postJson('/api/auth/login', ['email' => 'ana@test.com', 'password' => 'password123'])
            ->assertForbidden();
    }

    public function test_ruta_protegida_sin_token_responde_401(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_me_devuelve_usuario_con_token_valido(): void
    {
        $user = $this->makeClient();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')->assertOk();
    }
}