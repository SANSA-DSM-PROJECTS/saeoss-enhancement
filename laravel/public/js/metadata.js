// ==================== GLOBAL VARIABLES ====================

let currentPage = 1;
let currentQuery = '';
let isAdmin = false;
let drawInteraction = null;
let currentPolygon = null;
let isPolygonSearchActive = false;
let organisationsLoaded = false;
let currentStartDate = null;
let currentEndDate = null;
let currentPolygonFeature = null;
let currentOrganisation = null;
let currentView = 'grid';
let currentResponseData = null;
let currentSearchType = 'default';
let map = null;
let polygonSource = null;
let polygonLayer = null;

// ==================== MAP INITIALIZATION ====================

function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.log('Map container not found on this page - skipping map initialization');
        return null;
    }

    const createXYZLayer = (name, url, attribution, visible = false) => {
        return new ol.layer.Tile({
            properties: { name: name },
            visible: visible,
            source: new ol.source.XYZ({
                url: url,
                attributions: `© ${new Date().getFullYear()} ${attribution}`,
                tileSize: 256,
                crossOrigin: 'anonymous'
            })
        });
    };

    const baseLayers = {
        neighbourhood: createXYZLayer(
            'Neighbourhood',
            'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=85b21f0f345b40c880729c091a6acb6c',
            'Thunderforest',
            false
        ),
        osm: new ol.layer.Tile({
            properties: { name: 'OpenStreetMap' },
            visible: true,
            source: new ol.source.OSM()
        }),
        satellite: createXYZLayer(
            'Satellite',
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            'Esri World Imagery',
            false
        )
    };

    const tempPolygonSource = new ol.source.Vector();
    const tempPolygonLayer = new ol.layer.Vector({
        source: tempPolygonSource,
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(1,174,53,0.2)' }),
            stroke: new ol.style.Stroke({ color: '#01ae35', width: 3 })
        })
    });

    const view = new ol.View({
        projection: 'EPSG:4326',
        center: [24.4542, -28.5734],
        zoom: 4.5,
        minZoom: 4.5,
        maxZoom: 6
    });

    const newMap = new ol.Map({
        target: 'map',
        layers: [
            ...Object.values(baseLayers),
            tempPolygonLayer
        ],
        view: view,
        interactions: [
            new ol.interaction.DragPan(),
            new ol.interaction.PinchZoom(),
            new ol.interaction.MouseWheelZoom(),
            new ol.interaction.DragRotate(),
            new ol.interaction.DragZoom()
        ],
        controls: [
            new ol.control.Zoom(),
            new ol.control.Rotate(),
            new ol.control.Attribution()
        ]
    });

    return { map: newMap, polygonSource: tempPolygonSource, polygonLayer: tempPolygonLayer };
}

// ==================== POLYGON DRAWING & SEARCH ====================

function initializePolygonDrawing() {
    const drawPolygonBtn = document.getElementById('draw-polygon');
    const clearMapsBtn = document.getElementById('clearmaps');
    
    if (!drawPolygonBtn || !clearMapsBtn) {
        console.log('Polygon buttons not found');
        return;
    }
    
    const mapObjects = initializeMap();
    if (!mapObjects) {
        console.log('Map initialization failed');
        return;
    }
    
    map = mapObjects.map;
    polygonSource = mapObjects.polygonSource;
    polygonLayer = mapObjects.polygonLayer;
    
    drawPolygonBtn.addEventListener('click', activatePolygonDrawing);
    clearMapsBtn.addEventListener('click', clearPolygonDrawing);
}

function activatePolygonDrawing() {
    if (!map) return;
    
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
    }
    
    if (polygonSource) {
        polygonSource.clear();
    }
    
    const clearMapsBtn = document.getElementById('clearmaps');
    if (clearMapsBtn) clearMapsBtn.style.display = "block";
    
    drawInteraction = new ol.interaction.Draw({
        type: 'Polygon',
        source: polygonSource,
        style: new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(1,174,53,0.2)' }),
            stroke: new ol.style.Stroke({ color: '#01ae35', width: 3 })
        })
    });
    
    map.addInteraction(drawInteraction);
    
    drawInteraction.on('drawend', (event) => {
        const feature = event.feature;
        currentPolygon = feature.getGeometry();
        currentPolygonFeature = feature;
        
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
        
        currentSearchType = 'polygon';
        performPolygonSearch(currentPolygon, 1);
        showNotification('Polygon drawn! Searching for metadata within this area...', 'success');
    });
    
    showNotification('Draw a polygon on the map to search for metadata', 'info');
}

function clearPolygonDrawing() {
    if (polygonSource) {
        polygonSource.clear();
    }
    
    const clearMapsBtn = document.getElementById('clearmaps');
    if (clearMapsBtn) clearMapsBtn.style.display = "none";
    
    if (drawInteraction && map) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
    currentPolygon = null;
    isPolygonSearchActive = false;
    
    if (!currentQuery && !currentOrganisation && !currentStartDate && !currentEndDate) {
        currentSearchType = 'default';
        loadMetadata(currentPage);
        showNotification('Polygon search cleared', 'info');
    }
}

