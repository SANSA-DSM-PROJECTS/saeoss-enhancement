<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth; 
use App\Models\Metadata;

class MetadataController extends Controller
{
    const PER_PAGE = 12;
    
    public function show($identifier)
    {
        try {
            $metadata = Metadata::where('identifier', $identifier)->first();
            
            if (!$metadata) {
                return view('view-metadata', ['metadata' => null]);
            }
            
            $formattedMetadata = [
                'identifier' => $metadata->identifier,
                'title' => $metadata->title,
                'description' => $metadata->descriptio,
                'status' => $metadata->status ?? 'Active',
                'created_at' => $metadata->created_at ? $metadata->created_at->format('Y-m-d H:i:s') : 'N/A',
                'updated_at' => $metadata->updated_at ? $metadata->updated_at->format('Y-m-d H:i:s') : 'N/A',
                'license' => $metadata->license ?? 'CC BY 4.0',
                'organization' => $metadata->owner ?? 'Unknown Organization',
                'contact_email' => $metadata->contact_em ?? null,
                'contact_phone' => $metadata->contact_ph ?? null,
                'spatial_resolution' => $metadata->spatial_resolution ?? '10 m',
                'temporal_extent' => \Carbon\Carbon::parse($metadata->created_at)->year,
                'file_format' => $metadata->file_format ?? 'GeoTIFF',
                'keywords' => $metadata->keywords ? explode(',', $metadata->keywords) : [],
                'extent' => [
                    'north' => $metadata->max_lat,
                    'south' => $metadata->min_lat,
                    'east'  => $metadata->max_lon,
                    'west'  => $metadata->min_lon,
                ]
            ];
            
            return view('view-metadata', ['metadata' => $formattedMetadata]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fetch metadata: ' . $e->getMessage());
            return view('view-metadata', ['metadata' => null]);
        }
    }
    
    public function getOrganisations()
    {
        try {
            $organisations = DB::table('metadatas')
                ->select(DB::raw('TRIM(owner) as owner'), DB::raw('COUNT(*) as record_count'))
                ->whereNotNull('owner')
                ->where('owner', '!=', '')
                ->where(DB::raw('TRIM(owner)'), '!=', '')
                ->groupBy(DB::raw('TRIM(owner)'))
                ->orderBy(DB::raw('TRIM(owner)'))
                ->get();
            
            return response()->json($organisations);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fetch organisations: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch organisations',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function searchByOrganisation(Request $request)
    {
        try {
            $request->validate([
                '_token' => 'required|string',
                'owner' => 'required|string',
                'page' => 'sometimes|integer|min:1'
            ]);
            
            $owner = trim($request->input('owner'));
            $page = $request->input('page', 1);
            
            $results = Metadata::where(function($query) use ($owner) {
                    $query->where(DB::raw('TRIM(owner)'), '=', $owner)
                          ->orWhere(DB::raw('TRIM(owner)'), 'ILIKE', $owner)
                          ->orWhere(DB::raw("REPLACE(REPLACE(owner, ' ', ''), '\t', '')"), '=', str_replace(' ', '', $owner));
                })
                ->orderBy('created_at', 'desc')
                ->paginate(
                    self::PER_PAGE,
                    ['*'],
                    'page',
                    $page
                );
            
            \Log::info('Searching for organisation: ' . $owner);
            \Log::info('Total records found: ' . $results->total());
            
            return response()->json([
                'data' => $results->items(),
                'total' => $results->total(),
                'per_page' => self::PER_PAGE,
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'search_term' => $owner,
                'current_user_email' => Auth::check() ? Auth::user()->email : null,
                'is_admin' => Auth::check() ? Auth::user()->is_admin : false
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Organisation search failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Search failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    public function searchDateRange(Request $request)
    {
        try {
            $request->validate([
                '_token' => 'required|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'page' => 'sometimes|integer|min:1'
            ]);

            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $page = $request->input('page', 1);

            $query = Metadata::query();

            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            } elseif ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            } elseif ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            $results = $query->orderBy('created_at', 'desc')
                ->paginate(
                    self::PER_PAGE,
                    ['*'],
                    'page',
                    $page
                );

            return response()->json([
                'data' => $results->items(),
                'total' => $results->total(),
                'per_page' => self::PER_PAGE,
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ],
                'current_user_email' => Auth::check() ? Auth::user()->email : null,
                'is_admin' => Auth::check() ? Auth::user()->is_admin : false
            ]);

        } catch (\Exception $e) {
            \Log::error('Date range search failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Date range search failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function debugOrganisation($owner)
    {
        try {
            $owner = trim($owner);
            
            $allOwners = DB::table('metadatas')
                ->select('owner', DB::raw('COUNT(*) as count'))
                ->whereNotNull('owner')
                ->groupBy('owner')
                ->get();
            
            $exactMatch = Metadata::where(DB::raw('TRIM(owner)'), '=', $owner)->count();
            
            $likeMatch = Metadata::where('owner', 'LIKE', '%' . $owner . '%')->count();
            
            return response()->json([
                'search_term' => $owner,
                'exact_match_count' => $exactMatch,
                'like_match_count' => $likeMatch,
                'all_owners' => $allOwners
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function getOrganisationCount($owner)
    {
        try {
            $count = Metadata::where('owner', '=', $owner)->count();
            
            return response()->json([
                'owner' => $owner,
                'count' => $count
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function index()
    {
        return view('metadata'); 
    }
    
    public function getMetadataByIdentifier($identifier)
    {
        try {
            $metadata = Metadata::where('identifier', $identifier)->first();
            
            if (!$metadata) {
                return response()->json(['error' => 'Metadata not found'], 404);
            }
            
            $formattedMetadata = [
                'identifier' => $metadata->identifier,
                'title' => $metadata->title,
                'description' => $metadata->descriptio,
                'descriptio' => $metadata->descriptio,
                'status' => $metadata->status ?? 'Active',
                'created_at' => $metadata->created_at ? $metadata->created_at->format('Y-m-d H:i:s') : null,
                'updated_at' => $metadata->updated_at ? $metadata->updated_at->format('Y-m-d H:i:s') : null,
                'license' => $metadata->license ?? 'CC BY 4.0',
                'organization' => $metadata->owner ?? 'Unknown Organization',
                'owner' => $metadata->owner,
                'contact_email' => $metadata->contact_em ?? null,
                'contact_em' => $metadata->contact_em,
                'contact_phone' => $metadata->contact_ph ?? null,
                'contact_ph' => $metadata->contact_ph,
                'spatial_resolution' => $metadata->spatial_resolution ?? '10 m',
                'temporal_extent' => \Carbon\Carbon::parse($metadata->created_at)->year,
                'file_format' => $metadata->file_format ?? 'GeoTIFF',
                'keywords' => $metadata->keywords ? explode(',', $metadata->keywords) : [],
                'extent' => [
                    'north' => $metadata->max_lat,
                    'south' => $metadata->min_lat,
                    'east'  => $metadata->max_lon,
                    'west'  => $metadata->min_lon,
                ],
                'north' => $metadata->north,
                'south' => $metadata->south,
                'east' => $metadata->east,
                'west' => $metadata->west,
            ];
            
            return response()->json($formattedMetadata);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fetch metadata by identifier: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch metadata'], 500);
        }
    }
    
    public function getAllMetadata(Request $request)
    {
        try {
            \Log::info('getAllMetadata called', [
                'url' => $request->fullUrl(),
                'page' => $request->input('page', 1)
            ]);
            
            $page = $request->input('page', 1);
            
            $results = Metadata::orderBy('created_at', 'desc')
                ->paginate(self::PER_PAGE, ['*'], 'page', $page);
            
            \Log::info('getAllMetadata results', [
                'total' => $results->total(),
                'count' => $results->count()
            ]);
            
            return response()->json([
                'data' => $results->items(),
                'total' => $results->total(),
                'per_page' => self::PER_PAGE,
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'current_user_email' => Auth::check() ? Auth::user()->email : null,
                'is_admin' => Auth::check() ? Auth::user()->is_admin : false
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fetch metadata: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'error' => 'Failed to fetch metadata',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTrace() : null
            ], 500);
        }
    }
    
    public function searchText(Request $request)
    {
        try {
            $request->validate([
                '_token' => 'required|string',
                'query' => 'required|string|min:2',
                'page' => 'sometimes|integer|min:1'
            ]);

            $query = $request->input('query');
            $page = $request->input('page', 1);

            $results = Metadata::where(function ($q) use ($query) {
                    $q->where('title', 'ILIKE', "%{$query}%")
                      ->orWhere('descriptio', 'ILIKE', "%{$query}%");
                })
                ->orderBy('created_at', 'desc')
                ->paginate(
                    self::PER_PAGE,
                    ['*'],
                    'page',
                    $page
                );

            return response()->json([
                'data' => $results->items(),
                'total' => $results->total(),
                'per_page' => self::PER_PAGE,
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),		        
                'current_user_email' => Auth::check() ? Auth::user()->email : null,
                'is_admin' => Auth::check() ? Auth::user()->is_admin : false
            ]);

        } catch (\Exception $e) {
            \Log::error('Text search failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Search failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function searchPolygon(Request $request)
    {
        $validated = $request->validate([
            'geojson' => 'required|json',
            'page' => 'sometimes|integer|min:1'
        ]);

        $geojson = json_decode($validated['geojson'], true);
        $page = $request->input('page', 1);
        
        if (!isset($geojson['type']) || $geojson['type'] !== 'Feature') {
            return response()->json([
                'error' => 'Invalid GeoJSON: Must be a Feature type'
            ], 400);
        }

        try {
            $totalQuery = DB::table('metadatas')
                ->whereRaw("ST_Intersects(geom, ST_GeomFromGeoJSON(?))", [
                    json_encode($geojson['geometry'])
                ]);
            
            $total = $totalQuery->count();
            
            $results = DB::table('metadatas')
                ->whereRaw("ST_Intersects(geom, ST_GeomFromGeoJSON(?))", [
                    json_encode($geojson['geometry'])
                ])
                ->orderBy('created_at', 'desc')
                ->skip(($page - 1) * self::PER_PAGE)
                ->take(self::PER_PAGE)
                ->get();

            return response()->json([
                'data' => $results,
                'total' => $total,
                'per_page' => self::PER_PAGE,
                'current_page' => $page,
                'last_page' => ceil($total / self::PER_PAGE),
                'current_user_email' => Auth::check() ? Auth::user()->email : null,
                'is_admin' => Auth::check() ? Auth::user()->is_admin : false
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Spatial query failed',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    
    public function download($identifier)
    {
        try {
            $metadata = Metadata::where('identifier', $identifier)->first();
            
            if (!$metadata) {
                return response()->json(['error' => 'Metadata not found'], 404);
            }
            
            $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            $xml .= '<metadata xmlns="http://www.isotc211.org/2005/gmd">' . "\n";
            $xml .= "  <identifier>{$metadata->identifier}</identifier>\n";
            $xml .= "  <title>{$metadata->title}</title>\n";
            $xml .= "  <description>{$metadata->descriptio}</description>\n";
            $xml .= "  <owner>{$metadata->owner}</owner>\n";
            $xml .= "  <status>{$metadata->status}</status>\n";
            $xml .= "  <created_at>{$metadata->created_at}</created_at>\n";
            $xml .= "  <updated_at>{$metadata->updated_at}</updated_at>\n";
            $xml .= "  <contact_email>{$metadata->contact_em}</contact_email>\n";
            $xml .= "  <contact_phone>{$metadata->contact_ph}</contact_phone>\n";
            $xml .= "  <keywords>{$metadata->keywords}</keywords>\n";
            $xml .= "  <north>{$metadata->north}</north>\n";
            $xml .= "  <south>{$metadata->south}</south>\n";
            $xml .= "  <east>{$metadata->east}</east>\n";
            $xml .= "  <west>{$metadata->west}</west>\n";
            $xml .= "</metadata>";
            
            return response($xml, 200)
                ->header('Content-Type', 'application/xml')
                ->header('Content-Disposition', 'attachment; filename="metadata_' . $identifier . '.xml"');
                
        } catch (\Exception $e) {
            \Log::error('Download failed: ' . $e->getMessage());
            return response()->json(['error' => 'Download failed'], 500);
        }
    }
    
    public function destroy($identifier)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['error' => 'Authentication required'], 401);
            }

            if (!$user->is_admin) {
                return response()->json(['error' => 'Admin privileges required'], 403);
            }

            $metadata = Metadata::where('identifier', $identifier)->first();

            if (!$metadata) {
                return response()->json(['error' => 'Metadata not found'], 404);
            }

            $metadata->delete();

            return response()->json(['message' => 'Metadata deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Delete Error: ' . $e->getMessage());
            return response()->json(['error' => 'Server error while deleting metadata'], 500);
        }
    }
    
    public function update(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
        ]);

        $metadata = Metadata::where('identifier', $request->identifier)->first();

        if (!$metadata) {
            return response()->json(['message' => 'Metadata not found.'], 404);
        }

        $metadata->title = $request->title;
        $metadata->descriptio = $request->description;
        $metadata->contact_em = $request->email;
        $metadata->contact_ph = $request->phone;
        $metadata->save();

        return response()->json(['message' => 'Metadata updated successfully.']);
    }
}
