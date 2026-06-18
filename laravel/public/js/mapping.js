/********************** Map Layers Configuration ************************/
const createXYZLayer = (name, url, attribution, visible = false) => new ol.layer.Tile({
    name,
    visible,
    source: new ol.source.XYZ({
        url,
        attributions: `© ${new Date().getFullYear()} ${attribution}`,
        tileSize: 256,
        crossOrigin: 'anonymous'
    })
});

// Base layers
const baseLayers = {
    neighbourhood: createXYZLayer(
        'Neighbourhood',
        'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=85b21f0f345b40c880729c091a6acb6c',
        'Microsoft, DigitalGlobe',
        true
    ),
    osm: new ol.layer.Tile({
        name: 'OpenStreetMap',
        visible: false,
        source: new ol.source.OSM()
    }),
    satellite: createXYZLayer(
        'Satellite',
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        'ESRI World Imagery'
    )
};

// Overlay layer
const province = new ol.layer.Tile({
    name: 'Province',
    visible: true,
    source: new ol.source.TileWMS({
        url: 'http://localhost:8080/geoserver/workspace/wms',
        params: {
            'LAYERS': 'workspace:Province',
            'TRANSPARENT': true,
            'TILED': true
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    })
});

/********************** Map Initialization ************************/
const view = new ol.View({
    projection: 'EPSG:4326',
    center: [24.4542, -28.5734],
    zoom: 6,
    minZoom: 6,
    maxZoom: 18
});

// Initialize map with default interactions
const map = new ol.Map({
    target: 'metamap',
    layers: Object.values(baseLayers).concat([province]),
    view,
    interactions: [
        new ol.interaction.DragPan(),
        new ol.interaction.PinchZoom(),
        new ol.interaction.MouseWheelZoom(),
        new ol.interaction.DragRotate(),
        new ol.interaction.DragZoom()
    ]
});

/********************** Vector Drawing Layer ************************/
let draw;
const drawSource = new ol.source.Vector();
const drawLayer = new ol.layer.Vector({
    source: drawSource,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 0.8)',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.1)'
        })
    })
});
map.addLayer(drawLayer);

/********************** Panel Visibility Management ************************/
let panelVisible = true;

function togglePanel() {
    const $searchPanel = $('#search-panel');
    const $processPanel = $('#process-panel');
    
    if ($processPanel.is(':visible')) {
        hideProcessPanel();
        return;
    }
    
    if (panelVisible) {
        hideSearchPanel();
    } else {
        showSearchPanel();
    }
}

function hideProcessPanel() {
    const $processPanel = $('#process-panel');
    const $searchPanel = $('#search-panel');
    
    $processPanel.hide();
    
    $searchPanel
        .css('display', 'flex')
        .hide()
        .removeClass('fadeOutLeft')
        .show()
        .addClass('slideInFromLeft');
    
    updatePanelControls(true);
    panelVisible = true;
    
    console.log("Process panel hidden, search panel shown");
}

function showSearchPanel() {
    if (panelVisible) return;
    
    $('#metadata-base')
        .removeClass('slideInFromLeft')
        .addClass('fadeOutLeft');
    
    setTimeout(() => {
        $('#metadata-base')
            .hide()
            .removeClass('fadeOutLeft');
        
        $('#search-panel')
            .css('display', 'flex')
            .hide()
            .removeClass('fadeOutLeft')
            .show()
            .addClass('slideInFromLeft');
        
        updatePanelControls(true);
        panelVisible = true;
    }, 400);
}

function hideSearchPanel() {
    if (!panelVisible) return;

    $('#search-panel')
        .removeClass('slideInFromLeft')
        .addClass('fadeOutLeft');

    setTimeout(() => {
        $('#search-panel')
            .hide()
            .removeClass('fadeOutLeft');

        updatePanelControls(false);
        panelVisible = false;
    }, 400);
}