async function performPolygonSearch(polygon, page = 1) {
    if (!polygon) {
        showNotification('No polygon drawn', 'warning');
        return;
    }
    
    const format = new ol.format.GeoJSON();
    const geojsonFeature = format.writeFeatureObject(new ol.Feature(polygon));
    
    const geojson = {
        type: "Feature",
        geometry: geojsonFeature.geometry,
        properties: {}
    };
    
    const container = document.getElementById('metadata-content');
    if (container) {
        container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Searching by polygon...</p></div>';
    }
    
    currentQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    isPolygonSearchActive = true;
    currentSearchType = 'polygon';
    currentPage = page;
    
    try {
        const response = await fetch('/metadata/polygon-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                geojson: JSON.stringify(geojson),
                page: page
            })
        });
        
        if (!response.ok) throw new Error('Polygon search failed');
        
        const result = await response.json();
        isAdmin = result.is_admin || false;
        currentResponseData = result;
        currentSearchType = 'polygon';
        
        updateRecordsCount(result.total || 0);
        
        if (result.data && result.data.length > 0 && container) {
            displayMetadataCards(result.data, container);
            if (result.last_page > 1) {
                displayPagination(result, page, container);
            }
            showNotification(`Found ${result.total} record(s) within the drawn polygon`, 'success');
        } else if (container) {
            container.innerHTML = '<div class="alert alert-info text-center">No metadata records found within the drawn polygon.</div>';
            showNotification('No records found within the polygon', 'info');
        }
    } catch (error) {
        console.error('Error during polygon search:', error);
        if (container) {
            container.innerHTML = '<div class="alert alert-danger text-center">Error performing polygon search. Please try again.</div>';
        }
        showNotification('Error performing polygon search', 'danger');
    }
}

// ==================== VIEW TOGGLE FUNCTIONS ====================

function initializeViewToggle() {
    const listViewBtn = document.getElementById('list-view-btn');
    const gridViewBtn = document.getElementById('grid-view-btn');
    
    if (!listViewBtn || !gridViewBtn) return;
    
    const savedView = localStorage.getItem('metadataViewPreference');
    if (savedView) {
        currentView = savedView;
        setActiveView(currentView);
    }
    
    listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        localStorage.setItem('metadataViewPreference', 'list');
        setActiveView('list');
        refreshCurrentView();
    });
    
    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        localStorage.setItem('metadataViewPreference', 'grid');
        setActiveView('grid');
        refreshCurrentView();
    });
}

function setActiveView(view) {
    const listViewBtn = document.getElementById('list-view-btn');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const container = document.getElementById('metadata-content');
    
    if (!listViewBtn || !gridViewBtn || !container) return;
    
    if (view === 'list') {
        listViewBtn.classList.add('active', 'btn-danger');
        listViewBtn.classList.remove('btn-outline-success');
        gridViewBtn.classList.remove('active', 'btn-danger');
        gridViewBtn.classList.add('btn-outline-success');
        container.classList.remove('grid-view');
        container.classList.add('list-view');
    } else {
        gridViewBtn.classList.add('active', 'btn-danger');
        gridViewBtn.classList.remove('btn-outline-success');
        listViewBtn.classList.remove('active', 'btn-danger');
        listViewBtn.classList.add('btn-outline-success');
        container.classList.remove('list-view');
        container.classList.add('grid-view');
    }
}

function refreshCurrentView() {
    if (currentResponseData && currentResponseData.data && currentResponseData.data.length > 0) {
        const container = document.getElementById('metadata-content');
        if (container) {
            if (currentView === 'grid') {
                displayGridView(currentResponseData.data, container);
            } else {
                displayListView(currentResponseData.data, container);
            }
            if (currentResponseData.last_page > 1) {
                displayPagination(currentResponseData, currentResponseData.current_page || currentPage, container);
            }
        }
    }
}

// ==================== DISPLAY FUNCTIONS ====================

function displayMetadataCards(metadata, container) {
    window.currentMetadataData = metadata;
    
    if (!metadata || metadata.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center">No records found.</div>';
        return;
    }
    
    container.className = currentView === 'grid' ? 'grid-view' : 'list-view';
    
    if (currentView === 'grid') {
        displayGridView(metadata, container);
    } else {
        displayListView(metadata, container);
    }
}

