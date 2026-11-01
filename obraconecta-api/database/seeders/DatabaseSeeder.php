<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\City;
use App\Models\ClientProfile;
use App\Models\Contract;
use App\Models\JobPost;
use App\Models\Review;
use App\Models\Specialty;
use App\Models\User;
use App\Models\WorkerProfile;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Datos de demostración. Todas las cuentas usan la contraseña: password123
     * (el administrador usa admin12345).
     */
    public function run(): void
    {
        // ---------- Catálogos ----------
        $specialties = collect([
            ['Mampostería', 'brick'], ['Acabados', 'trowel'], ['Eléctrico', 'bolt'], ['Plomería', 'pipe'],
            ['Pintura', 'roller'], ['Enchape', 'tiles'], ['Carpintería', 'saw'], ['Estructura', 'beam'],
            ['Soldadura', 'flame'], ['Techos', 'roof'],
        ])->mapWithKeys(fn ($s) => [$s[0] => Specialty::firstOrCreate(['name' => $s[0]], ['icon' => $s[1]])]);

        $cities = collect([
            ['Popayán', 'Cauca'], ['Timbío', 'Cauca'], ['Piendamó', 'Cauca'], ['Santander de Quilichao', 'Cauca'],
            ['El Tambo', 'Cauca'], ['Cajibío', 'Cauca'], ['Cali', 'Valle del Cauca'], ['Pasto', 'Nariño'],
        ])->mapWithKeys(fn ($c) => [$c[0] => City::firstOrCreate(['name' => $c[0]], ['department' => $c[1]])]);

        $popayan = $cities['Popayán'];

        // ---------- Administrador ----------
        User::firstOrCreate(['email' => 'admin@obraconecta.com'], [
            'name' => 'Administrador ObraConecta',
            'password' => 'admin12345',
            'role' => 'admin',
            'city_id' => $popayan->id,
            'verified_at' => now(),
        ]);

        // ---------- Maestros ----------
        $workersData = [
            ['Carlos Muñoz', 'carlos@demo.com', '3104567890', 'Popayán', 15, 120000, 'available', 'Centro, Bello Horizonte, La Esmeralda',
                'Maestro de obra con 15 años construyendo casas de 1 y 2 pisos en Popayán. Trabajo con mi equipo de 2 oficiales y herramienta propia. Cumplo tiempos y entrego todo limpio.',
                ['Mampostería', 'Estructura', 'Acabados'], true],
            ['Jhon Ruiz', 'jhon@demo.com', '3156781234', 'Popayán', 8, 95000, 'available', 'Bello Horizonte, Lomas de Granada',
                'Oficial de construcción especializado en enchapes de baños y cocinas, porcelanato y cerámica. Acabados finos y emboquillado.',
                ['Enchape', 'Acabados'], true],
            ['Luis Sánchez', 'luis@demo.com', '3009876543', 'Timbío', 20, 130000, 'busy', 'Timbío, Popayán sur',
                'Más de 20 años en obra. He dirigido construcción de viviendas, muros de contención y placas. Cuento con certificado de trabajo seguro en alturas.',
                ['Mampostería', 'Estructura', 'Techos'], false],
            ['Andrés Paz', 'andres@demo.com', '3201112233', 'Popayán', 6, 90000, 'available', 'Yanaconas, Pomona, Centro',
                'Electricista certificado. Instalaciones residenciales nuevas, cambio de redes, tableros, iluminación LED y puesta a tierra.',
                ['Eléctrico'], true],
            ['Diego Hoyos', 'diego@demo.com', '3112223344', 'Piendamó', 10, 100000, 'available', 'Piendamó, Morales, Cajibío',
                'Plomero e instalador de redes hidrosanitarias. Arreglo fugas, instalo tanques, calentadores y baños completos.',
                ['Plomería', 'Enchape'], false],
            ['Fernando Rojas', 'fernando@demo.com', '3165554433', 'Popayán', 12, 85000, 'available', 'Todo Popayán',
                'Pintor de interiores y fachadas. Estuco, vinilo, esmalte y pintura epóxica. Trabajo limpio, protejo pisos y muebles.',
                ['Pintura', 'Acabados'], true],
            ['Mauricio Gómez', 'mauricio@demo.com', '3184445566', 'Santander de Quilichao', 9, 110000, 'available', 'Santander de Quilichao, Popayán',
                'Carpintero y ebanista. Cocinas integrales, closets, puertas y techos en madera. Diseño a la medida.',
                ['Carpintería', 'Techos'], false],
            ['Wilson Cerón', 'wilson@demo.com', '3017778899', 'El Tambo', 14, 115000, 'busy', 'El Tambo, Popayán',
                'Soldador y estructurista. Estructuras metálicas, rejas, portones, escaleras y cubiertas en teja termoacústica.',
                ['Soldadura', 'Estructura', 'Techos'], true],
        ];

        $workers = collect($workersData)->map(function ($w) use ($specialties, $cities) {
            [$name, $email, $phone, $city, $years, $rate, $avail, $zones, $bio, $specs, $verified] = $w;

            $user = User::firstOrCreate(['email' => $email], [
                'name' => $name,
                'phone' => $phone,
                'password' => 'password123',
                'role' => 'worker',
                'city_id' => $cities[$city]->id,
                'verified_at' => $verified ? now()->subDays(rand(10, 200)) : null,
            ]);

            $profile = WorkerProfile::firstOrCreate(['user_id' => $user->id], [
                'bio' => $bio,
                'years_experience' => $years,
                'daily_rate' => $rate,
                'availability' => $avail,
                'work_zones' => $zones,
            ]);

            $profile->specialties()->syncWithoutDetaching(collect($specs)->map(fn ($s) => $specialties[$s]->id));

            return $profile;
        })->values();

        // Portafolio (sin fotos: el frontend muestra portadas ilustradas)
        $portfolio = [
            0 => [['Casa de 2 pisos en Bello Horizonte', 'Construcción completa desde cimentación hasta obra gris. 120 m².', '2025-11-10'],
                ['Ampliación de segundo piso', 'Muros, placa y escalera en concreto.', '2026-03-02'],
                ['Muro de contención', 'Muro en concreto reforzado de 18 m de largo.', '2026-06-15']],
            1 => [['Baño completo en porcelanato', 'Piso y paredes hasta el techo, ducha con nicho.', '2026-05-20'],
                ['Cocina en cerámica', 'Mesón y salpicadero, emboquillado epóxico.', '2026-02-11']],
            2 => [['Vivienda campestre en Timbío', 'Casa de un piso, cubierta en teja de barro.', '2025-08-30'],
                ['Placa de entrepiso', 'Placa aligerada de 80 m².', '2026-01-18']],
            3 => [['Red eléctrica casa nueva', 'Instalación completa con tablero de 12 circuitos.', '2026-04-05']],
            5 => [['Fachada edificio 3 pisos', 'Estuco y pintura exterior tipo koraza.', '2026-07-09'],
                ['Apartamento completo', 'Pintura interior de 70 m², colores neutros.', '2026-05-01']],
            7 => [['Estructura metálica para parqueadero', 'Cubierta de 60 m² en teja termoacústica.', '2026-03-22']],
        ];
        foreach ($portfolio as $i => $items) {
            foreach ($items as [$title, $desc, $date]) {
                $workers[$i]->portfolioItems()->firstOrCreate(['title' => $title], [
                    'description' => $desc,
                    'work_date' => $date,
                    'city_id' => $workers[$i]->user->city_id,
                ]);
            }
        }

        // ---------- Contratantes ----------
        $clientsData = [
            ['Constructora Andes', 'andes@demo.com', '3123456789', 'company', 'Constructora Andes S.A.S.', '900123456-1',
                'Constructora con 12 años en el Cauca. Proyectos de vivienda de interés social y casas campestres.', true],
            ['María Fernanda Rivera', 'maria@demo.com', '3132223344', 'person', null, null,
                'Estoy remodelando mi casa en Popayán.', false],
            ['Inversiones El Cauca', 'inversiones@demo.com', '3145556677', 'company', 'Inversiones El Cauca Ltda.', '901555444-2',
                'Remodelación de locales comerciales y oficinas.', true],
        ];

        $clients = collect($clientsData)->map(function ($c) use ($popayan) {
            [$name, $email, $phone, $type, $business, $nit, $desc, $verified] = $c;

            $user = User::firstOrCreate(['email' => $email], [
                'name' => $name,
                'phone' => $phone,
                'password' => 'password123',
                'role' => 'client',
                'city_id' => $popayan->id,
                'verified_at' => $verified ? now()->subDays(60) : null,
            ]);

            return ClientProfile::firstOrCreate(['user_id' => $user->id], [
                'type' => $type,
                'business_name' => $business,
                'nit' => $nit,
                'description' => $desc,
            ]);
        })->values();

        // ---------- Ofertas de trabajo ----------
        $jobsData = [
            [1, 'Enchape de baño completo', 'Enchape', 'Popayán', 'La Esmeralda', 2500000, 'total', 18, 10, 2,
                'Baño de 2 x 2,5 m. Retirar enchape viejo, nivelar piso y enchapar piso y paredes hasta el techo. Yo compro el material.'],
            [0, 'Muros y placa, casa de 2 pisos', 'Mampostería', 'Popayán', 'Lomas de Granada', 130000, 'daily', 25, 45, 4,
                'Proyecto de vivienda de 2 pisos. Necesitamos maestro y oficiales para levantar muros en bloque y fundir placa de entrepiso. Pago quincenal.'],
            [1, 'Pintura de casa por dentro', 'Pintura', 'Popayán', 'Pomona', 1800000, 'total', 12, 6, 1,
                'Casa de 90 m², 3 habitaciones. Resanar, estucar donde haga falta y pintar en vinilo tipo 1. Material lo pongo yo.'],
            [2, 'Instalación eléctrica de local comercial', 'Eléctrico', 'Popayán', 'Centro', 3200000, 'total', 20, 8, 1,
                'Local de 60 m². Red nueva, tablero trifásico, iluminación LED y tomas reguladas para equipos.'],
            [0, 'Cubierta metálica para bodega', 'Soldadura', 'Timbío', 'Vía Panamericana', 140000, 'daily', 30, 20, 3,
                'Estructura metálica y teja termoacústica para bodega de 200 m². Se requiere experiencia en alturas.'],
            [2, 'Cocina integral a la medida', 'Carpintería', 'Popayán', 'Campo Bello', 4500000, 'total', 15, 12, 1,
                'Cocina en L de 3,2 m con mesón en granito, muebles superiores e inferiores en madera RH.'],
            [1, 'Arreglo de fuga y cambio de tubería', 'Plomería', 'Popayán', 'Yanaconas', 600000, 'total', 5, 2, 1,
                'Fuga en la pared del baño. Revisar y cambiar tubería de agua fría y caliente.'],
            [0, 'Acabados de 6 apartamentos', 'Acabados', 'Popayán', 'Norte', 45000, 'm2', 40, 60, 5,
                'Proyecto de apartamentos. Pañete, estuco, enchape de pisos y baños. Pago por metro cuadrado terminado.'],
        ];

        $jobs = collect($jobsData)->map(function ($j) use ($clients, $specialties, $cities) {
            [$ci, $title, $spec, $city, $addr, $budget, $type, $startIn, $days, $workersNeeded, $desc] = $j;

            return JobPost::firstOrCreate(['title' => $title], [
                'client_profile_id' => $clients[$ci]->id,
                'specialty_id' => $specialties[$spec]->id,
                'city_id' => $cities[$city]->id,
                'address' => $addr,
                'budget' => $budget,
                'budget_type' => $type,
                'start_date' => now()->addDays($startIn)->toDateString(),
                'days' => $days,
                'workers_needed' => $workersNeeded,
                'description' => $desc,
                'status' => 'open',
            ]);
        })->values();

        // ---------- Postulaciones ----------
        $apply = fn ($job, $worker, $msg, $rate, $status = 'sent', $invite = false) => Application::firstOrCreate(
            ['job_post_id' => $jobs[$job]->id, 'worker_profile_id' => $workers[$worker]->id],
            ['message' => $msg, 'rate' => $rate, 'status' => $status, 'is_invitation' => $invite]
        );

        $apply(0, 1, 'Tengo experiencia en enchape de baños y cocinas. Puedo empezar en la fecha con mi ayudante.', 2300000);
        $apply(0, 4, 'Trabajo con porcelanato y cerámica. Incluyo emboquillado y limpieza final.', 2500000);
        $apply(1, 2, 'Tengo equipo de 3 oficiales disponibles para empezar.', 130000, 'seen');
        $apply(3, 3, 'Soy electricista certificado, le hago la red completa con garantía.', 3000000);
        $apply(4, 7, 'Tengo experiencia en cubiertas metálicas y curso de alturas vigente.', 140000);
        $apply(5, 6, null, null, 'sent', true);

        // ---------- Contratos terminados con reseñas (le dan vida a las calificaciones) ----------
        $history = [
            [2, 0, 5, 'Cumplió con los tiempos y dejó todo limpio. Lo volveríamos a contratar.', 5, 'Excelente constructora, pagan puntual.'],
            [2, 1, 4, 'Muy buen acabado en la cocina. Se demoró dos días más de lo pactado.', 5, 'Muy amable la señora, todo claro desde el inicio.'],
            [6, 3, 5, 'Trabajo impecable, muy ordenado con los cables y el tablero.', null, null],
            [7, 5, 5, 'La fachada quedó como nueva. Recomendado.', 4, 'Buen cliente.'],
            [3, 1, 5, 'Excelente trabajo en el baño, súper detallista.', null, null],
            [1, 2, 4, 'Buen maestro, sabe mucho de estructura.', 5, null],
            [4, 6, 5, 'Arregló la fuga rápido y cobró justo.', null, null],
            [5, 1, 5, 'Pintura perfecta, no dejó ni una mancha en el piso.', 5, 'Todo excelente.'],
        ];

        foreach ($history as $n => [$jobIdx, $workerIdx, $clientRating, $clientComment, $workerRating, $workerComment]) {
            $job = JobPost::firstOrCreate(['title' => 'Trabajo terminado #'.($n + 1)], [
                'client_profile_id' => $jobs[$jobIdx]->client_profile_id,
                'specialty_id' => $jobs[$jobIdx]->specialty_id,
                'city_id' => $jobs[$jobIdx]->city_id,
                'budget' => $jobs[$jobIdx]->budget,
                'budget_type' => $jobs[$jobIdx]->budget_type,
                'start_date' => now()->subDays(90 - $n * 8)->toDateString(),
                'days' => 10,
                'workers_needed' => 1,
                'description' => 'Trabajo finalizado (dato de demostración).',
                'status' => 'closed',
                'created_at' => now()->subDays(100 - $n * 10),
            ]);

            $app = Application::firstOrCreate(
                ['job_post_id' => $job->id, 'worker_profile_id' => $workers[$workerIdx]->id],
                ['status' => 'accepted', 'rate' => $job->budget]
            );

            $contract = Contract::firstOrCreate(['application_id' => $app->id], [
                'agreed_value' => $job->budget,
                'start_date' => $job->start_date,
                'end_date' => now()->subDays(80 - $n * 8)->toDateString(),
                'status' => 'finished',
                'created_at' => now()->subDays(95 - $n * 10),
            ]);

            $workerUser = $workers[$workerIdx]->user;
            $clientUser = $jobs[$jobIdx]->client->user;

            Review::firstOrCreate(['contract_id' => $contract->id, 'reviewer_id' => $clientUser->id], [
                'reviewed_id' => $workerUser->id, 'rating' => $clientRating, 'comment' => $clientComment,
            ]);

            if ($workerRating) {
                Review::firstOrCreate(['contract_id' => $contract->id, 'reviewer_id' => $workerUser->id], [
                    'reviewed_id' => $clientUser->id, 'rating' => $workerRating, 'comment' => $workerComment,
                ]);
            }
        }

        // Recalcular promedio y trabajos hechos de cada maestro
        $workers->each(function (WorkerProfile $w) {
            $w->update([
                'rating_avg' => round((float) Review::where('reviewed_id', $w->user_id)->avg('rating'), 2),
                'jobs_done' => Contract::where('status', 'finished')
                    ->whereHas('application', fn ($a) => $a->where('worker_profile_id', $w->id))->count(),
            ]);
        });
    }
}
