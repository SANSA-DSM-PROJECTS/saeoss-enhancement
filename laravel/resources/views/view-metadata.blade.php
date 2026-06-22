<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAEOSS - {{ $metadata['title'] ?? 'Metadata' }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    <link href="{{ asset('css/view-metadata.css') }}" rel="stylesheet">
    
    <!-- OpenLayers CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v7.4.0/ol.css">
    <!-- OpenLayers JS -->
    <script src="https://cdn.jsdelivr.net/npm/ol@v7.4.0/dist/ol.js"></script>
</head>

<body>
<x-app-layout>

    <div class="container">
        <div class="topbar">
            <div class="text-dark"> 
                <i class="bi bi-tag"></i> <strong>Identifier</strong> {{ $metadata['identifier'] ?? 'N/A' }} | 
                <i class="bi bi-calendar"></i> <strong>Created</strong> {{ $metadata['created_at'] ?? 'N/A' }}
            </div>
            <div class="actions">
                <button class="btn-back" onclick="window.location.href='/metadata'">
                    <i class="bi bi-arrow-left"></i> Metadata
                </button>
                <button id="editButton" class="btn-edit action-btn-hidden" onclick="editMetadata()">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button id="deleteButton" class="btn-delete action-btn-hidden" onclick="deleteMetadata()">
                    <i class="bi bi-trash"></i> Delete
                </button>
                <button class="btn-more" onclick="showMoreOptions()">
                    <i class="bi bi-three-dots"></i> More
                </button>
            </div>
        </div>
    
        <div id="successMessage" class="success-message"></div>
        
        @if(isset($metadata) && !empty($metadata))
            <div class="card">
                <div class="title">{{ $metadata['title'] ?? 'Untitled' }}</div>
                <span class="badge">
                    <i class="bi bi-info-circle"></i> {{ $metadata['status'] ?? 'Unknown' }}
                </span>
                <p style="margin-top: 16px; line-height: 1.6;">
                    {{ $metadata['description'] ?? 'No description available.' }}
                </p>
            </div>

            <br>

            <div class="grid">
                <div>
                    <div class="card">
                        <h3>
                            <i class="bi bi-map"></i> Map Extent
                        </h3>
                        <div class="map-container">
                            <div id="map"></div>
                            <div class="map-controls">
                                <button onclick="zoomToFeature()">
                                    <i class="bi bi-zoom-in"></i> Zoom to Extent
                                </button>
                                <button onclick="resetView()">
                                    <i class="bi bi-arrow-repeat"></i> Reset View
                                </button>
                            </div>
                        </div>
                        <div id="mapStatus" class="map-status"></div>
                        <hr>
                        
                        <div class="info-grid">
                            <div class="info-item">
                                <strong><i class="bi bi-aspect-ratio"></i> Spatial Resolution</strong>
                                <div>{{ $metadata['spatial_resolution'] ?? '10 m' }}</div>
                            </div>
                            <div class="info-item">
                                <strong><i class="bi bi-calendar-range"></i> Temporal Extent</strong>
                                <div>{{ $metadata['temporal_extent'] ?? '2029' }}</div>
                            </div>
                            <div class="info-item">
                                <strong><i class="bi bi-file-earmark-code"></i> File Format</strong>
                                <div>{{ $metadata['file_format'] ?? 'GeoTIFF' }}</div>
                            </div>
                        </div>
                        
                        @if(isset($metadata['keywords']) && count($metadata['keywords']) > 0)
                            <div style="margin-top: 16px;">
                                <strong class="label"><i class="bi bi-tags"></i> Keywords</strong>
                                <div class="keyword-list">
                                    @foreach($metadata['keywords'] as $keyword)
                                        <span class="keyword" onclick="searchByKeyword('{{ $keyword }}')">
                                            <i class="bi bi-hash"></i> {{ $keyword }}
                                        </span>
                                    @endforeach
                                </div>
                            </div>
                        @endif
                    </div>
                </div>

                <div>
                    <div class="card">
                        <h3>
                            Organization
                        </h3>
                        
                        {{-- Get organization using the Model method --}}
                        @php
                            $organisation = \App\Models\Organisation::findFromMetadata($metadata);
                            $orgName = $metadata['owner'] ?? $metadata['organization'] ?? 'Unknown Organization';
                        @endphp
                        
                        <div class="info-item">
                            <strong><i class="bi bi-building"></i> Name</strong>
                            <div>{{ $orgName }}</div>
                        </div>
                        
                        @if($organisation)
                            <div class="info-item">
                                <strong> Organization Description</strong>
                                <div>{{ $organisation->description ?? 'Not Provided' }}</div>
                            </div>
                            
                            <div class="info-item">
                                <strong>Director</strong>
                                <div>{{ $organisation->director ?? 'Not Provided' }}</div>
                            </div>
                            
                            <div class="info-item">
                                <strong> Email Address</strong>
                                <div>
                                    @if($organisation->contact_email)
                                        <a href="mailto:{{ $organisation->contact_email }}" style="color: var(--primary);">
                                            {{ $organisation->contact_email }}
                                        </a>
                                    @else
                                        Not provided
                                    @endif
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <strong> Contact Phone</strong>
                                <div>{{ $organisation->contact_phone ?? 'Not provided' }}</div>
                            </div>
                            
                            @if($organisation->website)
                                <div class="info-item">
                                    <strong><i class="bi bi-globe"></i> Website</strong>
                                    <div>
                                        <a href="{{ $organisation->getFormattedWebsite() }}" target="_blank" style="color: var(--primary);" rel="noopener noreferrer">
                                            <i class="bi bi-box-arrow-up-right"></i> {{ $organisation->getDisplayWebsite() }}
                                        </a>
                                    </div>
                                </div>
                            @endif
                        @elseif($orgName !== 'Unknown Organization')
                            <div class="info-item">
                                <div class="alert alert-info" style="padding: 10px; background: #e3f2fd; border-radius: 5px; margin-top: 10px;">
                                    <i class="bi bi-info-circle"></i> 
                                    This metadata is owned by "{{ $orgName }}" but the organisation profile is not yet available in the system.
                                </div>
                            </div>
                        @else
                            <div class="info-item">
                                <div class="alert alert-warning" style="padding: 10px; background: #fff3cd; border-radius: 5px; margin-top: 10px;">
                                    <i class="bi bi-exclamation-triangle"></i> 
                                    No organization information is available for this metadata record.
                                </div>
                            </div>
                        @endif
                    </div>

                    <div class="card" style="margin-top: 20px;">
                        <h3>
                            <i class="bi bi-info-circle"></i> Additional Information
                        </h3>
                        <div class="info-item">
                            <strong><i class="bi bi-file-text"></i> Metadata Standard</strong>
                            <div>ISO 19115:2014</div>
                        </div>
                        <div class="info-item">
                            <strong><i class="bi bi-diagram-3"></i> Hierarchy Level</strong>
                            <div>Dataset</div>
                        </div>
                        <div class="info-item">
                            <strong><i class="bi bi-database"></i> Data Type</strong>
                            <div>Raster / Vector</div>
                        </div>
                        <div class="info-item">
                            <strong><i class="bi bi-arrow-repeat"></i> Update Frequency</strong>
                            <div>As needed</div>
                        </div>
                        @if(isset($metadata['license']))
                            <div class="info-item">
                                <strong><i class="bi bi-shield-check"></i> License</strong>
                                <div>{{ $metadata['license'] }}</div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        @else
            <div class="error">
                <i class="bi bi-exclamation-triangle" style="font-size: 48px;"></i>
                <h3>Metadata Not Found</h3>
                <p>The requested metadata record could not be found.</p>
                <button onclick="window.location.href='/metadata'" style="margin-top: 16px; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                    <i class="bi bi-arrow-left"></i> Return to Metadata List
                </button>
            </div>
        @endif
    </div>

    <div id="moreOptionsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="close" onclick="closeModal()">&times;</span>
                <h3><i class="bi bi-three-dots"></i> More Options</h3>
            </div>
            <div class="modal-body">
                <div class="modal-option" onclick="downloadMetadata()">
                    <i class="bi bi-download"></i> Download Metadata XML
                </div>
                <div class="modal-option" onclick="exportToJSON()">
                    <i class="bi bi-filetype-json"></i> Export to JSON
                </div>
                <div class="modal-option" onclick="viewHistory()">
                    <i class="bi bi-clock-history"></i> View History
                </div>
                <div class="modal-option" onclick="shareMetadata()">
                    <i class="bi bi-share"></i> Share
                </div>
                <div class="modal-option" onclick="reportIssue()">
                    <i class="bi bi-flag"></i> Report Issue
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="bi bi-x-circle"></i> Close
                </button>
            </div>
        </div>
    </div>

    <!-- Pass PHP data to JavaScript via data attributes -->
    <div id="metadata-data" 
         data-metadata-id="{{ $metadata['identifier'] ?? '' }}"
         data-metadata='@json($metadata)'
         data-is-admin="{{ auth()->check() && auth()->user()->is_admin ? 'true' : 'false' }}"
         data-user-organisation="{{ auth()->check() ? auth()->user()->organisation : '' }}"
         data-metadata-owner="{{ $metadata['owner'] ?? $metadata['organization'] ?? '' }}"
         data-north="{{ $metadata['max_lat'] ?? $metadata['extent']['north'] ?? '' }}"
         data-south="{{ $metadata['min_lat'] ?? $metadata['extent']['south'] ?? '' }}"
         data-east="{{ $metadata['max_lon'] ?? $metadata['extent']['east'] ?? '' }}"
         data-west="{{ $metadata['min_lon'] ?? $metadata['extent']['west'] ?? '' }}"
         data-csrf-token="{{ csrf_token() }}"
         style="display: none;">
    </div>

    <script src="{{ asset('js/view-metadata.js') }}"></script>
    
</x-app-layout>
</body>
</html>