function displayGridView(metadata, container) {
    let html = '<div class="metadata-grid">';
    
    metadata.forEach((item) => {
        let categoryBadges = '';
        if (item.category) {
            const categories = item.category.split(',').map(c => c.trim());
            const badgeColors = ['secondary', 'primary', 'info', 'success', 'warning', 'danger'];
            categories.forEach((cat, idx) => {
                const colorClass = badgeColors[idx % badgeColors.length];
                categoryBadges += `<span class="badge bg-${colorClass} me-1">${escapeHtml(cat)}</span>`;
            });
        }
        
        const description = item.descriptio ? 
            (item.descriptio.length > 120 ? item.descriptio.substring(0, 120) + '...' : item.descriptio) : 
            'No description available';
        
        html += `
            <div class="metadata-card">
                <div class="card-image">
                    <img src="${escapeHtml(item.thumbnail || 'https://via.placeholder.com/350x200?text=No+Image')}" 
                         alt="${escapeHtml(item.title)}"
                         onerror="this.src='https://via.placeholder.com/350x200?text=Image+Not+Available'">
                </div>
                <div class="card-body">
                    <div class="badge-container">
                        ${categoryBadges || '<span class="badge bg-secondary">Uncategorized</span>'}
                    </div>
                    <h5 class="card-title">${escapeHtml(item.title)}</h5>
                    <p class="card-description">${escapeHtml(description)}</p>
                    <div class="wrapa">
                        <div class="card-meta">
                            <span>${escapeHtml(item.owner || 'Unknown Organization')}</span>
                        </div>
                        <div class="card-meta">
                            <span>${formatDate(item.created_at)}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewDetails('${escapeHtml(item.identifier)}')">
                        <i class="bi bi-info-circle"></i> View Details
                    </button>
                    ${isAdmin ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="editMetadata('${escapeHtml(item.identifier)}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMetadata('${escapeHtml(item.identifier)}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function displayListView(metadata, container) {
    let html = '<div class="metadata-list">';
    
    metadata.forEach((item) => {
        let categoryBadges = '';
        if (item.category) {
            const categories = item.category.split(',').map(c => c.trim());
            const badgeColors = ['secondary', 'primary', 'info', 'success', 'warning', 'danger'];
            categories.forEach((cat, idx) => {
                const colorClass = badgeColors[idx % badgeColors.length];
                categoryBadges += `<span class="badge bg-${colorClass} me-1">${escapeHtml(cat)}</span>`;
            });
        }
        
        const description = item.descriptio ? 
            (item.descriptio.length > 200 ? item.descriptio.substring(0, 200) + '...' : item.descriptio) : 
            'No description available';
        
        html += `
            <div class="metadata-card">
                <div class="card-image">
                    <img src="${escapeHtml(item.thumbnail || 'https://via.placeholder.com/200x150?text=No+Image')}" 
                         alt="${escapeHtml(item.title)}"
                         onerror="this.src='https://via.placeholder.com/200x150?text=Image+Not+Available'">
                </div>
                <div class="card-body">
                    <div class="badge-container">
                        ${categoryBadges || '<span class="badge bg-secondary">Uncategorized</span>'}
                    </div>
                    <h5 class="card-title">${escapeHtml(item.title)}</h5>
                    <p class="card-description">${escapeHtml(description)}</p>
                    <div class="card-meta">
                        <i class="bi bi-building"></i>
                        <span>${escapeHtml(item.owner || 'Unknown Organization')}</span>
                        <span class="separator">•</span>
                        <i class="bi bi-calendar"></i>
                        <span>${formatDate(item.created_at)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewDetails('${escapeHtml(item.identifier)}')">
                        <i class="bi bi-info-circle"></i> View Details
                    </button>
                    ${isAdmin ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="editMetadata('${escapeHtml(item.identifier)}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMetadata('${escapeHtml(item.identifier)}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ==================== PAGINATION FUNCTIONS ====================

function displayPagination(result, currentPageNum, container) {
    const existingPagination = container.querySelector('.pagination-wrapper');
    if (existingPagination) {
        existingPagination.remove();
    }
    
    if (!result || result.last_page <= 1) return;
    
    const startRange = (currentPageNum - 1) * result.per_page + 1;
    const endRange = Math.min(currentPageNum * result.per_page, result.total);
    
    let paginationHtml = `<div class="pagination-wrapper mt-4">
        <div class="pagination-container">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPageNum === 1 ? 'disabled' : ''}">
                    <button class="page-link" data-page="${currentPageNum - 1}" ${currentPageNum === 1 ? 'disabled' : ''}>
                        <i class="bi bi-chevron-left"></i> Previous
                    </button>
                </li>`;
    
    let startPage = Math.max(1, currentPageNum - 2);
    let endPage = Math.min(result.last_page, currentPageNum + 2);
    
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        paginationHtml += `<li class="page-item"><button class="page-link" data-page="1">1</button></li>`;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPageNum ? 'active' : ''}">
                <button class="page-link" data-page="${i}">${i}</button>
            </li>
        `;
    }
    
    if (endPage < result.last_page) {
        if (endPage < result.last_page - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `<li class="page-item"><button class="page-link" data-page="${result.last_page}">${result.last_page}</button></li>`;
    }
    
    paginationHtml += `
                <li class="page-item ${currentPageNum === result.last_page ? 'disabled' : ''}">
                    <button class="page-link" data-page="${currentPageNum + 1}" ${currentPageNum === result.last_page ? 'disabled' : ''}>
                        Next <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
            </ul>
            <div class="page-info">
                Showing ${startRange} - ${endRange} of ${result.total} results
            </div>
        </div>
    </div>`;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.innerHTML = paginationHtml;
    container.appendChild(paginationDiv);
    
    paginationDiv.querySelectorAll('.page-link[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(btn.getAttribute('data-page'));
            if (!isNaN(page)) {
                changePage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

function changePage(page) {
    console.log('Changing page:', page, 'Search type:', currentSearchType);
    currentPage = page;
    
    switch(currentSearchType) {
        case 'organisation':
            if (currentOrganisation) {
                performOrganisationSearch(page);
            } else {
                currentSearchType = 'default';
                loadMetadata(page);
            }
            break;
        case 'polygon':
            if (currentPolygon) {
                performPolygonSearch(currentPolygon, page);
            } else {
                currentSearchType = 'default';
                loadMetadata(page);
            }
            break;
        case 'date':
            if (currentStartDate || currentEndDate) {
                performDateRangeSearch(page);
            } else {
                currentSearchType = 'default';
                loadMetadata(page);
            }
            break;
        case 'search':
            if (currentQuery) {
                performSearch(page);
            } else {
                currentSearchType = 'default';
                loadMetadata(page);
            }
            break;
        default:
            loadMetadata(page);
            break;
    }
}

// ==================== SEARCH & ACCORDION ====================

function initializeSearchAndAccordion() {
    initializeSearch();
    initializeAccordion();
    
    const organisationAccordionBtn = document.querySelector('[data-accordion="Organisation"]');
    if (organisationAccordionBtn) {
        organisationAccordionBtn.addEventListener('click', function() {
            if (!organisationsLoaded) {
                loadOrganisations();
                organisationsLoaded = true;
            }
        });
    }
}

function initializeSearch() {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            currentStartDate = null;
            currentEndDate = null;
            currentOrganisation = null;
            currentQuery = '';
            currentSearchType = 'default';
            currentPage = 1;
            
            document.querySelectorAll('.organisation-item').forEach(item => {
                item.classList.remove('active');
            });
            
            if (searchInput) searchInput.value = '';
            clearPolygonDrawing();
            loadMetadata(1);
        });
    }
    
    if (searchButton) { 
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearchFromInput();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearPolygonDrawing();
                performSearchFromInput();
            }
        });
    }
}

function initializeAccordion() {
    const accordionBtns = document.querySelectorAll('.accordion-btn');
    
    accordionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-accordion');
            const targetContent = document.getElementById(targetId);
            if (!targetContent) return;
            
            const isCurrentlyActive = targetContent.classList.contains('active');
            
            document.querySelectorAll('.accordion-content').forEach(content => {
                content.classList.remove('active');
            });
            
            accordionBtns.forEach(button => {
                button.classList.remove('active');
                button.setAttribute('aria-expanded', 'false');
            });
            
            if (!isCurrentlyActive) {
                targetContent.classList.add('active');
                this.classList.add('active');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

function performSearchFromInput() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (query.length === 0) {
        currentQuery = '';
        currentSearchType = 'default';
        loadMetadata(1);
        return;
    }
    
    if (query.length < 2) {
        showNotification('Please enter at least 2 characters to search', 'warning');
        return;
    }
    
    initializeClearAllFilters();
    
    currentQuery = query;
    currentSearchType = 'search';
    currentPage = 1;
    searchMetadata();
}

// ==================== METADATA API CALLS ====================

async function loadMetadata(page = 1) {
    const container = document.getElementById('metadata-content');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Loading metadata records...</p></div>';
    
    currentPage = page;
    
    try {
        const response = await fetch(`/metadata/all?page=${page}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch metadata');
        
        const result = await response.json();
        isAdmin = result.is_admin || false;
        currentResponseData = result;
        currentSearchType = 'default';
        
        updateRecordsCount(result.total || 0);
        
        if (result.data && result.data.length > 0) {
            displayMetadataCards(result.data, container);
            displayPagination(result, page, container);
        } else {
            container.innerHTML = '<div class="alert alert-info text-center">No metadata records found.</div>';
        }
    } catch (error) {
        console.error('Error loading metadata:', error);
        container.innerHTML = '<div class="alert alert-danger text-center">Error loading metadata. Please try again later.</div>';
    }
}

async function searchMetadata() {
    const searchInput = document.getElementById('search-input');
    currentQuery = searchInput ? searchInput.value.trim() : '';
    
    if (currentQuery.length === 0) {
        loadMetadata(1);
        return;
    }
    
    if (currentQuery.length < 2) {
        showNotification('Please enter at least 2 characters to search', 'warning');
        return;
    }
    
    const container = document.getElementById('metadata-content');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Searching...</p></div>';
    
    try {
        const response = await fetch('/metadata/text-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                query: currentQuery,
                page: currentPage
            })
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const result = await response.json();
        isAdmin = result.is_admin || false;
        currentResponseData = result;
        currentSearchType = 'search';
        
        updateRecordsCount(result.total || 0);
        
        if (result.data && result.data.length > 0) {
            displayMetadataCards(result.data, container);
            displayPagination(result, currentPage, container);
            showNotification(`Found ${result.total} result(s) for "${currentQuery}"`, 'success');
        } else {
            container.innerHTML = `<div class="alert alert-info text-center">No matching records found for "${escapeHtml(currentQuery)}".</div>`;
            showNotification(`No results found for "${currentQuery}"`, 'info');
        }
    } catch (error) {
        console.error('Error searching:', error);
        container.innerHTML = '<div class="alert alert-danger text-center">Error performing search. Please try again.</div>';
        showNotification('Error performing search. Please try again.', 'danger');
    }
}

async function performSearch(page) {
    currentPage = page;
    
    try {
        const response = await fetch('/metadata/text-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                query: currentQuery,
                page: page
            })
        });
        
        const result = await response.json();
        const container = document.getElementById('metadata-content');
        if (!container) return;
        
        currentResponseData = result;
        currentSearchType = 'search';
        
        updateRecordsCount(result.total || 0);
        
        displayMetadataCards(result.data, container);
        displayPagination(result, page, container);
    } catch (error) {
        console.error('Error during search:', error);
    }
}

