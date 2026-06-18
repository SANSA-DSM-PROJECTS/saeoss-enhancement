// src/routes/web.php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PortalController;

Route::get('/', [PortalController::class, 'index'])->name('home');
Route::get('/search', [PortalController::class, 'search'])->name('search');
Route::get('/metadata/{id}', [PortalController::class, 'show'])->name('show');