function updatePanelControls(isSearchVisible) {
    const $closeBtn = $('#close-metadata');
    const $icon = $('#product-icon');
    
    if ($('#dashboard-base').css('display') === 'block') {
	    document.getElementById("dashboard-base").style.display = "none";
	}
    
    if (isSearchVisible) {
        $closeBtn.css({ 
            top: '140px', 
            left: '24%', 
            right: 'auto' 
        }).show();
        $icon.html('&times;');
    } else {
        $closeBtn.css({ 
            top: '70px', 
            right: '10px', 
            left: 'auto' 
        }).show();
        $icon.html('+');
    }
}

/********************** Drawing Functionality ************************/

function setupDrawing() {
    if (draw) {
        map.removeInteraction(draw);
    }

    drawSource.clear();

    draw = new ol.interaction.Draw({
        source: drawSource,
        type: 'Polygon'
    });

    draw.on('drawend', function(event) {
        const format = new ol.format.GeoJSON();
        const geojson = format.writeFeature(event.feature);
        viewData('polygon', geojson);
        map.removeInteraction(draw);
    });

    map.addInteraction(draw);

    // Hide search panel without showing metadata-base
    $('#search-panel')
        .removeClass('slideInFromLeft')
        .addClass('fadeOutLeft');

    setTimeout(() => {
        $('#search-panel')
            .hide()
            .removeClass('fadeOutLeft');
        
        updatePanelControls(false);
        panelVisible = false;
    }, 400);
}

/*********************** Zoom To Area ************************/

function getWebsite(button) {
    let website = button.getAttribute('data-website');

    if (!website) {
        alert("No website available for this record.");
        return;
    }

    if (!/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
    }

    alert(`Website: ${website}`);
    window.open(website, '_blank');
}

function getContacts(button) {
    const parent = button.closest('.result-row');
    const owner = parent.querySelector('p')?.innerText.split('|')[0].trim() || 'Unknown';
    const description = parent.querySelector('.description p')?.innerText || 'N/A';
    const email = button.getAttribute('data-email') || 'N/A';
    const phone = button.getAttribute('data-phone') || 'N/A';

    // Set modal content
    document.getElementById('modal-owner').innerText = owner;
    document.getElementById('modal-description').innerText = description;
    document.getElementById('modal-email').innerText = email;
    document.getElementById('modal-phone').innerText = phone;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}


function zoomToArea(button) {
    const minLon = parseFloat(button.getAttribute('data-min-lon'));
    const minLat = parseFloat(button.getAttribute('data-min-lat'));
    const maxLon = parseFloat(button.getAttribute('data-max-lon'));
    const maxLat = parseFloat(button.getAttribute('data-max-lat'));

    if (isNaN(minLon) || isNaN(minLat) || isNaN(maxLon) || isNaN(maxLat)) {
        alert("Invalid coordinates.");
        return;
    }

    // Zoom to bounding box
    const extent = [minLon, minLat, maxLon, maxLat];
    map.getView().fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });

    // Draw bounding box
    const bboxFeature = new ol.Feature({
        geometry: new ol.geom.Polygon([[ 
            [minLon, minLat],
            [minLon, maxLat],
            [maxLon, maxLat],
            [maxLon, minLat],
            [minLon, minLat]
        ]])
    });

    bboxFeature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'red',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255, 0, 0, 0.1)'
        })
    }));

    const vectorSource = new ol.source.Vector({
        features: [bboxFeature]
    });

    const vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });

    map.addLayer(vectorLayer);

    // Hide search panel
    if (panelVisible) {
        $('#search-panel')
            .removeClass('slideInFromLeft')
            .addClass('fadeOutLeft');

        setTimeout(() => {
            $('#search-panel').hide().removeClass('fadeOutLeft');
            updatePanelControls(false);
            panelVisible = false;
        }, 400);
    }

    // Remove bounding box after 1 minute and show search panel
    setTimeout(() => {
        map.removeLayer(vectorLayer);

        // Show search panel again
        if (!panelVisible) {
            $('#search-panel')
                .css('display', 'flex')
                .hide()
                .show()
                .addClass('slideInFromLeft');
            updatePanelControls(true);
            panelVisible = true;
        }
    }, 5000);
}