// ==================== ORGANISATION FUNCTIONS ====================

async function loadOrganisations() {
    const container = document.getElementById('organisation-metadata');
    if (!container) return;
    
    try {
        const response = await fetch('/metadata/organisations', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch organisations');
        
        const organisations = await response.json();
        
        if (organisations.length > 0) {
            displayOrganisations(organisations, container);
        } else {
            container.innerHTML = '<div class="organisation-empty"><i class="bi bi-building-slash"></i>No organisation metadata found</div>';
        }
    } catch (error) {
        console.error('Error loading organisations:', error);
        container.innerHTML = '<div class="organisation-empty text-danger">Error loading organisations</div>';
    }
}

function displayOrganisations(organisations, container) {
    if (!organisations || organisations.length === 0) {
        container.innerHTML = '<div class="organisation-empty"><i class="bi bi-building-slash"></i>No organisation metadata found</div>';
        return;
    }
    
    let html = '<div class="organisation-list">';
    
    organisations.forEach(org => {
        const ownerName = (org.owner || 'Unknown Organisation').trim();
        const recordCount = org.record_count || 0;
        
        html += `
            <div class="organisation-item" data-owner="${escapeHtml(ownerName)}">
                <div class="organisation-name">
                    <i class="bi bi-building"></i>
                    <span>${escapeHtml(ownerName)}</span>
                </div>
                <div class="organisation-count">
                    ${recordCount}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    document.querySelectorAll('.organisation-item').forEach(item => {
        item.addEventListener('click', () => {
            const owner = item.getAttribute('data-owner');
            filterByOrganisation(owner);
        });
    });
}

async function filterByOrganisation(owner) {
    if (!owner) return;
    
    const cleanOwner = owner.trim();
    
    if (currentOrganisation === cleanOwner) {
        currentOrganisation = null;
        document.querySelectorAll('.organisation-item').forEach(item => {
            item.classList.remove('active');
        });
        currentQuery = '';
        currentStartDate = null;
        currentEndDate = null;
        currentSearchType = 'default';
        currentPage = 1;
        clearPolygonDrawing();
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        
        await loadMetadata(1);
        showNotification('Organisation filter cleared', 'info');
        return;
    }
    
    currentOrganisation = cleanOwner;
    currentQuery = '';
    currentStartDate = null;
    currentEndDate = null;
    isPolygonSearchActive = false;
    currentSearchType = 'organisation';
    currentPage = 1;
    
    document.querySelectorAll('.organisation-item').forEach(item => {
        item.classList.remove('active');
        const itemOwner = item.getAttribute('data-owner');
        if (itemOwner === cleanOwner) {
            item.classList.add('active');
        }
    });
    
    const container = document.getElementById('metadata-content');
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Filtering by organisation...</p></div>';
    
    try {
        const response = await fetch('/metadata/organisation-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                owner: cleanOwner,
                page: 1
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error('Filter failed');
        }
        
        const result = await response.json();
        
        isAdmin = result.is_admin || false;
        currentResponseData = result;
        currentSearchType = 'organisation';
        currentPage = 1;
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        
        clearPolygonDrawing();
        
        updateRecordsCount(result.total || 0);
        
        if (result.data && result.data.length > 0) {
            container.innerHTML = '';
            displayMetadataCards(result.data, container);
            if (result.last_page > 1) {
                displayPagination(result, 1, container);
            }
            showNotification(`Found ${result.total} record(s) for "${cleanOwner}"`, 'success');
        } else {
            container.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle fs-4"></i>
                    <h5>No records found for "${escapeHtml(cleanOwner)}"</h5>
                    <p class="mb-0">The organisation name in metadata records might be slightly different.</p>
                    <small class="text-muted">Try checking the organisation list in the left panel.</small>
                </div>
            `;
            showNotification(`No records found for "${cleanOwner}"`, 'warning');
        }
        
    } catch (error) {
        console.error('Error filtering by organisation:', error);
        container.innerHTML = '<div class="alert alert-danger text-center">Error filtering records. Please try again.</div>';
        showNotification('Error filtering records: ' + error.message, 'danger');
    }
}

async function performOrganisationSearch(page) {
    if (!currentOrganisation) return;
    
    currentPage = page;
    const container = document.getElementById('metadata-content');
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Loading organisation data...</p></div>';
    
    try {
        const response = await fetch('/metadata/organisation-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                owner: currentOrganisation,
                page: page
            })
        });
        
        if (!response.ok) throw new Error('Organisation search failed');
        
        const result = await response.json();
        isAdmin = result.is_admin || false;
        currentResponseData = result;
        currentSearchType = 'organisation';
        
        updateRecordsCount(result.total || 0);
        
        if (result.data && result.data.length > 0) {
            container.innerHTML = '';
            displayMetadataCards(result.data, container);
            displayPagination(result, page, container);
            showNotification(`Showing page ${page} of ${result.last_page} for "${currentOrganisation}"`, 'success');
        } else {
            container.innerHTML = `<div class="alert alert-info text-center">No records found for "${escapeHtml(currentOrganisation)}" on page ${page}.</div>`;
        }
        
    } catch (error) {
        console.error('Error during organisation search:', error);
        container.innerHTML = '<div class="alert alert-danger text-center">Error loading organisation data. Please try again.</div>';
        showNotification('Error loading organisation data', 'danger');
    }
}

