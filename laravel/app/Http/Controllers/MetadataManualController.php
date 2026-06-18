<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Metadata;
use App\Models\Package;

class MetadataManualController extends Controller
{
    public function storeManualMetadata(Request $request)
    {
        // ✅ Force JSON response for validation/auth errors
        if (!$request->expectsJson()) {
            return response()->json(['error' => 'Expected JSON request'], 400);
        }

        // ✅ Ensure user is authenticated
        if (!auth()->check()) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // ✅ Validate incoming form data
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'required|string',
            'owner' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'min_lon' => 'required|numeric|between:-180,180',
            'min_lat' => 'required|numeric|between:-90,90',
            'max_lon' => 'required|numeric|between:-180,180',
            'max_lat' => 'required|numeric|between:-90,90',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'thumbnail' => 'nullable|file|image|max:2048', // 2MB max
            'spatial_file' => 'nullable|file|max:10240', // 10MB max
            
        ]);

        // ✅ Handle thumbnail upload
        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        // ✅ Create metadata entry        
        $metadata = Metadata::create([
			'title' => $validated['title'],
			'descriptio' => $validated['description'],
			'category' => $validated['category'],
			'owner' => $validated['owner'],
			'province' => $validated['province'],

			// Bounding box
			'min_lon' => $validated['min_lon'],
			'min_lat' => $validated['min_lat'],
			'max_lon' => $validated['max_lon'],
			'max_lat' => $validated['max_lat'],

			// Center point (optional)
			'lon' => ($validated['min_lon'] + $validated['max_lon']) / 2,
			'lat' => ($validated['min_lat'] + $validated['max_lat']) / 2,

			'contact_em' => $validated['contact_email'],
			'contact_ph' => $validated['contact_phone'] ?? null,
			'website' => $validated['website'] ?? null,
			'thumbnail' => $thumbnailPath,
			'created_at' => now(),
		]);


        // ✅ Store uploaded spatial file (if any)
        if ($request->hasFile('spatial_file')) {
            $spatialFile = $request->file('spatial_file');

            Package::create([
                'user_email' => auth()->user()->email,
                'file_name' => $spatialFile->getClientOriginalName(),
                'file_path' => $spatialFile->store('metadata_uploads', 'public'),
                'file_type' => $spatialFile->getClientOriginalExtension(),
                'metadata_id' => $metadata->id
            ]);
        }

        return response()->json([
            'message' => 'Metadata saved successfully',
            'metadata' => $metadata
        ], 201);
    }
}