/********************** Data Handling ************************/
let currentPage = 1;
let currentSearchType = null;
let currentSearchParams = null;

function viewData(type, payload, page = 1) {
    currentPage = page;
    currentSearchType = type;
    
    // Show loading indicator
    $('#metadata-content').html(`
        <div class="fw-bold mb-2 mt-2 text-warning text-center">
            <div class="spinner-border"></div>
            <div>Loading data...</div>
        </div>
    `);
    
    const token = document.querySelector('meta[name="csrf-token"]').content;
    let url, data;
    
    if (type === 'date') {
        const [start, end] = payload.split(' | ').map(s => s.split(': ')[1].trim());
        url = '/metadata/date-search';
        data = { _token: token, start_date: start, end_date: end, page };
        currentSearchParams = { start, end };
    } else if (type === 'text') {
        url = '/metadata/text-search';
        data = { _token: token, query: payload, page };
        currentSearchParams = { query: payload };
    } else if (type === 'polygon') {
        url = '/metadata/polygon-search';
        data = { _token: token, geojson: payload, page };
        currentSearchParams = { geojson: payload };
        drawSource.clear();
        showSearchPanel();
    }
    
    // Make AJAX request
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        dataType: 'json',
        headers: {
            'X-CSRF-TOKEN': token
        }
    })
    .done(renderResults)
    .fail(handleError);
    map.removeInteraction(draw);
}

