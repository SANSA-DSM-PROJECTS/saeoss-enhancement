<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeoServerController extends Controller
{
    public function connect(Request $request)
    {
        // Validate incoming fields
        $validated = $request->validate([
            'url' => 'required|url',
            'username' => 'required|string',
            'password' => 'required|string',
            'workspace' => 'required|string',
        ]);

        // Normalize the GeoServer base URL
        $baseUrl = rtrim($validated['url'], '/');

        // Build the full REST API URL to check workspace layers
        $endpoint = "{$baseUrl}/rest/workspaces/{$validated['workspace']}/layers.json";

        // Send HTTP GET request with Basic Auth
        $response = Http::timeout(10)
                        ->withBasicAuth($validated['username'], $validated['password'])
                        ->acceptJson()
                        ->get($endpoint);

        // Return success response if valid
        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'data' => $response->json()
            ]);
        }

        // Return error response if failed
        return response()->json([
            'success' => false,
            'message' => 'GeoServer connection failed. Check URL, credentials, or workspace.',
            'status' => $response->status(),
            'error' => $response->body()
        ], $response->status());
    }
    
    public function getCoverageStores() {
		try {
		    $workspace = 'workspace'; // Or get from request
		    $url = config('services.geoserver.url') 
		        . "/rest/workspaces/{$workspace}/coveragestores.json";
		        
		    $response = Http::withBasicAuth(
		        config('services.geoserver.username'),
		        config('services.geoserver.password')
		    )->get($url);
		    
		    return $response->json();
		    
		} catch (\Exception $e) {
		    return response()->json([
		        'error' => 'Failed to fetch coverage stores',
		        'message' => $e->getMessage()
		    ], 500);
		}
	}
}

