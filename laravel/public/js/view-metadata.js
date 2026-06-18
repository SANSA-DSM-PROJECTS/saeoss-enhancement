// Get data from the hidden div
const dataContainer = document.getElementById('metadata-data');
const metadataId = dataContainer.dataset.metadataId;
const csrfToken = dataContainer.dataset.csrfToken;
const metadataData = JSON.parse(dataContainer.dataset.metadata);
const isAdmin = dataContainer.dataset.isAdmin === 'true';
const userOrganisation = dataContainer.dataset.userOrganisation;
const metadataOrganisation = dataContainer.dataset.metadataOrganisation;
const north = dataContainer.dataset.north ? parseFloat(dataContainer.dataset.north) : null;
const south = dataContainer.dataset.south ? parseFloat(dataContainer.dataset.south) : null;
const east = dataContainer.dataset.east ? parseFloat(dataContainer.dataset.east) : null;
const west = dataContainer.dataset.west ? parseFloat(dataContainer.dataset.west) : null;

// User permission data
const currentUser = {
    isAdmin: isAdmin,
    userOrganisation: userOrganisation,
    metadataOrganisation: metadataOrganisation
};

console.log('User permissions:', currentUser);
console.log('Extent values:', {north, south, east, west});

let map, vectorSource, vectorLayer, currentFeature;

// Check if user can edit/delete metadata
function checkUserPermissions() {
    const editButton = document.getElementById('editButton');
    const deleteButton = document.getElementById('deleteButton');
    
    // User is admin OR user belongs to the same organisation that owns the metadata
    const canModify = currentUser.isAdmin || 
                     (currentUser.userOrganisation && 
                      currentUser.userOrganisation === currentUser.metadataOrganisation);
    
    if (canModify) {
        // Show the buttons by removing the hidden class
        if (editButton) editButton.classList.remove('action-btn-hidden');
        if (deleteButton) deleteButton.classList.remove('action-btn-hidden');
        console.log('User has permission to edit/delete this metadata');
    } else {
        // Ensure buttons are hidden
        if (editButton) editButton.classList.add('action-btn-hidden');
        if (deleteButton) deleteButton.classList.add('action-btn-hidden');
        console.log('User does NOT have permission to edit/delete this metadata');
    }
}

// Initialize Map - Fixed for OpenLayers v7.4.0
function initMap() {
    // Create vector source and layer with transparent fill (0.3 opacity)
    vectorSource = new ol.source.Vector();
    vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(26, 86, 219, 0.3)' // 0.3 transparent blue fill
            }),
            stroke: new ol.style.Stroke({
                color: '#1a56db',
                width: 3
            })
        })
    });
    
    // Create map with base layer
    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                opacity: 0.7
            }),
            vectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([24.0, -28.0]),
            zoom: 5,
            projection: 'EPSG:3857'
        })
    });
    
    // Load geometry
    loadGeometryFromExtent();
}

// Load geometry from bounding box
function loadGeometryFromExtent() {
    const statusDiv = document.getElementById('mapStatus');
    
    // Check if we have valid extent values
    if (west !== null && south !== null && east !== null && north !== null && 
        !isNaN(west) && !isNaN(south) && !isNaN(east) && !isNaN(north)) {
        
        try {
            // Create a polygon from the bounding box
            const coordinates = [
                [
                    [parseFloat(west), parseFloat(south)],
                    [parseFloat(east), parseFloat(south)],
                    [parseFloat(east), parseFloat(north)],
                    [parseFloat(west), parseFloat(north)],
                    [parseFloat(west), parseFloat(south)]
                ]
            ];
            
            // Create polygon geometry
            const polygon = new ol.geom.Polygon(coordinates);
            polygon.transform('EPSG:4326', 'EPSG:3857');
            
            // Create feature and add to source
            const feature = new ol.Feature(polygon);
            vectorSource.addFeature(feature);
            currentFeature = feature;
            
            // Update status
            statusDiv.innerHTML = '<i class="bi bi-check-circle"></i> Extent loaded successfully';
            statusDiv.style.color = '#10b981';
            
            // Zoom to fit the feature
            setTimeout(() => {
                zoomToFeature();
            }, 500);
            
        } catch (error) {
            console.error('Error creating polygon:', error);
            statusDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error loading extent: ' + error.message;
            statusDiv.style.color = '#ef4444';
        }
    } else {
        statusDiv.innerHTML = '<i class="bi bi-info-circle"></i> No spatial extent data available for this record';
        statusDiv.style.color = '#f59e0b';
        console.log('Extent values:', {west, south, east, north});
    }
}