function renderResults(response) {
    if (!response.data || response.data.length === 0) {
        $('#metadata-content').html(`
            <div class="fw-bold mb-2 mt-2 text-warning text-center">
                No records found for your search criteria.
            </div>
        `);
        return;
    }
    
    const userEmail = response.current_user_email || null;
    const isAdmin = response.is_admin || false;

    console.log("Admin: " + isAdmin + " | email: " + userEmail);

    const resultsHtml = response.data.map((item, i) => {
        const isOwner = userEmail && item.contact_em && item.contact_em === userEmail;
        const isLoggedIn = !!userEmail;

        let editorsHtml = '';

        if (isLoggedIn && isAdmin) {
            editorsHtml = `
                <div class="btn-group btn-group-sm editors">
                    <i class="bi text-danger bi-trash-fill me-3" onclick="deleteMetadata('${item.identifier}')"></i>
                    <i class="bi text-warning bi-pencil-fill" onclick="editMetadata('${item.identifier}')"></i>
                </div>
            `;
        } else if (isLoggedIn) {
            editorsHtml = `
                <div class="btn-group btn-group-sm editors" title="Only administrators can edit/delete records">
                    <i class="bi text-danger bi-trash-fill me-3 text-muted" style="pointer-events: none;"></i>
                    <i class="bi text-warning bi-pencil-fill text-muted" style="pointer-events: none;"></i>
                </div>
            `;
        }
        
        return `
            <div class="result-row row p-2 ${i % 2 === 0 ? 'bg-dark text-light' : 'bg-light text-dark'}" data-index="${i}" data-identifier="${item.identifier}">
                <div class="col-md">
                    <h5 class="fw-bold mb-2">
                        <span class="title-value">${item.title || 'No title'}</span>
                        ${editorsHtml}
                    </h5>
                    <p class="mb-0" style="font-size:10px; color: #222;">
                        ${item.owner || 'Unknown'} | ${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'No date'}
                    </p>
                </div>
                <div class="col-12 description mt-1" style="font-size:14px; display: none;">
					<hr class="hrs">					
					<p class="mb-2 mt-2">${item.descriptio || ''}</p>					
					<div class="text-center">
						<div class="btn-group btn-group-sm">
							<button 
								type="button" 
								class="btn btn-conn me-2" 
								onclick="getWebsite(this)" 
								data-website="${item.website || ''}">
								Visit Website
							</button>
							<button 
								type="button" 
								class="btn btn-conn me-2" 
								onclick="getContacts(this)" 
								data-email="${item.contact_em || ''}" 
								data-phone="${item.contact_ph || ''}">
								Contact
							</button>
							<button 
								type="button" 
								class="btn btn-conn" 
								onclick="zoomToArea(this)" 
								data-min-lon="${item.min_lon}" 
								data-min-lat="${item.min_lat}" 
								data-max-lon="${item.max_lon}" 
								data-max-lat="${item.max_lat}">
								Zoom
							</button>
						</div>
					</div>
				</div>
            </div>
        `;
    }).join('');
    
    // Build pagination HTML if needed
    const paginationHtml = response.total > response.per_page ? `
        <div class="row mt-2 mb-2" style="width: 80%; margin: 0 auto;">
            <div class="col">
                <nav aria-label="Page navigation">
                    <ul class="pagination justify-content-center flex-wrap">
                        <li class="page-item ${response.current_page === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="return changePage(${response.current_page - 1})">Previous</a>
                        </li>
                        ${Array.from({ length: Math.min(response.last_page, 10) }, (_, i) => {
                            const pageNum = i + 1;
                            return `
                                <li class="page-item ${pageNum === response.current_page ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="return changePage(${pageNum})">${pageNum}</a>
                                </li>
                            `;
                        }).join('')}
                        <li class="page-item ${response.current_page === response.last_page ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="return changePage(${response.current_page + 1})">Next</a>
                        </li>
                    </ul>
                </nav>
                <p class="text-center mb-2 mt-2 fw-bold">
                    Showing ${(response.current_page - 1) * response.per_page + 1}
                    -
                    ${(response.current_page - 1) * response.per_page + response.data.length}
                    of ${response.total} results
                </p>
            </div>
        </div>
    ` : '';
    
    // Update content
    $('#metadata-content').html(resultsHtml + paginationHtml);
    
    
	$('.result-row').on('click', function(e) {
		const row = $(this);
		
		// Don't toggle if clicked on editor buttons or if in editing mode
		if ($(e.target).closest('.editors').length || row.hasClass('editing')) {
		    return;
		}

		const $desc = row.find('.description');
		$('.description').not($desc).slideUp();
		$desc.slideToggle();
	});
}

