<!DOCTYPE html>
<html lang="en">
<head>
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title> Metadata </title>
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <meta name="user-role" content="{{ Auth::check() ? strtolower(Auth::user()->role) : '' }}">

    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css" />
    <link rel="stylesheet" href="{{ asset('css/mapping.css') }}" />
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />

    <!-- JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.5.0/dist/axios.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js"></script>
    
    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
</head>

<body>

    <x-app-layout>
    	<div id = "metamap"></div>
    	
    	<button type="button" id="close-metadata" class="btn btn-conn rounded-circle">
			<span id="product-icon">&times;</span> 
		</button>
		
		<div id="province-confirm-modal" class="modal" tabindex="-1" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
			background-color: rgba(0,0,0,0.5); z-index: 1050; align-items: center; justify-content: center;">
			<div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
				<p id="province-confirm-message" style="margin-bottom: 20px;"></p>
				<div style="text-align: right;">
				    <button id="province-confirm-yes" class="btn btn-primary">Yes</button>
				    <button id="province-confirm-no" class="btn btn-secondary">No</button>
				</div>
			</div>
		</div>

	  	<!-- Contact Modal -->
		<div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
				    <div class="modal-header">
				        <h5 class="modal-title fw-bold" id="contactModalLabel">Contact Info</h5>
				        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				    </div>
				    <div class="modal-body">
				        <p><strong>Owner:</strong> <span id="modal-owner">N/A</span></p>
				        <p><strong>Description:</strong> <span id="modal-description">N/A</span></p>
				        <p><strong>Email:</strong> <span id="modal-email">N/A</span></p>
				        <p><strong>Phone:</strong> <span id="modal-phone">N/A</span></p>
				    </div>
				</div>
			</div>
		</div>
				
		@auth		
		  	<!-- Update Metadata -->
			<div class="modal fade" id="updateMetadata" tabindex="-1" aria-labelledby="updateModalMetadata" aria-hidden="true">
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-header">
						    <h5 class="modal-title fw-bold" id="updateModalMetadata">Update Metadata <span id = "updatetitle"></span></h5>
						    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
						    <form>
						  		<div class="mb-3 mt-3">
									<label for="title-metadata" class="form-label">Title:</label>
									<input type="text" class="form-control" id="title-metadata" value="" name="title-metadata">
							  	</div>
							  	<div class="mb-3">
									<label for="description-metadata" class="form-label">Description:</label>
									<textarea class="form-control" rows="5" id="description-metadata" name="description-metadata"></textarea>
							  	</div>
							  	<div class="mb-3">
									<label for="email-metadata" class="form-label">Email Address:</label>
									<input type="text" class="form-control" id="email-metadata" value="" name="email-metadata">
							  	</div>
							  	<div class="mb-3">
									<label for="phone-metadata" class="form-label">Phone Number:</label>
									<input type="number" class="form-control" id="phone-metadata" value="" name="phone-metadata">
							  	</div>
							  	<input type="hidden" id="identifier" name="identifier" />
							  	<div class="d-grid">
							  		<button type="button" onClick = "updateMetadata()" class="btn btn-conn btn-block">Update / Save</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		
			<div id="upload-btn" class="btn-group btn-group-sm">
				<button id="uploadfBtn" type="button" class="btn">Upload Metadata</button>
				<button id="dashboardid" type="button" class="btn"> Dashboard </button>
			</div>
			
			<div id="dashboard-base" class="card">
				<div class="card-body">
					@if(auth()->user()->is_admin)  <!-- Changed from hasRole('admin') to is_admin -->
						<h2 class="fw-bold mb-4">Welcome {{ auth()->user()->name }} - Administrator</h2>
						<div class="mb-4 mt-4">
						    <ul class="nav nav-tabs" role="tablist">
						        <li class="nav-item">
						            <a class="nav-link active" data-bs-toggle="tab" href="#User-Management">User Management</a>
						        </li>
						        <li class="nav-item">
							  		<a class="nav-link" data-bs-toggle="tab" href="#Metadata-Management"> Metadata Management </a>
								</li>
								<li class="nav-item">
							  		<a class="nav-link" data-bs-toggle="tab" href="#Harvest-Configuration"> Harvest Configuration </a>
								</li>
						    </ul>

						    <div class="tab-content">
						        <div id="User-Management" class="container tab-pane active mt-3">
						            <div id="user-manage-table"></div> <!-- Changed from span to div -->
						        </div>
						        <div id="Metadata-Management" class="container tab-pane fade"><br>
								  	<h3>Menu 1</h3>
								  	<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
								</div>
								<div id="Harvest-Configuration" class="container tab-pane fade"><br>
								  	<h3>Menu 2</h3>
								  	<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.</p>
								</div>
						    </div>
						</div>
					@else
						<h2 class="fw-bold mt-2 mb-4">Welcome {{ auth()->user()->name }}</h2>
						<div class="alert alert-danger">
						    <strong>Access Denied!</strong> You are not authorised to access the dashboard. 
						</div>
					@endif
				</div>
			</div>

			<div id="metadata-base" class="card" style="display: none;">
				<div class="card-body">
				    <div class="hea">
				        <h2 class="fw-bold mb-3">Metadata Records</h2>
				        <p id="record-count">Loading records...</p>
				    </div>
				    <div class="hea">
				        <!-- Tab Buttons -->
						<div class="d-flex nav-tabs mb-3" id="metadata-tab">
							<div class="p-2 flex-fill tab-link active" data-target="#uploadFileDiv">Upload File</div>
							<div class="p-2 flex-fill tab-link" data-target="#manualUploadDiv">Manual Upload</div>
							<div class="p-2 flex-fill tab-link" data-target="#harvestMetadataDiv">Harvest Metadata</div>							
						</div>

						<!-- Tab Content -->
						<div class="tab-content">
							<div id="uploadFileDiv" class="tab-pane active">
								<form id="uploadForm" method="POST" action="/upload-metadata" enctype="multipart/form-data">
									@csrf
									<label for="customFile" class="form-label fw-bold text-success">Upload Metadata File</label>
									<div class="input-group mb-3">
										<input class="form-control custom-upload p-2" type="file" id="customFile" name="filename" accept=".xml,.zip,.json">
										<span id="submitFiles" class="input-group-text" style="cursor:pointer;">Submit</span>
									</div>
									<div id="file-name" class="form-text mt-1 text-white">No file selected</div>
									<div id="upload-status" class="form-text mt-1"></div>
								</form>

								<div id="upload-status" class="mt-2 text-white fw-bold"></div>
							</div>

							<div id="manualUploadDiv" class="tab-pane d-none">
								<div class="container">
							  		<div class="row justify-content-center">
										<div class="col-md">
										  	<div class="card shadow">
												<div class="card-body">
												  	<form id="metadataForm" enctype="multipart/form-data">
														<div class="row mb-4">
														  	<div class="col-md-6 mb-3">
																<label for="title" class="form-label">Title*</label>
																<input type="text" class="form-control" id="title" required>
														  	</div>
														  	<div class="col-md-6 mb-3">
																<label for="category" class="form-label">Category*</label>
																<select class="form-select" id="category" required>
															  		<option value="" selected disabled>Select category</option>
																  	<option>Water Resources</option>
																  	<option>Climate Change</option>
																  	<option>Disaster Management</option>
																  	<option>Transportation</option>
																  	<option>Ecosystems</option>
																  	<option>Geology</option>
																  	<option>Mineral Exploration</option>
																  	<option>Mining</option>
																  	<option>Rangelands</option>
																  	<option>Agriculture</option>
																  	<option>Energy</option>
																  	<option>Biodiversity</option>
																  	<option>Urban Planning</option>
																  	<option>Forestry</option>
																  	<option>Rural Development</option>
																  	<option>Human Settlements</option>
																  	<option>Weather Services</option>
																  	<option>Air Quality</option>
																  	<option>Land Cover</option>
																  	<option>Land Use</option>
																</select>
														  	</div>
														</div>

														<div class="mb-4">
											  				<label for="description" class="form-label">Description*</label>
											  				<textarea class="form-control" id="description" rows="3" required></textarea>
														</div>

														<div class="row mb-4">
											  				<div class="col-md mb-3">
																<label for="province" class="form-label">Province*</label>
																<select class="form-select" id="province" required>
																  	<option value="" selected disabled>Select province</option>
																  	<option>Gauteng</option>
																  	<option>Western Cape</option>
																  	<option>KwaZulu-Natal</option>
																  	<option>Eastern Cape</option>
																  	<option>Free State</option>
																  	<option>Limpopo</option>
																  	<option>Mpumalanga</option>
																  	<option>North West</option>
															  		<option>Northern Cape</option>
															  		<option>South Africa</option>
																</select>
										  					</div>
										  					
										  					<div class="col-md mb-4">
														  		<label for="spatial_file" class="form-label">Upload Spatial Data (Optional)</label>
														  		<input type="file" class="form-control" id="spatial_file" accept=".xml,.json,.kml">
															</div>
														</div>

														<div class="mb-4">
													  		<label class="form-label">Spatial Data (Geometry)</label>
													  		<div id="maps" style="height: 300px; width: 100%;" class="border rounded"></div>
													  		<small class="text-muted">Select your bounding box on the map </small>
														</div>

														<!-- Bounding Box Inputs -->
														<div class="mb-4">
													  		<label class="form-label">Bounding Box Coordinates*</label>
													  		<div class="row">
																<div class="col-md-3 mb-3">
																  	<label for="min_lon" class="form-label">Min Longitude</label>
																  	<input type="number" step="any" class="form-control" id="min_lon" required>
																</div>
																<div class="col-md-3 mb-3">
														  			<label for="min_lat" class="form-label">Min Latitude</label>
														  			<input type="number" step="any" class="form-control" id="min_lat" required>
																</div>
																<div class="col-md-3 mb-3">
														  			<label for="max_lon" class="form-label">Max Longitude</label>
														  			<input type="number" step="any" class="form-control" id="max_lon" required>
																</div>
																<div class="col-md-3 mb-3">
														  			<label for="max_lat" class="form-label">Max Latitude</label>
														  			<input type="number" step="any" class="form-control" id="max_lat" required>
																</div>
												  			</div>
														</div>

														<div class="row mb-4">
													  		<div class="col-md-6 mb-3">
																<label for="contact_email" class="form-label">Contact Email*</label>
																<input type="email" class="form-control" id="contact_email" required>
													 		</div>
													  		<div class="col-md-6 mb-3">
																<label for="contact_phone" class="form-label">Contact Phone</label>
																<input type="tel" class="form-control" id="contact_phone">
													  		</div>
														</div>

														<div class="row mb-4">
													  		<div class="col-md mb-3">
																<label for="website" class="form-label">Website</label>
																<input type="url" class="form-control" id="website">
													  		</div>
													  		<div class="col-md mb-3">
																<label for="thumbnail" class="form-label">Thumbnail Image</label>
																<input type="file" class="form-control" id="thumbnail" accept="image/*">
													  		</div>
													  		<div class="col-md mb-3">
														  		<label for="owner" class="form-label">Owner/Organization*</label>
														  		<input type="text" class="form-control" id="owner" required>
															</div>
														</div>

														<div class="d-grid gap-2 d-md-flex justify-content-md-end">
													  		<button type="button" class="btn btn-outline-secondary me-md-2">Cancel</button>
													  		<button type="button" class="btn btn-conn" onclick="submitManualMetadata()">Submit Dataset</button>
														</div>
								  					</form>
												</div>
							  				</div>
										</div>
					  				</div>
								</div>

							</div>

							<div id="harvestMetadataDiv" class="tab-pane d-none">
								<div class="row g-0 mb-3">
									<div class="col-md-10 pe-1">
										<input type="text" 
											   class="form-control" 
											   placeholder="Enter your harvest catalogue URL" 
											   id="harvest-source" 
											   name="harvest-source">
									</div>
									<div class="col-md">
										<button id="harvestid" class="btn fw-bold btn-success w-100" type="button"> Harvest </button>
									</div>
								</div>
								<div id="harvest-content"></div>
							</div>
						</div>

				    </div>
				</div>
			</div>
		@endauth
		
		<div id="process-panel" class="card shadow-sm">
            <div class="card-body">
                <form id="process-form">

                    <!-- Sensor Details -->
                    <fieldset class="border p-2 mb-4 rounded">
                        <legend class="float-none w-auto px-2 fw-bold">Sensor Details</legend>

                        <div class="row g-2">
                            <div class="col-md-6">
                                <label class="form-label">Sensor</label>
                                <select class="form-select" name="sensor" id="sensor" required>
                                    <option value="">Select Sensor</option>
                                    <option value="MODIS">MODIS</option>
                                    <option value="Sentinel-2">Sentinel-2</option>
                                    <option value="Landsat-8">Landsat-8</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Data Type</label>
                                <select class="form-select" name="data_type" id="data_type" required>
                                    <option value="">Select Data Type</option>
                                    <option value="NDVI">NDVI</option>
                                    <option value="VCI">VCI</option>
                                    <option value="Rainfall">Rainfall</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Date Selection -->
                    <fieldset class="border p-2 mb-4 rounded">
                        <legend class="float-none w-auto px-2 fw-bold">Date Selection</legend>

                        <div class="row g-2">
                            <div class="col-md-6">
                                <label class="form-label">Year</label>
                                <input type="number" class="form-control" name="year" id="year"
                                       min="2000" max="2026" placeholder="Enter year" required>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Month</label>
                                <select class="form-select" name="month" id="month" required>
                                    <option value="">Select Month</option>
                                    <option value="01">January</option>
                                    <option value="02">February</option>
                                    <option value="03">March</option>
                                    <option value="04">April</option>
                                    <option value="05">May</option>
                                    <option value="06">June</option>
                                    <option value="07">July</option>
                                    <option value="08">August</option>
                                    <option value="09">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Optional Advanced Parameters -->
                    <fieldset class="border p-2 mb-4 rounded">
                        <legend class="float-none w-auto px-2 fw-bold">Output Options</legend>

                        <div class="row g-2">
                            <div class="col-md-6">
                                <label class="form-label">Output Format</label>
                                <select class="form-select" name="format">
                                    <option value="geojson">GeoJSON</option>
                                    <option value="tiff">GeoTIFF</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Resolution</label>
                                <select class="form-select" name="resolution">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <div class="text-center">
                        <div class="btn-group">
                            <button type="button" onclick = "togglePanel()" class="btn btn-secondary"> Cancel </button>
                            <button type="button" class="btn btn-secondary"> Reset </button>
                            <button type="button" class="btn btn-secondary"> Run Process </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
		
		<div id="search-panel"  class="card">
            <div class="card-body">
                <div id = "textpanel" class="input-group mb-3 mt-3 position-relative">
				  	<input type="text" id="search-value" class="form-control pe-5" placeholder="Enter for records">

				  	<!-- Clear X inside input -->
				  	<span id="clear-search" class="position-absolute" style="">
						clear
				  	</span>

				  	<span id="searchid" data-bs-toggle="tooltip" title="Search by text" class="input-group-text">
						<i class="bi bi-search"></i>
				  	</span>
				  	<span id="draw" data-bs-toggle="tooltip" title="Draw Polygon" class="input-group-text">
						<i class="bi bi-pencil-square"></i>
				  	</span>
				  	<span id="dateid" data-bs-toggle="tooltip" title="Query Date Range" class="input-group-text">
						<i class="bi bi-calendar"></i>
				  	</span>
				</div>

                <div id="daterange" class="hiddens mb-3 mt-3">
                    <span>
                        <label for="startrange" class="form-label fw-bold">Start Date:</label>
                        <input type="date" class="form-control form-control-sm" id="startrange" name="startrange">
                    </span>
                    <span>
                        <label for="endrange" class="form-label fw-bold">End Date:</label>
                        <input type="date" class="form-control form-control-sm" id="endrange" name="endrange">
                    </span>
                </div>

                <div id="search-body">
					<span id="metadata-content"></span>
				</div>
            </div>
        </div>
    </x-app-layout>
	<script src="{{ asset('js/mapping.js') }}"></script>
	
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
	<!-- Leaflet Draw CSS -->
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />

	<!-- Leaflet JS -->
	<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
	<!-- Leaflet Draw JS -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
	<script src="{{ asset('js/leafs.js') }}"></script>
	
	<!-- Bootstrap 5 JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- jQuery (required for DataTables) -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <!-- DataTables JS -->
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
	
	<script>		
		var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
		var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
	  		return new bootstrap.Tooltip(tooltipTriggerEl)
		})
	</script>
</body>
</html>
