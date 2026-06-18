<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{{ $organisation->organisation ?? 'Organisation' }} | Metadata Hub</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    <link href="{{ asset('css/organisation-dashboard.css') }}" rel="stylesheet">
</head>
<body>
<x-app-layout>
    <div class="dashboard">
        <div class="top-bar">
            <a href="{{ route('organisation') }}" class="back-link">
                <i class="fas fa-arrow-left"></i> Back to Organisations
            </a>
        </div>

        <div class="content-grid">
            <aside class="sidebar">
                <!-- Logo Banner Card -->
                <div class="logo-card">
                    <div class="logo-banner">
                        @if($organisation->logo && file_exists(public_path($organisation->logo)))
                            <img src="{{ asset($organisation->logo) }}" 
                                 alt="{{ $organisation->organisation }}"
                                 onerror="this.src='https://via.placeholder.com/400x300?text=No+Logo'; this.onerror=null;">
                        @else
                            <div class="logo-placeholder">
                                <i class="fas fa-building"></i>
                                <span>{{ $organisation->organisation ?? 'Organisation' }}</span>
                            </div>
                        @endif
                    </div>
                    <div class="logo-card-content">
                        <h3 class="text-white">{{ $organisation->organisation ?? '' }}</h3>
                        <h1 class="text-white">{{ $organisation->alias ?? 'No Alias Provided' }}</h1>
                    </div>
                </div>

                <div class="vision-card">
                    <div class="vision-text">
                        <h2>{{ $organisation->organisation ?? '' }}</h2> 
                        {{ $organisation->description ?? 'No description provided' }} 
                    </div>
                    <a href="#" class="read-more" id="readMoreBtn">Read more <i class="fas fa-arrow-right"></i></a>
                    <div class="mt-2">
                        <span class="metadata-count" id="recordCountDisplay">
                            {{ $recordCount ?? 0 }} Metadata Record{{ ($recordCount ?? 0) !== 1 ? 's' : '' }}
                        </span>
                    </div>
                </div>
            </aside>

            <main class="main-content">
                <div class="nav-header">
                    <div class="nav-tabs">
                        <button class="nav-tab active" data-tab="metadata">Metadata Records</button>
                        <button class="nav-tab" data-tab="details">Organisation Details</button>
                        <button class="nav-tab" data-tab="analytics">Analytics</button>
                    </div>
                    <button class="nav-tab" data-tab="manage" id="manageTabBtn" style="margin-left: auto;">Manage</button>
                </div>

                <!-- Metadata Records Tab -->
                <div id="metadata-tab" class="tab-content">
                    <div class="action-bar">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="searchInput" placeholder="Search metadata records..." autocomplete="off">
                        </div>
                        <div class="action-buttons">
                            <button class="btn-icon" id="filterBtn">
                                <i class="fas fa-filter"></i> Filters
                            </button>
                            <button class="btn-primary-small" id="addRecordBtn">
                                <i class="fas fa-plus-circle"></i> Add metadata
                            </button>
                        </div>
                    </div>

                    <div id="recordsContainer" class="metadata-grid"></div>

                    <div class="pagination-container">
                        <div class="pagination" id="pagination"></div>
                    </div>
                    <div class="page-info" id="pageInfo"></div>
                </div>

                <div id="details-tab" class="tab-content" style="display: none;">
                    <div class="vision-card" style="margin-bottom: 0;">
                        <h3 style="margin-bottom: 1rem; color: #0b2b3b;">{{ $organisation->organisation ?? 'N/A' }} Information</h3>
                        <div class="vision-text">
                            <div class="mb-3">{{ $organisation->description ?? 'No description provided' }}</div>
                            <hr>
                            
                            @if($organisation->director ?? false)
                                <div class="mt-3"><strong>Director:</strong> {{ $organisation->director }}</div>
                            @endif
                            @if($organisation->contact_email ?? false)
                                <p><strong>Contact Email:</strong> {{ $organisation->contact_email }}</p>
                            @endif
                            @if($organisation->contact_phone ?? false)
                                <p><strong>Contact Phone:</strong> {{ $organisation->contact_phone }}</p>
                            @endif
                            @if($organisation->website ?? false)
                                <p><strong>Website:</strong> <a href="{{ $organisation->website }}" target="_blank" style="color: #0a2642;">{{ $organisation->website }}</a></p>
                            @endif
                        </div>
                    </div>
                </div>

                <div id="analytics-tab" class="tab-content" style="display: none;">
                    <div class="vision-card" style="margin-bottom: 0;">
                        <h3 style="margin-bottom: 1rem; color: #0b2b3b;">Usage Analytics</h3>
                        <div class="vision-text">
                            <p><strong>Total Metadata Records:</strong> {{ $recordCount ?? 0 }}</p>
                            <p><strong>Last Updated:</strong> {{ $organisation->updated_at ? $organisation->updated_at->format('Y-m-d') : 'N/A' }}</p>
                            <p><strong>Created:</strong> {{ $organisation->created_at ? $organisation->created_at->format('Y-m-d') : 'N/A' }}</p>
                        </div>
                    </div>
                </div>

                <div id="manage-tab" class="tab-content" style="display: none;">
                    <div class="sub-tabs">
                        <button class="sub-tab active" data-subtab="edit">Edit Organisation</button>
                        <button class="sub-tab" data-subtab="metadata">Manage Metadata</button>
                        <button class="sub-tab" data-subtab="members">Members</button>
                    </div>

                    <div id="edit-subtab" class="subtab-content">
                        <div class="edit-form">
                            <h3 style="margin-bottom: 1.5rem; color: #0a2642;">Edit Organisation</h3>
                            <form id="editOrganisationForm">
                                <div class="form-group">
                                    <label>Organisation Name</label>
                                    <input type="text" id="orgName" value="{{ $organisation->organisation ?? '' }}" placeholder="Enter organisation name">
                                </div>
                                <div class="form-group">
                                    <label>Description</label>
                                    <textarea id="orgDescription" placeholder="Enter organisation description">{{ $organisation->description ?? '' }}</textarea>
                                </div>
                                <div class="form-group">
                                    <label>Current Logo</label>
                                    <div class="logo-preview">
                                        @if(isset($organisation->logo_url) && $organisation->logo_url)
                                            <img src="{{ asset($organisation->logo_url) }}" alt="Current Logo">
                                        @else
                                            <div style="background: #f0f5f9; padding: 2rem; text-align: center; border-radius: 12px;">
                                                <i class="fas fa-image" style="font-size: 2rem; color: #8ba0ae;"></i>
                                                <p style="margin-top: 0.5rem; font-size: 0.8rem;">No logo uploaded</p>
                                            </div>
                                        @endif
                                    </div>
                                    <button type="button" class="delete-logo-btn" id="deleteLogoBtn">
                                        <i class="fas fa-trash"></i> Delete Logo
                                    </button>
                                </div>
                                <div class="form-group">
                                    <label>Upload New Logo</label>
                                    <input type="file" id="newLogo" accept="image/*">
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn-save">Save Changes</button>
                                    <button type="button" class="btn-cancel" id="cancelEditBtn">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div id="metadata-subtab" class="subtab-content" style="display: none;">
                        <div class="metadata-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th class="checkbox-cell"><input type="checkbox" id="selectAll"></th>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="metadataTableBody">
                                    <!-- Dynamically populated -->
                                </tbody>
                            </table>
                            <div class="batch-actions">
                                <button class="btn-sm btn-public" id="batchPublic">Make Public</button>
                                <button class="btn-sm btn-private" id="batchPrivate">Make Private</button>
                                <button class="btn-sm btn-delete" id="batchDelete">Delete Selected</button>
                            </div>
                        </div>
                    </div>

                    <div id="members-subtab" class="subtab-content" style="display: none;">
                        <div class="members-list">
                            <h3 style="margin-bottom: 1rem; color: #0a2642;">Organisation Members</h3>
                            <div id="membersList">
                                <div class="member-item">
                                    <div class="member-info">
                                        <div class="member-avatar">JD</div>
                                        <div>
                                            <div class="member-name">John Doe</div>
                                            <div class="member-email">john.doe@example.com</div>
                                        </div>
                                    </div>
                                    <span class="member-role role-admin">Admin</span>
                                </div>
                                <div class="member-item">
                                    <div class="member-info">
                                        <div class="member-avatar">JS</div>
                                        <div>
                                            <div class="member-name">Jane Smith</div>
                                            <div class="member-email">jane.smith@example.com</div>
                                        </div>
                                    </div>
                                    <span class="member-role role-member">Member</span>
                                </div>
                                <div class="member-item">
                                    <div class="member-info">
                                        <div class="member-avatar">MB</div>
                                        <div>
                                            <div class="member-name">Mike Brown</div>
                                            <div class="member-email">mike.brown@example.com</div>
                                        </div>
                                    </div>
                                    <span class="member-role role-member">Member</span>
                                </div>
                            </div>
                            <div class="add-member">
                                <button class="btn-primary-small" id="addMemberBtn">
                                    <i class="fas fa-user-plus"></i> Add Member
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</x-app-layout>

<script src="{{ asset('js/view-organisation.js') }}"></script>
<script>
    window.organisationData = {
        allRecords: @json($metadataRecords ?? []),
        organisation: @json($organisation)
    };
    
    console.log('Data loaded:', window.organisationData);
    console.log('Records count:', window.organisationData.allRecords?.length);
</script>
</body>
</html>