// ==================== DATE RANGE FUNCTIONS ====================

function initializeDateRange() {
    const applyButton = document.getElementById('apply-date-range');
    const clearButton = document.getElementById('clear-date-range');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (applyButton) {
        applyButton.addEventListener('click', () => {
            const startDate = startDateInput ? startDateInput.value : '';
            const endDate = endDateInput ? endDateInput.value : '';
            
            if (!startDate && !endDate) {
                showNotification('Please select the date to process', 'warning');
                return;
            }
            
            if (startDate && endDate && startDate > endDate) {
                showNotification('Start date cannot be after end date', 'danger');
                return;
            }
            
            currentStartDate = startDate;
            currentEndDate = endDate;
            currentSearchType = 'date';
            currentPage = 1;
            
            clearPolygonDrawing();
            
            if (currentQuery) {
                currentQuery = '';
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
            }
            
            performDateRangeSearch(1);
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            currentStartDate = null;
            currentEndDate = null;
            currentSearchType = 'default';
            currentPage = 1;
            
            if (currentQuery) {
                performSearchFromInput();
            } else {
                loadMetadata(1);
            }
            
            showNotification('Date range cleared', 'info');
        });
    }
}

async function performDateRangeSearch(page = 1) {
    if (!currentStartDate && !currentEndDate) {
        showNotification('No date range selected', 'warning');
        return;
    }
    
    currentPage = page;
    const container = document.getElementById('metadata-content');
    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>Searching by date range...</p></div>';
    
    try {
        const response = await fetch('/metadata/date-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                start_date: currentStartDate,
                end_date: currentEndDate,
                page: page
            })
        });
        
        if (!response.ok) throw new Error('Date range search failed');
        
        const result = await response.json();
        isAdmin = result.is_admin || false;
        currentResponseData = result;
        currentSearchType = 'date';
        
        updateRecordsCount(result.total || 0);
        
        if (result.data && result.data.length > 0) {
            container.innerHTML = '';
            displayMetadataCards(result.data, container);
            displayPagination(result, page, container);
            showNotification(`Found ${result.total} record(s) in the selected date range - Page ${page} of ${result.last_page}`, 'success');
        } else {
            container.innerHTML = '<div class="alert alert-info text-center">No metadata records found in the selected date range.</div>';
            showNotification('No records found in the selected date range', 'info');
        }
    } catch (error) {
        console.error('Error during date range search:', error);
        container.innerHTML = '<div class="alert alert-danger text-center">Error performing date range search. Please try again.</div>';
        showNotification('Error performing date range search: ' + error.message, 'danger');
    }
}

