<?php

namespace App\Http\Controllers;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class OrganisationController extends Controller
{
    /**
     * Display list of all organisations
     */
    public function index()
    {
        $organisations = Organisation::withCount('metadata')->get();
        return view('organisation', compact('organisations'));
    }

    /**
     * View organisation by identifier (internal/API use)
     */
    public function viewOrganisation($identifier)
    {
        $organisation = Organisation::with('metadata')
            ->where('identifier', $identifier)
            ->firstOrFail();
        
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
     * Get organisation details for metadata
     */
    protected function getOrganisationDetails($metadata)
    {
        // Try to find organisation by the owner name
        if (!empty($metadata->owner)) {
            $organisation = Organisation::where('organisation', $metadata->owner)
                ->orWhere('alias', $metadata->owner)
                ->first();
            
            if ($organisation) {
                return $organisation;
            }
        }
        
        return null;
    }
    
    /**
     * View organisation by name (main user-facing route)
     */
    public function viewOrganisationByName($organisationName)
    {
        $organisationName = urldecode($organisationName);
        
        // Search by name or alias (case-insensitive)
        $organisation = Organisation::whereRaw('LOWER(organisation) = LOWER(?)', [$organisationName])
            ->orWhereRaw('LOWER(alias) = LOWER(?)', [$organisationName])
            ->first();
        
        if (!$organisation) {
            Log::error('Organisation not found:', [
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
     * Get members of an organisation
     */
    public function getMembers($identifier)
    {
        try {
            Log::info('Fetching members for organisation: ' . $identifier);
            
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            
            // Get users associated with this organisation
            $members = User::where('organisation', $organisation->organisation)
                ->select('id', 'name', 'email', 'role', 'is_admin')
                ->get()
                ->map(function($user) {
                    // Map is_admin to role for consistent display
                    if ($user->is_admin) {
                        $user->role = 'admin';
                    } elseif (empty($user->role)) {
                        $user->role = 'member';
                    }
                    return $user;
                });
            
            Log::info('Found ' . $members->count() . ' members for organisation: ' . $organisation->organisation);
            
            return response()->json([
                'success' => true,
                'members' => $members
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching members: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch members'
            ], 500);
        }
    }

    /**
     * Get users available to add as members
     */
    public function getAvailableUsers($identifier)
    {
        try {
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            
            // Get users not in this organisation
            $users = User::where(function($query) use ($organisation) {
                    $query->whereNull('organisation')
                        ->orWhere('organisation', '!=', $organisation->organisation);
                })
                ->select('id', 'name', 'email')
                ->get();
            
            return response()->json([
                'success' => true,
                'users' => $users
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching available users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available users'
            ], 500);
        }
    }

    /**
     * Add a member to the organisation
     */
    public function addMember(Request $request, $identifier)
    {
        try {
            Log::info('Adding member to organisation: ' . $identifier);
            
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            
            $validated = $request->validate([
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    function ($attribute, $value, $fail) use ($organisation) {
                        $user = User::where('email', $value)->first();
                        if (!$user) {
                            $fail('The email address does not exist in our system.');
                            return;
                        }
                        
                        if ($user->organisation === $organisation->organisation) {
                            $fail('This user is already a member of this organisation.');
                        }
                    }
                ],
                'role' => [
                    'required',
                    Rule::in(['admin', 'member', 'editor', 'publisher'])
                ]
            ]);
            
            $user = User::where('email', $validated['email'])->first();
            
            // Update user's organisation
            $user->organisation = $organisation->organisation;
            $user->is_admin = ($validated['role'] === 'admin');
            $user->role = $validated['role'];
            $user->save();
            
            Log::info('Member added successfully:', ['user_id' => $user->id, 'organisation' => $organisation->organisation]);
            
            return response()->json([
                'success' => true,
                'message' => 'Member added successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ]
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Error adding member: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add member'
            ], 500);
        }
    }

    /**
     * Remove a member from the organisation
     */
    public function removeMember($identifier, $userId)
    {
        try {
            Log::info('Removing member: ' . $userId . ' from organisation: ' . $identifier);
            
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            
            $user = User::where('id', $userId)
                ->where('organisation', $organisation->organisation)
                ->firstOrFail();
            
            // Remove user from organisation
            $user->organisation = null;
            $user->is_admin = false;
            $user->role = 'user';
            $user->save();
            
            Log::info('Member removed successfully:', ['user_id' => $userId]);
            
            return response()->json([
                'success' => true,
                'message' => 'Member removed successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error removing member: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove member'
            ], 500);
        }
    }

    /**
     * Update member role
     */
    public function updateMemberRole(Request $request, $identifier, $userId)
    {
        try {
            Log::info('Updating member role: ' . $userId . ' in organisation: ' . $identifier);
            
            $organisation = Organisation::where('identifier', $identifier)->firstOrFail();
            
            $validated = $request->validate([
                'role' => 'required|in:admin,member,editor,publisher'
            ]);
            
            $user = User::where('id', $userId)
                ->where('organisation', $organisation->organisation)
                ->firstOrFail();
            
            // Update role
            $user->is_admin = ($validated['role'] === 'admin');
            $user->role = $validated['role'];
            $user->save();
            
            Log::info('Member role updated successfully:', ['user_id' => $userId, 'role' => $validated['role']]);
            
            return response()->json([
                'success' => true,
                'message' => 'Member role updated successfully',
                'user' => $user
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error updating member role: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update member role'
            ], 500);
        }
    }

    /**
     * Get all organisations as JSON
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
        try {
            $organisation = Organisation::with('metadata')
                ->where('identifier', $identifier)
                ->firstOrFail();
            
            $metadataRecords = $organisation->metadata()->latest()->get();
            
            return response()->json([
                'success' => true,
                'organisation' => [
                    'id' => $organisation->id,
                    'identifier' => $organisation->identifier,
                    'organisation' => $organisation->organisation,
                    'alias' => $organisation->alias,
                    'description' => $organisation->description,
                    'director' => $organisation->director,
                    'type' => $organisation->type,
                    'contact_email' => $organisation->contact_email,
                    'contact_phone' => $organisation->contact_phone,
                    'website' => $organisation->website,
                    'logo' => $organisation->logo,
                    'created_at' => $organisation->created_at,
                    'updated_at' => $organisation->updated_at,
                    'metadata' => $metadataRecords
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching organisation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch organisation'
            ], 500);
        }
    }
    
    /**
     * Store a new organisation
     */
    public function store(Request $request)
    {
        try {
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
            $lastNumber = $latest ? intval(substr($latest->identifier, 3)) : 0;
            $identifier = 'ORG' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            
            $organisation = Organisation::create(array_merge(
                $validated,
                [
                    'identifier' => $identifier,
                    'logo' => 'images/default-org-logo.jpg',
                ]
            ));
            
            Log::info('Organisation created:', $organisation->toArray());
            
            return response()->json([
                'success' => true,
                'message' => 'Organisation created successfully',
                'organisation' => $organisation
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Store organisation error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create organisation'
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
            Log::error('Update organisation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update organisation'
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
            Log::error('Delete organisation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete organisation'
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
        
        return response()->json([
            'searching_for' => $organisationName,
            'organisation_table_match' => Organisation::where('organisation', $organisationName)->first(),
            'metadata_owners' => $metadataOwners
        ]);
    }
}
