<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DataUpload;
use App\Http\Controllers\GeoServerController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\MetadataManualController;
use App\Http\Controllers\MetadataHarvestController;
use App\Http\Controllers\MetadataUploadController;
use App\Http\Controllers\MetadataController;
use App\Http\Controllers\OrganisationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetLinkController;
use App\Http\Controllers\NewPasswordController;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Organisation;
use App\Models\Metadata;

/*
|--------------------------------------------------------------------------
| Metadata Routes 
|--------------------------------------------------------------------------
*/
Route::get('/metadata/all', [MetadataController::class, 'getAllMetadata'])->name('metadata.all');
Route::get('/metadata/organisations', [MetadataController::class, 'getOrganisations']);
Route::post('/metadata/organisation-search', [MetadataController::class, 'searchByOrganisation']);
Route::get('/metadata/debug-organisation/{owner}', [MetadataController::class, 'debugOrganisation']);
Route::post('/metadata/text-search', [MetadataController::class, 'searchText'])->name('metadata.text-search');
Route::post('/metadata/date-search', [MetadataController::class, 'searchDateRange'])->name('metadata.date-search');
Route::post('/metadata/polygon-search', [MetadataController::class, 'searchPolygon'])->name('metadata.polygon-search');
Route::post('/update-metadata', [MetadataController::class, 'update']);
Route::post('/upload-manual-metadata', [MetadataManualController::class, 'storeManualMetadata']);
Route::post('/upload-metadata', [MetadataUploadController::class, 'store']);
Route::middleware(['auth'])->get('/harvest-metadata', [MetadataHarvestController::class, 'harvestCSW']);

Route::get('/metadata/{identifier}', [MetadataController::class, 'show'])->name('metadata.show');
Route::get('/metadata/{identifier}/edit', [MetadataController::class, 'edit'])->name('metadata.edit');
Route::put('/metadata/{identifier}', [MetadataController::class, 'update'])->name('metadata.update');
Route::delete('/metadata/{identifier}', [MetadataController::class, 'destroy'])->name('metadata.destroy')->middleware('auth');
Route::get('/metadata/{identifier}/download', [MetadataController::class, 'download'])->name('metadata.download');

Route::get('/api/metadata/{identifier}', [MetadataController::class, 'getMetadataByIdentifier']);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/
Route::get('/api/metadata/extents', function () {
    $metadata = DB::table('metadatas')
        ->select('id', 'identifier', 'title', 'description', 'category', 'owner', 
                 'province', 'created_at', 'contact_em', 'contact_ph', 'website',
                 'min_lon', 'min_lat', 'max_lon', 'max_lat', 'geom')
        ->whereNotNull('geom')
        ->get();
    
    return response()->json($metadata);
})->middleware('web');

Route::get('/metadata/count', function () {
    $count = DB::table('metadatas')->count();
    return response()->json(['count' => $count]);
});

Route::get('/metadata', [MetadataController::class, 'index'])->name('metadata');

/*
|--------------------------------------------------------------------------
| Organisation Routes
|--------------------------------------------------------------------------
*/
// View by identifier (keep this for API/internal use)
Route::get('/organisation/id/{identifier}', [OrganisationController::class, 'viewOrganisation'])
    ->name('organisation.view.byId');

// View by name - THIS IS THE MAIN USER-FACING ROUTE
Route::get('/organisation/{organisationName}', [OrganisationController::class, 'viewOrganisationByName'])
    ->name('organisation.view');

// API routes
Route::get('/api/organisations', [OrganisationController::class, 'getOrganisations'])->name('api.organisations');
Route::get('/api/organisations/{identifier}', [OrganisationController::class, 'show'])->name('api.organisations.show');

// Other routes
Route::get('/organisation', [OrganisationController::class, 'index'])->name('organisation');
Route::post('/organisations/store', [OrganisationController::class, 'store'])->name('organisations.store');
Route::get('/debug/organisation-match/{name}', [OrganisationController::class, 'debugOrganisationMatch']);

/*
|--------------------------------------------------------------------------
| User Management Routes
|--------------------------------------------------------------------------
*/
Route::get('/users/list', [UserController::class, 'index']);
Route::post('/users/update-role/{user}', [UserController::class, 'updateRole']);

/*
|--------------------------------------------------------------------------
| View Routes
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return view('welcome');
})->name('welcome');

Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard')->middleware('auth');

Route::get('/mapping', function () {
    return view('mapping');
})->name('mapping');

Route::get('/add-records', function () {
    return view('add-records');
})->name('add-records');
/*
|--------------------------------------------------------------------------
| Data Upload Routes
|--------------------------------------------------------------------------
*/
Route::post('/upload-data', [DataUpload::class, 'uploaddata'])->name('upload.data');

/*
|--------------------------------------------------------------------------
| GeoServer Proxy Routes
|--------------------------------------------------------------------------
*/
Route::get('/geoserver-proxy/{path}', function($path) {
    $geoserverBase = config('geoserver.url') . '/rest/';
    $fullUrl = $geoserverBase . $path;
    
    if (!str_ends_with($fullUrl, '.json')) {
        $fullUrl .= '.json';
    }

    $username = config('services.geoserver.username');
    $password = config('services.geoserver.password');

    Log::info('GeoServer creds:', [
        'user' => config('geoserver.username'),
        'pass' => config('geoserver.password')
    ]);

    try {
        $response = Http::withBasicAuth($username, $password)->get($fullUrl);

        return response()->json(
            $response->json(),
            $response->status()
        )->header('Access-Control-Allow-Origin', '*');
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'GeoServer proxy error',
            'message' => $e->getMessage()
        ], 500);
    }
})->where('path', '.*');

Route::get('/getlayers/{path}', function($path) {
    $geoserverBase = config('geoserver.url') . '/rest/';
    $fullUrl = $geoserverBase . $path;

    if (!str_ends_with($fullUrl, '.json')) {
        $fullUrl .= '.json';
    }

    $username = config('services.geoserver.username');
    $password = config('services.geoserver.password');

    try {
        $response = Http::withBasicAuth($username, $password)->get($fullUrl);

        return response()->json($response->json(), $response->status())
                         ->header('Access-Control-Allow-Origin', '*');
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'GeoServer proxy error',
            'message' => $e->getMessage()
        ], 500);
    }
})->where('path', '.*');

Route::match(['POST', 'OPTIONS'], '/connect-geoserver', [GeoServerController::class, 'connect'])
    ->name('connect-geoserver')
    ->middleware(['throttle:60,1', \App\Http\Middleware\Cors::class]);

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/check-session', function () {
    return auth()->check()
        ? response()->json(['active' => true])
        : response()->json(['active' => false], 401);
});

/*
|--------------------------------------------------------------------------
| Password Reset Routes
|--------------------------------------------------------------------------
*/
Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])
    ->middleware('guest')
    ->name('password.request');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');

Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])
    ->middleware('guest')
    ->name('password.reset');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('guest')
    ->name('password.update');

/*
|--------------------------------------------------------------------------
| Test Routes
|--------------------------------------------------------------------------
*/
Route::get('/test-route', function () {
    return 'Hello from Laravel';
});

/*
|--------------------------------------------------------------------------
| Include Auth Routes
|--------------------------------------------------------------------------
*/
require __DIR__.'/auth.php';