// ==================== VALIDATION FUNCTIONS ====================

function validateDateRange() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        endDateInput.addEventListener('change', function() {
            if (startDateInput.value && this.value && startDateInput.value > this.value) {
                showNotification('End date cannot be before start date', 'warning');
                this.value = '';
            }
        });
        
        startDateInput.addEventListener('change', function() {
            if (endDateInput.value && this.value && this.value > endDateInput.value) {
                showNotification('Start date cannot be after end date', 'warning');
                this.value = '';
            }
        });
    }
}

function initializeClearAllFilters() {
    const clearAllBtn = document.getElementById('clear-all-filters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            currentOrganisation = null;
            currentQuery = '';
            currentStartDate = null;
            currentEndDate = null;
            currentSearchType = 'default';
            currentPage = 1;
            
            document.querySelectorAll('.organisation-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
            
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            
            loadMetadata(1);
            showNotification('All filters cleared', 'success');
        });
    }
}

// ==================== VIEW DETAILS FUNCTIONS ====================

function viewDetails(identifier) {
    if (!identifier) {
        showNotification('No identifier provided', 'warning');
        return;
    }
    
    let metadata = null;
    
    if (window.currentMetadataData) {
        metadata = window.currentMetadataData.find(item => item.identifier === identifier);
    }
    
    if (!metadata) {
        fetchMetadataDetails(identifier);
        return;
    }
    
    showMetadataDetailsModal(metadata);
}

