<?php

return [

    /*
    | Permite que el frontend Angular (http://localhost:4200) consuma la API.
    | La autenticación es por token Bearer, así que no se usan cookies.
    */

    'paths' => ['api/*', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