function deleteMetadata(identifier) {
    if (!confirm("Are you sure you want to delete this metadata?")) return;

    fetch(`/metadata/${identifier}`, {
        method: "DELETE",
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('auth_token')}` // If using API tokens
        },
        credentials: "include" // Crucial for session authentication
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to delete record");
        }
        return data;
    })
    .then(data => {
        alert(data.message);
        loadMetadataRecords(); 
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.message);
    });
}

function editMetadata(identifier) {
    const row = document.querySelector(`.result-row[data-identifier="${identifier}"]`);
    if (!row) return;

    const title = row.querySelector('.title-value')?.textContent.trim() || '';
    const description = row.querySelector('.description p')?.textContent.trim() || '';
    const email = row.querySelector('button[data-email]')?.getAttribute('data-email') || '';
    const phone = row.querySelector('button[data-phone]')?.getAttribute('data-phone') || '';

    document.getElementById('updatetitle').textContent = title;
    document.getElementById('title-metadata').value = title;
    document.getElementById('description-metadata').value = description;
    document.getElementById('email-metadata').value = email;
    document.getElementById('phone-metadata').value = phone;

    const updateModal = new bootstrap.Modal(document.getElementById('updateMetadata'));
    updateModal.show();
    document.getElementById('identifier').value = identifier;
}

function updateMetadata() {
    const title = document.getElementById('title-metadata')?.value.trim();
    const descr = document.getElementById('description-metadata')?.value.trim();
    const email = document.getElementById('email-metadata')?.value.trim();
    const phone = document.getElementById('phone-metadata')?.value.trim();
    const identifier = document.getElementById('identifier')?.value.trim();

    if (!title || !descr || !email || !phone || !identifier) {
        alert('Required fields are missing');
        return;
    }
	console.log("Identifier: " + identifier);
    fetch("/update-metadata", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
        },
        body: JSON.stringify({
            identifier: identifier,
            title: title,
            description: descr,
            email: email,
            phone: phone
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadMetadataRecords(); 
    })
    .catch(error => {
        console.error("Update failed:", error);
        alert("Failed to update metadata.");
    });
}


function changePage(page) {
    if (currentSearchType === 'date') {
        const { start, end } = currentSearchParams;
        viewData('date', `Start Date: ${start} | End Date: ${end}`, page);
    } else if (currentSearchType === 'text') {
        viewData('text', currentSearchParams.query, page);
    } else if (currentSearchType === 'polygon') {
        viewData('polygon', currentSearchParams.geojson, page);
    }
    return false;
}

function handleError(xhr) {
    let errorMsg = 'Error loading data';
    try {
        const res = JSON.parse(xhr.responseText);
        errorMsg = res.message || errorMsg;
    } catch (e) {
        errorMsg = `HTTP ${xhr.status} Error`;
    }
    
    $('#metadata-content').html(`
        <div class="alert alert-danger">
            ${errorMsg}
            <button class="btn btn-sm btn-light float-end" onclick="location.reload()">
                Retry
            </button>
        </div>
    `);
}

/********************** UI Event Handlers ************************/
function checkAndLogDates() {
    const startDate = $('#startrange').val();
    const endDate = $('#endrange').val();

    if (startDate && endDate) {
        $('#search-body').removeClass('hiddens');
        if (!panelVisible) showSearchPanel();
        const payload = `Start Date: ${startDate} | End Date: ${endDate}`;
        viewData('date', payload);
    }
}

/********************** Initialization ************************/
$(document).ready(function() {
    // Initialize panels
    $('#search-panel').show().addClass('slideInFromLeft');
    $('#metadata-base').hide();
    updatePanelControls(true);
    $('#close-metadata').show();
    
    // Load initial metadata count
    loadMetadataRecords();
    
    // Set up event handlers
    $('#close-metadata').click(togglePanel);
    $('#draw').click(setupDrawing);
    
    // Date range handling
    $('#daterange').addClass('hiddens');
    $('#search-body').removeClass('hiddens');
    $('#dateid').click(() => {
        $('#daterange').toggleClass('hiddens');
        $('#search-body').toggleClass('hiddens');
        if (!$('#daterange').hasClass('hiddens') && $('#startrange').val() && $('#endrange').val()) {
            checkAndLogDates();
        }
        if (!panelVisible) showSearchPanel();
        
        drawSource.clear();
    });
    $('#startrange, #endrange').on('change', checkAndLogDates);
    
    // Search functionality
    $('#searchid').click(() => {
        const text = $('#search-value').val().trim();
        if (text.length >= 3) {
            $('#daterange').addClass('hiddens');
            $('#search-body').removeClass('hiddens');
            viewData('text', text);
            drawSource.clear();
        }
    });
    $('#search-value').on('input', function() {
        const text = $(this).val().trim();
        $('#clear-search').toggle(text.length > 0);
        $('#searchid').prop('disabled', text.length < 3);
    });
    $('#clear-search').click(function() {
        $('#search-value').val('');
        $(this).hide();
        $('#searchid').prop('disabled', true);
    });
    
    // Tab functionality
    $('.tab-link').click(function() {
        const target = $(this).data('target');
        $('.tab-pane').addClass('d-none').removeClass('active');
        $('.tab-link').removeClass('active');
        $(target).removeClass('d-none').addClass('active');
        $(this).addClass('active');
    });
    
    $('#uploadfBtn').click(function() {
    	if ($('#dashboard-base').css('display') === 'block') {
		    document.getElementById("dashboard-base").style.display = "none";
		}
		
    	if ($('#process-panel').css('display') === 'block') {
		    document.getElementById("process-panel").style.display = "none";
		}
    
		// Hide search panel first
		$('#search-panel')
		    .removeClass('slideInFromLeft')
		    .addClass('fadeOutLeft');

		setTimeout(() => {
		    $('#search-panel')
		        .hide()
		        .removeClass('fadeOutLeft');

		    // Then show metadata-base
		    $('#metadata-base')
		        .css('display', 'flex')
		        .hide()
		        .removeClass('fadeOutLeft')
		        .show()
		        .addClass('slideInFromLeft');
		    
		    updatePanelControls(false);
		    panelVisible = false;
		}, 400);
	});
    
    $('#dashboardid').click(function () {
		const $dashboard = $('#dashboard-base');
		const $metadata = $('#metadata-base');
		const $search = $('#search-panel');

		// Hide metadata-base if visible
		if ($metadata.is(':visible')) {
		    $metadata.hide();
		}
		
    	if ($('#process-panel').css('display') === 'block') {
		    document.getElementById("process-panel").style.display = "none";
		}

		// Hide search-panel if visible and update control variables
		if ($search.is(':visible')) {
		    $search.hide();
		    updatePanelControls(false);  
		    panelVisible = false;        
		}

		if (document.getElementById('user-manage-table')) {
			onloadUsers();
		}

		// Show dashboard-base
		$dashboard.show();
	});
	
	/****************************** Open layers ******************************/  
	
	// Zoom to full extent
	$('#zoomExtent').click(function () {
		
		view.animate({
		    center: [24.4542, -28.5734],
		    zoom: 6,
		    duration: 5000 // milliseconds
		});
	});

	// Zoom out
	$('#zoomOut').click(function () {
		view.setZoom(view.getZoom() - 1);
	});

	// Zoom in
	$('#zoomIn').click(function () {
		view.setZoom(view.getZoom() + 1);
	});

	// DESA Processing
	$('#process').click(function () {
        const $process = $('#process-panel');
        const $search = $('#search-panel'); 
        const $metadata = $('#metadata-base');

        // Hide metadata-base if visible
        if ($metadata.is(':visible')) {
            $metadata.hide();
        }
        
        if ($('#dashboard-base').css('display') === 'block') {
            document.getElementById("dashboard-base").style.display = "none";
        }

        // Toggle process panel with proper animations
        if ($process.is(':visible')) {
            // Hide process panel, show search panel
            $process.hide();
            
            // Show search panel with animation
            $search
                .css('display', 'flex')
                .hide()
                .removeClass('fadeOutLeft')
                .show()
                .addClass('slideInFromLeft');
            
            console.log("Hide - showing search panel");
            updatePanelControls(true);
            panelVisible = true;
        } else {
            // Hide search panel with animation, show process panel
            $search
                .removeClass('slideInFromLeft')
                .addClass('fadeOutLeft');

            setTimeout(() => {
                $search.hide().removeClass('fadeOutLeft');
                $process.show();
                console.log("Show - showing process panel");
                updatePanelControls(false);
                panelVisible = false;
            }, 400);
        }
    });

	document.getElementById('process-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const data = Object.fromEntries(formData.entries());

        console.log(data);

        // Send to Laravel API
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log(result);
    });
	/****************************** Open layers ******************************/ 
	
	$('#submitFiles').click(async function () {  // Add async here
		const userRoleMeta = document.querySelector('meta[name="user-role"]');
		const currentUserRole = userRoleMeta ? userRoleMeta.content.toLowerCase() : '';

		if (!['admin', 'publisher'].includes(currentUserRole)) {
			alert('You are not authorized to upload metadata.');
			return;
		}
	
		const input = document.getElementById('customFile');
		const file = input.files[0];
		const fileNameDisplay = document.getElementById('file-name');
		const status = document.getElementById('upload-status');

		if (!file) {
		    fileNameDisplay.textContent = 'Please select a file first.';
		    return;
		}

		fileNameDisplay.textContent = file.name;
		status.textContent = 'Uploading...';
		status.classList.remove('text-danger', 'text-success');
		status.classList.add('text-warning');

		const formData = new FormData();
		formData.append('filename', file);
		
		try {
		    // Read file content (if needed for debugging)
		    const fileContent = await file.text();
		    console.log('File content:', fileContent);
		    
		    const response = await fetch("/upload-metadata", {
		        method: 'POST',
		        headers: {
		            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
		            'Accept': 'application/json'
		        },
		        body: formData
		    });

		    if (!response.ok) {
		        const error = await response.json();
		        throw error;
		    }

		    const result = await response.json();
		    status.textContent = result.message || 'Upload successful.';
		    status.classList.remove('text-warning', 'text-danger');
		    status.classList.add('text-success');
		    
			loadMetadataRecords();
		} catch (error) {
		    console.error('Upload error:', error);
		    status.textContent = error.message || 'Upload failed.';
		    status.classList.remove('text-warning', 'text-success');
		    status.classList.add('text-danger');
		}
	});
    
    /********************** Metadata Harvest Source *********************/    
    $('#harvestid').click(function () {
		const harvest = $('#harvest-source').val().trim();

		if (harvest) {
		    loadMetadata(harvest);
		} else {
		    $('#harvest-content').html('<div class="text-danger text-center">Please enter a valid CSW URL.</div>');
		}
	});
});

/********************** Metadata Records Count ************************/

function onloadUsers() {
	const userManageTable = document.getElementById('user-manage-table');
    if (!userManageTable) {
        console.log('User management table not found - likely not an admin user');
        return;
    }

    fetch('/users/list')
        .then(response => response.json())
        .then(users => {
            let html = `
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Organisation</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th>Access</th>
                            </tr>
                        </thead>
                        <tbody>`;

            const availableRoles = ['Admin', 'Publisher', 'Editor', 'Viewer'];
            const accessStatuses = ['Active', 'Suspended', 'Blocked'];

            users.forEach((user, index) => {
            	const rowNumber = index + 1;
                const userRole = user.role ? 
                    user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : '';
                const isAdmin = user.is_admin || userRole === 'Admin';
                const isEditable = !isAdmin;
                const currentAccess = user.access ? 
                    user.access.charAt(0).toUpperCase() + user.access.slice(1).toLowerCase() : 'Active';
                
                html += `
                    <tr data-user-id="${user.id}">
                    	<td>${rowNumber}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.organisation}</td>
                        <td>
                            <select class="form-select role-select" 
                                    data-user-id="${user.id}"
                                    data-user-name="${user.name}" 
                                    ${isEditable ? '' : 'disabled'}>
                                ${availableRoles.map(role => 
                                    `<option value="${role.toLowerCase()}" 
                                     ${user.role === role.toLowerCase() ? 'selected' : ''}>
                                        ${role}
                                    </option>`
                                ).join('')}
                            </select>
                        </td>
                        <td>${new Date(user.created_at).toLocaleString()}</td>
                        <td>
                            <select class="form-select access-select"
                                    data-user-id="${user.id}"
                                    data-user-name="${user.name}"
                                    ${isEditable ? '' : 'disabled'}>
                                ${accessStatuses.map(status => 
                                    `<option value="${status.toLowerCase()}" 
                                     ${user.access === status.toLowerCase() ? 'selected' : ''}>
                                        ${status}
                                    </option>`
                                ).join('')}
                            </select>
                        </td>
                    </tr>`;
            });

            html += `</tbody></table></div>`;
            userManageTable.innerHTML = html;
            
            // Add event listeners
            addSelectListeners('.role-select', 'role');
            addSelectListeners('.access-select', 'access');
        })
        .catch(error => {
        	if (userManageTable) {
                userManageTable.innerHTML = '<div class="alert alert-danger">Error loading users.</div>';
            }
            console.error('Error:', error);
        });
}

function addSelectListeners(selector, field) {
    document.querySelectorAll(`${selector}:not(:disabled)`).forEach(select => {
        select.addEventListener('change', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const newValue = this.value;
            
            if (confirm(`Change ${userName}'s ${field} to ${newValue}?`)) {
                updateUser(userId, { [field]: newValue }, this);
            } else {
                this.value = this._previousValue;
            }
        });
        select._previousValue = select.value;
    });
}

