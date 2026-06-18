<?php

protected $middleware = [
    \App\Http\Middleware\Cors::class,
];

protected $middlewareGroups = [
    'web' => [
        // ...
        \App\Http\Middleware\SessionTimeout::class,
        \App\Http\Middleware\JsonExceptionHandler::class,
    ],
];