async function fetchMetadataDetails(identifier) {
    try {
        showNotification('Loading metadata details...', 'info');
        
        const response = await fetch(`/api/metadata/${identifier}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                showNotification('Metadata record not found', 'danger');
            } else {
                throw new Error('Failed to fetch metadata');
            }
            return;
        }
        
        const metadata = await response.json();
        showMetadataDetailsModal(metadata);
        
    } catch (error) {
        console.error('Error fetching metadata details:', error);
        showNotification('Error loading metadata details. Please try again.', 'danger');
        
        if (confirm('Unable to load details in modal. Would you like to open the details page?')) {
            window.open(`/metadata/${identifier}`, '_blank');
        }
    }
}

function showMetadataDetailsModal(metadata) {
    if (!metadata) {
        showNotification('No metadata data available', 'warning');
        return;
    }
    
    const modalHtml = `
        <div id="metadataDetailsModal" class="modal fade" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #0a2642, #1e3a5f); color: white;">
                        <h5 class="modal-title">
                            <i class="bi bi-info-circle-fill"></i> Metadata Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="container-fluid">
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h3 class="text-primary">${escapeHtml(metadata.title || 'Untitled')}</h3>
                                    <span class="badge ${metadata.status === 'Active' ? 'bg-success' : 'bg-secondary'}">
                                        ${escapeHtml(metadata.status || 'Unknown')}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 text-primary">
                                        <i class="bi bi-file-text"></i> Basic Information
                                    </h6>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Identifier</label>
                                    <p class="fw-bold">${escapeHtml(metadata.identifier || 'N/A')}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Created</label>
                                    <p>${formatDate(metadata.created_at) || 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Updated</label>
                                    <p>${formatDate(metadata.updated_at) || 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">License</label>
                                    <p>${escapeHtml(metadata.license || 'CC BY 4.0')}</p>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 text-primary">
                                        <i class="bi bi-card-text"></i> Description
                                    </h6>
                                    <p class="mt-2">${escapeHtml(metadata.description || metadata.descriptio || 'No description available.')}</p>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 text-primary">
                                        <i class="bi bi-building"></i> Organization & Contact
                                    </h6>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Organization</label>
                                    <p><strong>${escapeHtml(metadata.organization || metadata.owner || 'Unknown Organization')}</strong></p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Contact Email</label>
                                    <p>
                                        ${metadata.contact_email || metadata.contact_em ? 
                                            `<a href="mailto:${escapeHtml(metadata.contact_email || metadata.contact_em)}">${escapeHtml(metadata.contact_email || metadata.contact_em)}</a>` : 
                                            'Not provided'}
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Contact Phone</label>
                                    <p>${escapeHtml(metadata.contact_phone || metadata.contact_ph || 'Not provided')}</p>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 text-primary">
                                        <i class="bi bi-map"></i> Spatial Information
                                    </h6>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Spatial Resolution</label>
                                    <p>${escapeHtml(metadata.spatial_resolution || '10 m')}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Temporal Extent</label>
                                    <p>${escapeHtml(metadata.temporal_extent || 'N/A')}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">File Format</label>
                                    <p>${escapeHtml(metadata.file_format || 'GeoTIFF')}</p>
                                </div>
                            </div>
                            
                            ${metadata.extent || (metadata.north || metadata.south || metadata.east || metadata.west) ? `
                            <div class="row mb-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 text-primary">
                                        <i class="bi bi-bounding-box-circles"></i> Spatial Extent
                                    </h6>
                                </div>
                                <div class="col-md-3">
                                    <label class="text-muted small">North</label>
                                    <p>${escapeHtml(metadata.extent?.north || metadata.north || 'N/A')}</p>
                                </div>
                                <div class="col-md-3">
                                    <label class="text-muted small">South</label>
                                    <p>${escapeHtml(metadata.extent?.south || metadata.south || 'N/A')}</p>
                                </div>
                                <div class="col-md-3">
                                    <label class="text-muted small">East</label>
                                    <p>${escapeHtml(metadata.extent?.east || metadata.east || 'N/A')}</p>
                                </div>
                                <div class="col-md-3">
                                    <label class="text-muted small">West</label>
                                    <p>${escapeHtml(metadata.extent?.west || metadata.west || 'N/A')}</p>
                                </div>
                            </div>
                            ` : ''}
                            
                            ${metadata.keywords && metadata.keywords.length > 0 ? `
                            <div class="row mb-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 text-primary">
                                        <i class="bi bi-tags"></i> Keywords
                                    </h6>
                                    <div class="mt-2">
                                        ${metadata.keywords.map(keyword => 
                                            `<span class="badge bg-secondary me-1 mb-1" style="cursor: pointer;" onclick="searchByKeyword('${escapeHtml(keyword)}')">
                                                ${escapeHtml(keyword)}
                                            </span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle"></i> Close
                        </button>
                        <button type="button" class="btn btn-primary" onclick="openMetadataPage('${escapeHtml(metadata.identifier)}')">
                            <i class="bi bi-box-arrow-up-right"></i> Open Full Page
                        </button>
                        ${isAdmin ? `
                            <button type="button" class="btn btn-warning" onclick="editMetadata('${escapeHtml(metadata.identifier)}'); closeModal();">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button type="button" class="btn btn-danger" onclick="deleteMetadata('${escapeHtml(metadata.identifier)}'); closeModal();">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('metadataDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modalElement = document.getElementById('metadataDetailsModal');
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: true
    });
    modal.show();
    
    modalElement.addEventListener('hidden.bs.modal', function() {
        modalElement.remove();
    });
}

function openMetadataPage(identifier) {
    if (identifier) {
        window.open(`/metadata/${identifier}`);
    }
}

function closeModal() {
    const modal = document.getElementById('metadataDetailsModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

function searchByKeyword(keyword) {
    closeModal();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = keyword;
    }
    
    currentSearchType = 'search';
    currentPage = 1;
    if (typeof performSearchFromInput === 'function') {
        performSearchFromInput();
    } else if (typeof searchMetadata === 'function') {
        currentQuery = keyword;
        searchMetadata();
    }
    
    showNotification(`Searching for keyword: ${keyword}`, 'info');
}

// ==================== CRUD OPERATIONS ====================

function editMetadata(identifier) {
    alert('Edit metadata: ' + identifier);
}

async function deleteMetadata(identifier) {
    if (confirm('Are you sure you want to delete this metadata record?')) {
        try {
            const response = await fetch(`/metadata/${identifier}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                showNotification('Metadata deleted successfully', 'success');
                switch(currentSearchType) {
                    case 'organisation':
                        if (currentOrganisation) {
                            await performOrganisationSearch(currentPage);
                        } else {
                            await loadMetadata(currentPage);
                        }
                        break;
                    case 'search':
                        if (currentQuery) {
                            await performSearch(currentPage);
                        } else {
                            await loadMetadata(currentPage);
                        }
                        break;
                    case 'date':
                        if (currentStartDate || currentEndDate) {
                            await performDateRangeSearch(currentPage);
                        } else {
                            await loadMetadata(currentPage);
                        }
                        break;
                    case 'polygon':
                        if (currentPolygon) {
                            await performPolygonSearch(currentPolygon, currentPage);
                        } else {
                            await loadMetadata(currentPage);
                        }
                        break;
                    default:
                        await loadMetadata(currentPage);
                        break;
                }
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to delete metadata', 'danger');
            }
        } catch (error) {
            console.error('Error deleting metadata:', error);
            showNotification('Error deleting metadata', 'danger');
        }
    }
}

// ==================== ORGANISATION FILTER FROM MODAL ====================

function checkForOrganisationFilter() {
    const selectedOrganisation = sessionStorage.getItem('selectedOrganisation');
    if (selectedOrganisation) {
        sessionStorage.removeItem('selectedOrganisation');
        filterByOrganisation(selectedOrganisation);
        console.log('Searching for organisation:', selectedOrganisation);
    }
}

// ==================== ADD SEPARATOR STYLES ====================

const separatorStyle = document.createElement('style');
separatorStyle.textContent = `
    .separator {
        margin: 0 8px;
        color: #dee2e6;
    }
    
    .card-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
    }
    
    .pagination-wrapper {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .card-meta {
            flex-direction: column;
            align-items: flex-start;
        }
        .separator {
            display: none;
        }
    }
`;
document.head.appendChild(separatorStyle);

// ==================== UPDATE RECORDS COUNT ====================

function updateRecordsCount(count) {
    const recordsSpan = document.getElementById('metadata-records');
    if (recordsSpan) {
        recordsSpan.textContent = count || 0;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return 'Date not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showNotification(message, type = 'info') {
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.style.cssText = `
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 5000);
    }, 5000);
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('map')) {
        initializePolygonDrawing();
    }
    
    initializeSearchAndAccordion();
    initializeDateRange(); 
    validateDateRange();
    initializeViewToggle();
    initializeClearAllFilters();
    loadMetadata();
    checkForOrganisationFilter();
});
