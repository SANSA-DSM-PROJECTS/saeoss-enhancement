<?php

namespace App\Http\Controllers;

use App\Models\Organisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganisationController extends Controller
{
    public function index()
    {
        $organisations = Organisation::withCount('metadata')->get();
        return view('organisation', compact('organisations'));
    }

    /**
     * View organisation by identifier (for internal/API use)
     */
    public function viewOrganisation($identifier)
    {
        $organisation = Organisation::with('metadata')
            ->where('identifier', $identifier)
            ->first();
        
        if (!$organisation) {
            abort(404, "Organisation with identifier '{$identifier}' not found.");
        }
        
        $metadataRecords = $organisation->metadata()
            ->latest()
            ->get();
        
        return view('view-organisation', [
            'organisation' => $organisation,
            'metadataRecords' => $metadataRecords,
            'recordCount' => $metadataRecords->count()
        ]);
    }
    
    /**
     * View organisation by name (main user-facing route)
     * URL: /organisation/Department%20of%20Mineral%20Resources%20&%20Energy
     */
    public function viewOrganisationByName($organisationName)
    {
        $organisationName = urldecode($organisationName);
        
        // Try multiple search strategies
        $organisation = Organisation::where('organisation', $organisationName)
            ->orWhere('organisation', 'LIKE', $organisationName)
            ->orWhereRaw('LOWER(organisation) = LOWER(?)', [$organisationName])
            ->orWhere('alias', $organisationName)
            ->orWhereRaw('LOWER(alias) = LOWER(?)', [$organisationName])
            ->first();
        
        if (!$organisation) {
            \Log::error('Organisation not found:', [
                'searched_for' => $organisationName,
                'available_organisations' => Organisation::pluck('organisation', 'identifier')->toArray()
            ]);
            
            abort(404, "Organisation '{$organisationName}' not found.");
        }
        
        $metadataRecords = $organisation->metadata()
            ->latest()
            ->get();
        
        return view('view-organisation', [
            'organisation' => $organisation,
            'metadataRecords' => $metadataRecords,
            'recordCount' => $metadataRecords->count()
        ]);
    }

    /**
     * Get all organisations as JSON (for AJAX)
     */
    public function getOrganisations()
    {
        $organisations = Organisation::withCount('metadata')->get();
        
        return response()->json([
            'success' => true,
            'organisations' => $organisations
        ]);
    }
    
    /**
     * Get single organisation as JSON
     */
    public function show($identifier)
    {
        $organisation = Organisation::with('metadata')
            ->where('identifier', $identifier)
            ->firstOrFail();
        
        $organisation->metadata_count = $organisation->metadata->count();
        
        return response()->json([
            'success' => true,
            'organisation' => $organisation
        ]);
    }
    
    /**
     * Store a new organisation
     */
    public function store(Request $request)
    {
        try {
            \Log::info('Store organisation request:', $request->all());
            
            $validated = $request->validate([
                'organisation' => 'required|string|max:255|unique:organisation,organisation',
                'alias' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'director' => 'nullable|string|max:255',
                'type' => 'required|string|max:255',
                'contact_email' => 'nullable|email|max:255',
                'contact_phone' => 'nullable|string|max:50',
                'website' => 'nullable|url|max:255',
            ]);
            
            // Generate unique identifier
            $latest = Organisation::orderBy('identifier', 'desc')->first();
            if ($latest && $latest->identifier) {
                $lastNumber = intval(substr($latest->identifier, 3));
                $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $newNumber = '0001';
            }
            $identifier = 'ORG' . $newNumber;
            
            $organisation = Organisation::create([
                'identifier' => $identifier,
                'organisation' => $validated['organisation'],
                'alias' => $validated['alias'] ?? null,
                'description' => $validated['description'] ?? null,
                'director' => $validated['director'] ?? null,
                'type' => $validated['type'],
                'contact_email' => $validated['contact_email'] ?? null,
                'contact_phone' => $validated['contact_phone'] ?? null,
                'website' => $validated['website'] ?? null,
                'logo' => 'images/default-org-logo.jpg',
            ]);
            
            \Log::info('Organisation created:', $organisation->toArray());
            
            return response()->json([
                'success' => true,
                'message' => 'Organisation created successfully',
                'organisation' => $organisation
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Store organisation error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update an existing organisation
     */
    public function update(Request $request, $identifier)
    {
        try {
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            
            $validated = $request->validate([
                'organisation' => 'required|string|max:255|unique:organisation,organisation,' . $organisation->identifier . ',identifier',
                'alias' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'director' => 'nullable|string|max:255',
                'type' => 'required|string|max:255',
                'contact_email' => 'nullable|email|max:255',
                'contact_phone' => 'nullable|string|max:50',
                'website' => 'nullable|url|max:255',
            ]);
            
            $organisation->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Organisation updated successfully',
                'organisation' => $organisation
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Update organisation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete an organisation
     */
    public function destroy($identifier)
    {
        try {
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            $organisation->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Organisation deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Debug method to check organisation matching
     */
    public function debugOrganisationMatch($organisationName)
    {
        $metadataOwners = DB::table('metadatas')
            ->select('owner', DB::raw('COUNT(*) as count'))
            ->whereNotNull('owner')
            ->groupBy('owner')
            ->get();
        
        $exactMatch = DB::table('metadatas')
            ->where('owner', $organisationName)
            ->count();
        
        $trimMatch = DB::table('metadatas')
            ->where(DB::raw('TRIM(owner)'), $organisationName)
            ->count();
        
        // Also check organisation table
        $organisationMatch = Organisation::where('organisation', $organisationName)->first();
        
        return response()->json([
            'searching_for' => $organisationName,
            'exact_match_count' => $exactMatch,
            'trim_match_count' => $trimMatch,
            'organisation_table_match' => $organisationMatch ? $organisationMatch->toArray() : null,
            'available_owners' => $metadataOwners
        ]);
    }
}