function updateUser(userId, data, element) {
    fetch(`/users/update-role/${userId}`, {  
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Update failed');
        return data;
    })
    .then(data => {
        alert(`Updated successfully!`);
        onloadUsers();
    })
    .catch(error => {
        console.error('Error:', error);
        element.value = element._previousValue;
        alert(error.message);
    });
}

async function loadMetadata(url) {
	const userRoleMeta = document.querySelector('meta[name="user-role"]');
	const currentUserRole = userRoleMeta ? userRoleMeta.content.toLowerCase() : '';

	if (!['admin', 'publisher'].includes(currentUserRole)) {
		alert('You are not authorized to upload metadata.');
		return;
	}
	
	document.getElementById('harvest-content').innerHTML = `<div class = "mb-2 mt-2 fw-bold text-center">
		Please wait while fetching results...	
	</div>`;
	
    try {
        const response = await fetch(`/harvest-metadata?url=${encodeURIComponent(url)}`);
        const contentType = response.headers.get("content-type") || "";
        const rawText = await response.text();
        let data;

        // Determine how to parse the response
        if (contentType.includes("application/json") || url.toLowerCase().endsWith(".json")) {
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.warn("JSON parsing failed:", e);
                data = { raw: rawText };
            }
        } else if (url.toLowerCase().endsWith(".xml") || contentType.includes("xml")) {
            data = { raw: rawText }; 
        } else {
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                data = { raw: rawText };
            }
        }

        // Handle structured result with summary and preview
        if (data.message && data.preview !== undefined) {
            let html = `
                <div class="alert alert-success text-center fw-bold">${data.message}</div>
            `;

			loadMetadataRecords();

        	$('#harvest-content').html(html);
            return;
        }

        // If array of records
        if (Array.isArray(data.records)) {
            const html = data.records.map(rec => `
                <div class="mb-2 border-bottom pb-2">
                    <b>${rec.title || 'Untitled'}</b><br>
                    <span class="text-muted small">${rec.identifier || ''}</span>
                </div>
            `).join('');
            $('#harvest-content').html(html || `<div class="fw-bold text-warning">No metadata records found.</div>`);
            return;
        }

        // Raw fallback
        $('#harvest-content').html(`
            <div class="text-success fw-bold text-center">File was harvested and saved successfully.</div>
            <div class="bg-light border rounded mt-2 p-2" style="max-height: 400px; overflow-y: auto;">
                <pre class="small text-start">${escapeHtml(data.raw)}</pre>
            </div>
        `);
    } catch (error) {
        console.error('Metadata fetch failed:', error);
        $('#harvest-content').html(`
            <div class="alert alert-danger text-center fw-bold">
                Failed to fetch metadata.<br>${escapeHtml(error.message || '')}
            </div>
        `);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function loadMetadataRecords() {
    try {
        const response = await fetch('/metadata/count');
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        
        $('#record-count').html(data.count === 0 ?
            '<span class="text-warning fw-bold">No metadata records found.</span>' :
            `Total number of metadata records: ${data.count}`
        );
    } catch (error) {
        console.error('Error loading metadata records:', error);
        $('#record-count').html('<span class="text-danger fw-bold">Failed to load records.</span>');
    }
}
