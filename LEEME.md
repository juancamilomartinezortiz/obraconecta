# ObraConecta

Plataforma web para que maestros de obra consigan trabajo y para que constructoras y personas los contraten.

- `obraconecta-api`: backend en Laravel 13 (API REST + Sanctum + MySQL)
- `obraconecta-web`: frontend en Angular 21

## Instalación (una sola vez)

1. Descomprime este zip dentro de `C:\Users\Lenovo LOQ\Proyectos\`. Cuando Windows pregunte, elige **Reemplazar los archivos**. Así los archivos del backend quedan encima del proyecto Laravel que ya creaste.
2. Revisa que MySQL esté encendido y que exista la base `obraconecta`.
3. Entra a la carpeta `obraconecta` y dale doble clic a **`1-instalar.bat`**.

Este script:

- instala Sanctum, que es el login por token;
- crea todas las tablas y carga los datos de prueba (`migrate:fresh --seed`);
- crea el enlace para las fotos (`storage:link`);
- instala las dependencias de Angular (`npm install`).

## Uso diario

Dale doble clic a **`2-iniciar.bat`**. Se abren dos ventanas, la API (puerto 8000) y la web (puerto 4200), y luego el navegador en http://localhost:4200.

No cierres esas dos ventanas mientras uses la app.

## Cuentas de prueba

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Maestro | carlos@demo.com | password123 |
| Constructora | andes@demo.com | password123 |
| Persona natural | maria@demo.com | password123 |
| Administrador | admin@obraconecta.com | admin12345 |

Hay 8 maestros, 3 contratantes, ofertas, postulaciones, contratos terminados y reseñas de ejemplo.

## Comandos manuales (por si no usas los .bat)

```bash
cd obraconecta-api
composer require laravel/sanctum
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve

cd obraconecta-web
npm install
npm start
```

Importante: **no** ejecutes `php artisan install:api`. La migración de tokens ya viene incluida y quedaría duplicada.

## Problemas comunes

| Síntoma | Solución |
| --- | --- |
| "No hay conexión con el servidor" en la web | La ventana de la API está cerrada. Ejecuta `php artisan serve` en `obraconecta-api`. |
| `Access denied for user 'root'` | Revisa `DB_PASSWORD` en `obraconecta-api/.env`. |
| `Unknown database 'obraconecta'` | Crea la base: `CREATE DATABASE obraconecta;` |
| `Table 'personal_access_tokens' already exists` | Borra en `database/migrations` el archivo de tokens que empieza por `2026_` y vuelve a correr `php artisan migrate:fresh --seed`. |
| Las fotos no cargan | Ejecuta `php artisan storage:link`. |
