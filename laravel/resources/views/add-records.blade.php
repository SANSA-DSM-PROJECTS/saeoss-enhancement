<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>SAEOSS | Create Metadata Record · SANS 1878</title>
    <!-- Bootstrap 5 CSS + Icons + Font Awesome -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Leaflet CSS + JS + Draw plugin for extent map -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <!-- Google Fonts Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
   
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    <link href="{{ asset('css/addform.css') }}" rel="stylesheet">
</head>
<body>
<x-app-layout>
<div class="main-container">
    <div class="row g-4">
        <!-- Left Column: Information Panel -->
        <div class="col-lg-4">
            <div class="info-panel">
                <h2><i class="fas fa-database me-2"></i> What are metadata records?</h2>
                <p>A Metadata Record is a collection of data resources (such as files), together with a description and other information, at a fixed URL. Metadata Records are what users see when searching for data.</p>
                <div class="info-highlight">
                    <i class="fas fa-info-circle"></i> 
                    <strong>SANS 1878 compliant</strong><br>
                    This form follows the SANS 1878 metadata standard for geospatial and dataset documentation.
                </div>
                <div class="info-highlight" style="margin-top: 1rem;">
                    <i class="fas fa-globe"></i> 
                    <strong>ISO 19115 compatible</strong><br>
                    Core elements include title, abstract, lineage, geographic extent, and responsible party.
                </div>
            </div>
        </div>

        <!-- Right Column: Form -->
        <div class="col-lg-8">
            <div class="form-container">
                <div class="form-header">
                    <h1> Create metadata record</h1>
                    <p>Fill in the details below to create a complete metadata record. Mandatory fields are marked with <span class="text-danger">*</span></p>
                </div>

                <!-- Arrow Navigation (Groups) -->
                <div class="arrow-nav" id="arrowNav">
                    <div class="arrow-step active" data-step="0">Core details</div>
                    <div class="arrow-step" data-step="1">Organisation & topic</div>
                    <div class="arrow-step" data-step="2">Language & dates</div>
                    <div class="arrow-step" data-step="3">Distribution & spatial</div>
                    <div class="arrow-step" data-step="4">People contributing</div>
                </div>

                <form id="metadataForm">
                    <!-- GROUP 0: CORE ISO -->
                    <div class="step-content" data-step="0">
                        <div id="formError" class="error-message" style="display: none;"></div>
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label required">Resource title</label>
                                <input type="text" class="form-control" name="title" placeholder="eg. High-resolution rainfall map for Western Cape, 2023" required>
                                <div class="input-hint"><i class="fas fa-info-circle"></i> Name by which the cited resource is known. SANS 1878 mandatory field.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label required">Abstract / description</label>
                                <textarea class="form-control" name="abstract" rows="3" placeholder="Provide a concise summary about the dataset's purpose, content, and key characteristics." required></textarea>
                                <div class="input-hint"><i class="fab fa-markdown"></i> Brief narrative summary. Markdown allowed. SANS 1878 mandatory.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label required">Lineage statement</label>
                                <textarea class="form-control" name="lineageStatement" rows="2" placeholder="Describe data source, processing steps, and quality control measures (eg. Derived from Landsat 9, resampled to 30m)." required></textarea>
                                <div class="input-hint"><i class="fas fa-code-branch"></i> SANS 1878 mandatory field: general explanation of data provenance.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label required">Geographic extent (bounding box)</label>
                                <div class="extent-grid">
                                    <div class="map-column">
                                        <div class="map-wrapper">
                                            <div id="extentMap" style="height: 260px;"></div>
                                        </div>
                                        <div class="draw-hint">
                                            <i class="fas fa-mouse-pointer"></i> Use drawing tools (rectangle icon) to draw extent
                                        </div>
                                    </div>
                                    <div class="coord-column">
                                        <div class="coord-card">
                                            <div class="coord-item"><div class="coord-label"><i class="fas fa-arrow-left"></i> West (longitude)</div><div class="coord-value"><input type="number" step="any" id="westLon" value="-22.1265" placeholder="-180 to 180"></div></div>
                                            <div class="coord-item"><div class="coord-label"><i class="fas fa-arrow-right"></i> East (longitude)</div><div class="coord-value"><input type="number" step="any" id="eastLon" value="32.8931"></div></div>
                                            <div class="coord-item"><div class="coord-label"><i class="fas fa-arrow-down"></i> South (latitude)</div><div class="coord-value"><input type="number" step="any" id="southLat" value="-34.8212"></div></div>
                                            <div class="coord-item"><div class="coord-label"><i class="fas fa-arrow-up"></i> North (latitude)</div><div class="coord-value"><input type="number" step="any" id="northLat" value="16.4699"></div></div>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" name="boundingBoxWKT" id="bboxWkt">
                                <div class="input-hint mt-2"><i class="fas fa-draw-polygon"></i> Bounding box for the metadata record. West < East and South < North. SANS 1878 mandatory.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Spatial resolution equivalent scale</label>
                                <input type="text" class="form-control" name="spatialResolution" placeholder="Denominator, e.g., 25000" value="50000">
                                <div class="input-hint">Level of detail expressed as scale denominator (1:X). Higher value = coarser resolution.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">DOI</label>
                                <input type="text" class="form-control" name="doi" placeholder="10.xxxx/xxxx">
                                <div class="input-hint">Digital Object Identifier of the metadata record (if any). Persistent identifier.</div>
                            </div>
                        </div>
                    </div>

                    <!-- GROUP 1: ORGANISATION & TOPIC -->
                    <div class="step-content" data-step="1" style="display:none;">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label required">Responsible organisation Name</label>
                                <input type="text" class="form-control" name="responsibleOrg" placeholder="e.g., South African Environmental Observation Network" required>
                                <div class="input-hint"><i class="fas fa-building"></i> Organisation that takes responsibility for the metadata record. SANS 1878 mandatory.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label required">Individual name</label>
                                <input type="text" class="form-control" name="respIndividualName" placeholder="Full name of contact person" required>
                                <div class="input-hint">Name of personnel responsible for the metadata.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label required">Position name</label>
                                <input type="text" class="form-control" name="respPositionName" placeholder="e.g., Data Manager, GIS Specialist" required>
                                <div class="input-hint">Role or position title of the contact.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label required">Role</label>
                                <select class="form-select" name="respRole" required>
                                    <option value="resource provider">resource provider</option>
                                    <option value="pointOfContact">point of contact</option>
                                    <option value="custodian">custodian</option>
                                </select>
                                <div class="input-hint">Function performed by the responsible party (ISO role).</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Email address</label>
                                <input type="email" class="form-control" name="respEmail" placeholder="name@organisation.org">
                                <div class="input-hint">Primary email for correspondence.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Phone</label>
                                <input type="tel" class="form-control" name="contactPhone" placeholder="+27 XX XXX XXXX">
                                <div class="input-hint">Office phone number.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Website URL</label>
                                <input type="url" class="form-control" name="respWebsite" placeholder="https://example.org">
                                <div class="input-hint">Organisation or personal webpage.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label required">Topic Category</label>
                                <select class="form-select" name="topicCategory" required>
                                    <option value="">-- Select --</option>
                                    <option>economy</option><option>health</option><option>environment</option>
                                    <option>climatologyMeteorologyAtmosphere</option><option>inlandWaters</option>
                                    <option>transportation</option><option>society</option><option>geoscientificInformation</option>
                                </select>
                                <div class="input-hint">ISO 19115 Topic Category - high-level thematic grouping. SANS 1878 mandatory.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Tags</label>
                                <input type="text" class="form-control" name="tags" placeholder="economy, mental health, government, rainfall">
                                <div class="input-hint">Additional keywords, comma-separated. Recommended at least three for discoverability.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Metadata standard name</label>
                                <input type="text" class="form-control" name="metadataStandardName" placeholder="ISO19115, SANS1878" value="SANS 1878">
                                <div class="input-hint">Name of metadata standard used.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Metadata standard version</label>
                                <input type="text" class="form-control" name="metadataStandardVersion" placeholder="e.g., 1.1">
                                <div class="input-hint">Version of the standard applied.</div>
                            </div>
                        </div>
                    </div>

                    <!-- GROUP 2: LANGUAGE & DATES -->
                    <div class="step-content" data-step="2" style="display:none;">
                        <div class="row g-3">
                            <div class="col-md-3"><label class="form-label required">Dataset language</label><input type="text" class="form-control" name="datasetLanguage" value="eng" placeholder="ISO 639-2 code" required><div class="input-hint">Three-letter language code (eng, afr, zul).</div></div>
                            <div class="col-md-3"><label class="form-label required">Dataset char set</label><select class="form-select" name="datasetCharSet" required><option>UCS-2</option><option>UTF-8</option></select><div class="input-hint">Character encoding.</div></div>
                            <div class="col-md-3"><label class="form-label required">Metadata language</label><input type="text" class="form-control" name="metadataLanguage" value="eng" required><div class="input-hint">Language of metadata document.</div></div>
                            <div class="col-md-3"><label class="form-label required">Metadata char set</label><select class="form-select" name="metadataCharSet" required><option>UCS-2</option><option>UTF-8</option></select><div class="input-hint">Encoding for metadata fields.</div></div>
                            <div class="col-md-4"><label class="form-label required">Reference datetime</label><input type="datetime-local" class="form-control" name="referenceDateTime" required><div class="input-hint">Date of dataset creation/publication/revision.</div></div>
                            <div class="col-md-4"><label class="form-label required">Reference date type</label><select class="form-select" name="referenceDateType" required><option>Creation</option><option>Publication</option><option>Revision</option></select><div class="input-hint">Nature of the reference date.</div></div>
                            <div class="col-md-4"><label class="form-label required">Metadata stamp date</label><input type="datetime-local" class="form-control" name="metadataStampDate" required><div class="input-hint">Date when metadata was created/updated.</div></div>
                            <div class="col-12"><label class="form-label">Additional reference info</label><textarea class="form-control" name="refSysInfo" rows="2" placeholder="Vertical datum: WGS84, temporal extent: 2000-2025"></textarea><div class="input-hint">Temporal / vertical reference system details.</div></div>
                        </div>
                    </div>

                    <!-- GROUP 3: DISTRIBUTION & SPATIAL -->
                    <div class="step-content" data-step="3" style="display:none;">
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label required">Format name</label><input type="text" class="form-control" name="distFormatName" value="Electronic metadata record" required><div class="input-hint">File format or data structure name.</div></div>
                            <div class="col-md-6"><label class="form-label required">Format version</label><input type="text" class="form-control" name="distFormatVersion" value="1.0" required><div class="input-hint">Version of the format.</div></div>
                            <div class="col-md-6"><label class="form-label required">Spatial representation type</label><select class="form-select" name="spatialRepType" required><option>Vector</option><option>Grid</option><option>Tin</option></select><div class="input-hint">Method used to represent geographic information.</div></div>
                            <div class="col-md-6"><label class="form-label">Spatial Reference System Identifier</label><input type="text" class="form-control" name="srsIdentifier" placeholder="EPSG:4326" value="EPSG:4326"><div class="input-hint">Coordinate reference system (e.g., EPSG:4326 for WGS84).</div></div>
                            <div class="col-12"><label class="form-label">Online resource URL</label><input type="url" class="form-control" name="onlineUrl" placeholder="https://data.saeoss.org/dataset/xxx"><div class="input-hint">Link to download or access the dataset.</div></div>
                            <div class="col-md-4"><label class="form-label">Resource name</label><input type="text" class="form-control" name="onlineName" placeholder="Data portal link"><div class="input-hint">Display name for the online resource.</div></div>
                            <div class="col-md-4"><label class="form-label">Application profile</label><input type="text" class="form-control" name="appProfile" placeholder="WMS, REST, OGC API"><div class="input-hint">Protocol or application profile.</div></div>
                            <div class="col-md-4"><label class="form-label">Thumbnail URL</label><input type="url" class="form-control" name="thumbnailUrl" placeholder="https://.../preview.png"><div class="input-hint">Preview image representing the data.</div></div>
                            <div class="col-md-6"><label class="form-label">Additional contact (optional)</label><input type="text" class="form-control" name="contactIndividualName" placeholder="Alternate contact name"><div class="input-hint">Extra point of contact.</div></div>
                            <div class="col-md-3"><label class="form-label">Contact email</label><input type="email" class="form-control" name="contactEmail" placeholder="email@domain.com"></div>
                            <div class="col-md-3"><label class="form-label">Contact phone</label><input type="tel" class="form-control" name="contactPhonePoint" placeholder="+27..."></div>
                        </div>
                    </div>

                    <!-- GROUP 4: PEOPLE CONTRIBUTING (dynamic contributors) -->
                    <div class="step-content" data-step="4" style="display:none;">
                        <div id="contributorsContainer">
                            <!-- dynamic contributor cards will be injected here -->
                        </div>
                        <button type="button" id="addContributorBtn" class="btn btn-add-contrib"><i class="fas fa-plus-circle"></i> Add another contributor</button>
                        <div class="input-hint mt-2"><i class="fas fa-user-check"></i> Include each person involved in metadata creation, with name, role, and contact details.</div>
                    </div>

                    <!-- Navigation buttons -->
                    <div class="d-flex justify-content-between align-items-center mt-4 pt-2">
                        <button type="button" id="prevBtn" class="btn btn-secondary btn-icon" disabled><i class="fas fa-arrow-left"></i> Back</button>
                        <button type="button" id="nextBtn" class="btn btn-primary btn-icon">Next <i class="fas fa-arrow-right"></i></button>
                        <button type="submit" id="submitBtn" class="btn btn-success btn-icon" style="display: none;"><i class="fas fa-check-circle"></i> Submit</button>
                    </div>
                    
                </form>
                <footer>All mandatory fields must be completed</footer>
            </div>
        </div>
    </div>
</div>
</x-app-layout>
<script src="{{ asset('js/addform.js') }}"></script>

<script>
    
</script>
</body>
</html>
