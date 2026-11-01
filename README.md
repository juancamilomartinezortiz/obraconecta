# ObraConecta

Plataforma web que conecta a los maestros de obra del Cauca con constructoras, empresas y personas que van a construir o remodelar. Funciona como un LinkedIn especializado: el maestro muestra su experiencia y sus obras; el contratante publica trabajos, recibe postulaciones y contrata.

**Fundación Universitaria de Popayán — Programa de Ingeniería de Sistemas**

| Integrante | Rol en el proyecto |
| --- | --- |
| Juan Camilo Martínez Ortiz | Líder del proyecto, backend y base de datos |
| Daniel Villamarín | Interfaz, frontend y pruebas |

---

## Tabla de contenido

1. [Problema y solución](#1-problema-y-solución)
2. [Objetivos](#2-objetivos)
3. [Funcionalidades](#3-funcionalidades)
4. [Tecnologías](#4-tecnologías)
5. [Arquitectura](#5-arquitectura)
6. [Estructura del repositorio](#6-estructura-del-repositorio)
7. [Modelo de base de datos](#7-modelo-de-base-de-datos)
8. [Instalación y ejecución](#8-instalación-y-ejecución)
9. [Cuentas de prueba](#9-cuentas-de-prueba)
10. [API REST](#10-api-rest)
11. [Requerimientos](#11-requerimientos)
12. [Metodología y cronograma](#12-metodología-y-cronograma)
13. [Plan de pruebas y calidad](#13-plan-de-pruebas-y-calidad)

---

## 1. Problema y solución

**Problema.** Hoy los maestros de obra consiguen trabajo casi siempre por recomendación. No tienen cómo demostrar su experiencia, y quien contrata no tiene cómo verificar la calidad ni la confiabilidad del trabajador.

**Solución.** ObraConecta ofrece perfiles verificables con oficios, años de experiencia, fotos de obras reales y calificaciones de clientes anteriores. El contratante publica lo que necesita, compara a los postulados y, al aceptar a uno, le escribe por WhatsApp.

## 2. Objetivos

**General.** Reducir el tiempo que tarda un maestro de obra en conseguir trabajo y el que tarda un contratante en encontrar personal confiable, mediante perfiles verificados, portafolio de obras y calificaciones.

**Específicos.**

1. Permitir que los trabajadores creen un perfil con oficios, experiencia y fotos de sus obras.
2. Permitir que los contratantes publiquen ofertas de trabajo y reciban postulaciones.
3. Ofrecer búsqueda filtrada por oficio, ciudad, calificación y disponibilidad.
4. Generar confianza con verificación de identidad y reseñas después de cada trabajo.

## 3. Funcionalidades

### Maestro de obra
- Registro y perfil con oficios, experiencia, tarifa por día, zonas de trabajo y disponibilidad.
- Portafolio de obras con hasta 10 fotos por obra.
- Búsqueda de trabajos por oficio, ciudad y presupuesto.
- Postulación con mensaje y propuesta de pago; respuesta a invitaciones directas.
- Seguimiento del estado de cada postulación (enviada, vista, aceptada, no seleccionada).
- Envío de documentos para verificar identidad (cédula o certificados).

### Contratante (constructora, empresa o persona natural)
- Publicación de ofertas en dos pasos, con vista previa en vivo.
- Búsqueda de maestros por oficio, ciudad, calificación mínima, verificación y disponibilidad.
- Revisión de postulaciones, aceptación o descarte, e invitación directa a maestros.
- Pausar, cerrar, editar o eliminar ofertas.

### Ambos roles
- Contacto por WhatsApp solo después de aceptar una postulación (privacidad del celular).
- Contrataciones: marcar el trabajo como terminado o cancelado.
- Calificación mutua de 1 a 5 estrellas con comentario.
- Reporte de perfiles u ofertas inapropiadas.

### Administrador
- Estadísticas generales y gráfico de actividad de los últimos 6 meses.
- Gestión de usuarios (bloquear y desbloquear).
- Revisión de documentos de verificación y entrega de la insignia de verificado.
- Atención de reportes.
- Gestión de oficios y ciudades.

## 4. Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | Angular 21, TypeScript, SCSS, componentes standalone y signals |
| Backend | Laravel 13 (PHP 8.4), API REST |
| Autenticación | Laravel Sanctum (tokens Bearer) |
| Base de datos | MySQL 8 |
| Archivos | Storage de Laravel (disco público para fotos, privado para documentos) |
| Control de versiones | Git y GitHub |

## 5. Arquitectura

Arquitectura cliente-servidor desacoplada en tres capas:

```
[ Frontend Angular ]  --HTTP/JSON-->  [ API REST Laravel ]  --SQL-->  [ MySQL ]
   localhost:4200                        127.0.0.1:8000/api
```

- El **frontend** maneja la interfaz, las rutas protegidas por rol (guards) y envía el token en cada petición (interceptor).
- La **API** aplica las reglas de negocio, las validaciones y los permisos por rol (middleware `role`).
- La **base de datos** guarda la información; las fotos se guardan en disco y en la base solo su ruta.

## 6. Estructura del repositorio

```
obraconecta/
├── obraconecta-api/                 Backend Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/    Controladores de la API
│   │   ├── Http/Middleware/         EnsureRole (permisos por rol)
│   │   └── Models/                  13 modelos Eloquent
│   ├── database/
│   │   ├── migrations/              Tablas de la base de datos
│   │   └── seeders/                 Datos de demostración
│   └── routes/api.php               Rutas de la API
├── obraconecta-web/                 Frontend Angular
│   └── src/app/
│       ├── core/                    Servicios, modelos, guards, interceptor
│       ├── shared/                  Componentes reutilizables
│       ├── layout/                  Encabezado, navegación y pie de página
│       └── pages/                   Pantallas por módulo
└── README.md
```

## 7. Modelo de base de datos

| Tabla | Qué guarda |
| --- | --- |
| `users` | Cuenta de acceso de cualquier rol (maestro, contratante, administrador) |
| `worker_profiles` | Perfil profesional del maestro |
| `client_profiles` | Perfil del contratante (empresa o persona) |
| `cities` | Catálogo de ciudades |
| `specialties` | Catálogo de oficios |
| `worker_specialty` | Relación muchos a muchos entre maestros y oficios |
| `portfolio_items` | Obras del portafolio |
| `portfolio_photos` | Fotos de cada obra |
| `job_posts` | Ofertas de trabajo publicadas |
| `applications` | Postulaciones e invitaciones (una por maestro y oferta) |
| `contracts` | Contrataciones acordadas |
| `reviews` | Calificaciones después de un contrato terminado |
| `verifications` | Documentos enviados para verificar identidad |
| `reports` | Reportes de contenido inapropiado |

Flujo principal: `job_posts` → `applications` → `contracts` → `reviews`.

## 8. Instalación y ejecución

### Requisitos
- PHP 8.3 o superior y Composer
- MySQL 8
- Node.js 20 o superior y Angular CLI

### Backend

```bash
cd obraconecta-api
composer install
copy .env.example .env
php artisan key:generate
```

En el archivo `.env` configura la base de datos:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=obraconecta
DB_USERNAME=root
DB_PASSWORD=tu_contraseña
```

Crea la base de datos `obraconecta` en MySQL y luego ejecuta:

```bash
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

La API queda en `http://127.0.0.1:8000/api`.

### Frontend

```bash
cd obraconecta-web
npm install
ng serve
```

Abre `http://localhost:4200`. La dirección de la API se configura en `src/app/core/config.ts`.

## 9. Cuentas de prueba

El seeder crea 8 maestros, 3 contratantes, ofertas, postulaciones, contratos terminados y reseñas.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Maestro | carlos@demo.com | password123 |
| Constructora | andes@demo.com | password123 |
| Persona natural | maria@demo.com | password123 |
| Administrador | admin@obraconecta.com | admin12345 |

## 10. API REST

Todas las rutas usan el prefijo `/api`. Las protegidas requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/register` | Público | Crear cuenta |
| POST | `/auth/login` | Público | Iniciar sesión |
| GET | `/catalogs` | Público | Ciudades y oficios |
| GET | `/stats` | Público | Cifras de la página de inicio |
| GET | `/workers` | Público | Buscar maestros con filtros |
| GET | `/workers/{id}` | Público | Perfil del maestro, obras y reseñas |
| GET | `/jobs` | Público | Buscar ofertas abiertas |
| GET | `/jobs/{id}` | Público | Detalle de una oferta |
| GET | `/auth/me` | Sesión | Datos del usuario actual |
| PUT | `/me/profile` | Sesión | Editar perfil |
| POST | `/me/photo` | Sesión | Cambiar foto de perfil |
| GET/POST | `/me/verifications` | Sesión | Ver y enviar documentos |
| GET | `/me/contracts` | Maestro, contratante | Contrataciones propias |
| PATCH | `/contracts/{id}/finish` | Partes del contrato | Marcar como terminado |
| POST | `/contracts/{id}/reviews` | Partes del contrato | Calificar |
| PATCH | `/applications/{id}` | Según el caso | Aceptar o rechazar postulación o invitación |
| GET/POST/DELETE | `/me/portfolio` | Maestro | Gestionar obras |
| GET | `/me/applications` | Maestro | Mis postulaciones |
| POST | `/jobs/{id}/apply` | Maestro | Postularse |
| GET | `/me/jobs` | Contratante | Mis ofertas |
| POST/PUT/DELETE | `/jobs` | Contratante | Crear, editar y eliminar ofertas |
| GET | `/jobs/{id}/applications` | Contratante | Postulaciones de una oferta |
| POST | `/workers/{id}/invite` | Contratante | Invitar a un maestro |
| GET/PATCH | `/admin/...` | Administrador | Estadísticas, usuarios, verificaciones, reportes y catálogos |

## 11. Requerimientos

### Funcionales (resumen por módulo)

| Módulo | Estado |
| --- | --- |
| Autenticación y roles | Implementado |
| Perfil del maestro y portafolio | Implementado |
| Perfil del contratante | Implementado |
| Ofertas de trabajo | Implementado |
| Búsqueda con filtros | Implementado |
| Postulaciones e invitaciones | Implementado |
| Contacto, contrataciones y reseñas | Implementado |
| Verificación de identidad y reportes | Implementado |
| Panel de administración | Implementado |
| Chat interno, favoritos, código por SMS, recomendación con IA | Planeado (fase 2) |

### No funcionales

| Atributo | Requerimiento |
| --- | --- |
| Usabilidad | Diseño mobile-first; funciona en celulares de 360 px |
| Rendimiento | Búsquedas en menos de 3 segundos |
| Seguridad | Contraseñas cifradas con bcrypt, autenticación por token, permisos por rol |
| Privacidad | Ley 1581 de 2012; el celular solo se muestra tras aceptar una postulación |
| Compatibilidad | Chrome, Firefox, Safari y Edge recientes |
| Mantenibilidad | API REST organizada por controladores y código versionado en Git |

## 12. Metodología y cronograma

Metodología ágil basada en Scrum, iterativa e incremental: sprints de 2 semanas, backlog de historias de usuario priorizadas y revisión con el docente al cierre de cada sprint.

| Hito | Fecha tope | Estado |
| --- | --- | --- |
| 1. Inicio e identificación del problema e interesados | 28-08-2026 | Completado |
| 2. Acta de constitución y definición del proyecto | 28-08-2026 | Completado |
| 3. Planificación: alcance, requisitos, cronograma, recursos, riesgos, costos y comunicación | 10-09-2026 | Completado |
| 4. Diseño y desarrollo de la plataforma | 05-11-2026 | Completado |
| 5. Pruebas, documentación, entrega y presentación de resultados | 19-11-2026 | En curso |

## 13. Plan de pruebas y calidad

| Tipo | Qué se prueba | Herramienta |
| --- | --- | --- |
| Unitarias | Reglas de negocio (no postularse dos veces, calificar solo al terminar) | PHPUnit |
| Integración | Endpoints de la API con autenticación y roles | PHPUnit, Postman |
| Funcionales | Flujo completo: registro, publicar, postular, aceptar, terminar y calificar | Casos de prueba |
| Validación de datos | Campos obligatorios, formatos y tamaño de archivos | Datos válidos e inválidos |
| Seguridad | Acceso sin sesión, rol incorrecto, privacidad del celular | Postman |
| Rendimiento | Tiempo de respuesta de las búsquedas | JMeter, Lighthouse |
| Usabilidad | Tareas reales con maestros y contratantes | Cuestionario SUS |

**Metas de calidad (referencia ISO/IEC 25010):** 95 % de casos de prueba aprobados, 0 errores críticos abiertos al entregar, búsquedas en menos de 3 segundos y al menos 70 puntos en la escala SUS.

---

Proyecto académico — Fundación Universitaria de Popayán, 2026.