// Zoom to feature extent
function zoomToFeature() {
    if (currentFeature) {
        const extent = currentFeature.getGeometry().getExtent();
        map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 1000,
            maxZoom: 12
        });
    } else if (west !== null && south !== null && east !== null && north !== null) {
        // Zoom to bounds
        const minX = parseFloat(west);
        const minY = parseFloat(south);
        const maxX = parseFloat(east);
        const maxY = parseFloat(north);
        
        const bottomLeft = ol.proj.fromLonLat([minX, minY]);
        const topRight = ol.proj.fromLonLat([maxX, maxY]);
        
        map.getView().fit([bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]], {
            padding: [50, 50, 50, 50],
            duration: 1000,
            maxZoom: 12
        });
    } else {
        const statusDiv = document.getElementById('mapStatus');
        statusDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> No extent data to zoom to';
        statusDiv.style.color = '#f59e0b';
        setTimeout(() => {
            if (document.getElementById('mapStatus').innerHTML === '<i class="bi bi-exclamation-triangle"></i> No extent data to zoom to') {
                document.getElementById('mapStatus').innerHTML = '';
            }
        }, 3000);
    }
}

// Reset view to default South Africa view
function resetView() {
    map.getView().setCenter(ol.proj.fromLonLat([24.0, -28.0]));
    map.getView().setZoom(5);
    map.getView().setRotation(0);
    const statusDiv = document.getElementById('mapStatus');
    statusDiv.innerHTML = '<i class="bi bi-check-circle"></i> View reset to default';
    statusDiv.style.color = '#10b981';
    setTimeout(() => {
        if (document.getElementById('mapStatus').innerHTML === '<i class="bi bi-check-circle"></i> View reset to default') {
            document.getElementById('mapStatus').innerHTML = '';
        }
    }, 2000);
}

// CRUD Operations
function editMetadata() {
    if (!currentUser.isAdmin && currentUser.userOrganisation !== currentUser.metadataOrganisation) {
        alert('You do not have permission to edit this metadata.');
        return;
    }
    if (metadataId) window.location.href = `/metadata/${metadataId}/edit`;
    else alert('Cannot edit: No metadata identifier found');
}

function deleteMetadata() {
    if (!currentUser.isAdmin && currentUser.userOrganisation !== currentUser.metadataOrganisation) {
        alert('You do not have permission to delete this metadata.');
        return;
    }
    
    if (!metadataId) { 
        alert('Cannot delete: No metadata identifier found'); 
        return; 
    }
    
    if (confirm('Are you sure you want to delete this metadata record? This action cannot be undone.')) {
        fetch(`/metadata/${metadataId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message || data.success) {
                showSuccessMessage('Metadata deleted successfully');
                setTimeout(() => window.location.href = '/metadata', 1500);
            } else {
                alert('Error: ' + (data.error || 'Could not delete metadata'));
            }
        })
        .catch(error => { 
            console.error('Error:', error); 
            alert('An error occurred while trying to delete the metadata');
        });
    }
}

// Modal Functions
function showMoreOptions() { 
    document.getElementById('moreOptionsModal').style.display = 'block'; 
}

function closeModal() { 
    document.getElementById('moreOptionsModal').style.display = 'none'; 
}

function downloadMetadata() {
    if (metadataId) {
        window.location.href = `/metadata/${metadataId}/download`;
    } else {
        alert('No metadata found to download');
    }
    closeModal();
}

function exportToJSON() {
    const dataStr = JSON.stringify(metadataData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `metadata_${metadataId || 'export'}.json`);
    link.click();
    closeModal();
}

function viewHistory() { 
    alert('Version history feature coming soon\n\nThis will show all changes made to this metadata record.'); 
    closeModal(); 
}

function shareMetadata() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: metadataData.title || 'Metadata Record',
            text: `Check out this metadata: ${metadataData.title}`,
            url: url
        }).catch(err => console.log('Share cancelled'));
    } else {
        prompt('Copy this link to share:', url);
    }
    closeModal();
}

function reportIssue() {
    const subject = encodeURIComponent(`Issue with metadata: ${metadataData.title}`);
    const body = encodeURIComponent(`
        Metadata Record: ${metadataData.identifier}
        Title: ${metadataData.title}
        
        Issue Description:
        
        
        ---
        Please describe the issue above.
    `);
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
    closeModal();
}

function searchByKeyword(keyword) {
    if (confirm(`Search for other metadata with keyword: "${keyword}"?`)) {
        window.location.href = `/metadata?keyword=${encodeURIComponent(keyword)}`;
    }
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.innerHTML = `<i class="bi bi-check-circle"></i> ${message}`;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// Initialize map and check permissions when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    checkUserPermissions();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('moreOptionsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
