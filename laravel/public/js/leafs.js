document.addEventListener('DOMContentLoaded', function () {
	if (!L.Control.Draw) {
		console.error('Leaflet Draw is not loaded!');
		return;
	}

	let leafletMap;

	const mapContainer = document.getElementById('maps');
    
    if (!mapContainer) {
        console.error('Map container #maps not found');
        return;
    }
    else {
    	leafletMap = L.map('maps', {
			center: [-28.4796, 24.6987],
			zoom: 4.3,
			minZoom: 4,
			maxZoom: 4.5
		});	
    }

	/*/ Initialize Leaflet map
	const leafletMap = L.map('maps', {
		center: [-28.4796, 24.6987],
		zoom: 4.3,
		minZoom: 4,
    	maxZoom: 4.5
	});*/

	// Base Layer
	const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; OpenStreetMap contributors'
	}).addTo(leafletMap);

	// --- GeoServer WMS Layers ---
	const provinceLayer = L.tileLayer.wms("https://example.sansa.org.za/geoserver/workspace/wms", {
		layers: 'workspace:Province',
		format: 'image/png',
		transparent: true,
		attribution: 'Province WMS'
	});

	const districtLayer = L.tileLayer.wms("https://example.sansa.org.za/geoserver/workspace/wms", {
		layers: 'workspace:District',
		format: 'image/png',
		transparent: true,
		attribution: 'District WMS'
	});

	const localLayer = L.tileLayer.wms("https://example.sansa.org.za/geoserver/workspace/wms", {
		layers: 'workspace:Local',
		format: 'image/png',
		transparent: true,
		attribution: 'Local WMS'
	});

	// Group layers for switch
	const overlayMaps = {
		"Province": provinceLayer,
		"District": districtLayer,
		"Local": localLayer
	};

	L.control.layers(null, overlayMaps, { collapsed: false }).addTo(leafletMap);

	// --- Draw tools setup ---
	const drawnItems = new L.FeatureGroup();
	leafletMap.addLayer(drawnItems);
	provinceLayer.addTo(leafletMap);

	const drawControl = new L.Control.Draw({
		draw: {
			polygon: false,
			polyline: false,
			circle: false,
			marker: false,
			circlemarker: false,
			rectangle: {
				shapeOptions: {
					color: '#581845',
					weight: 2,
					fillOpacity: 0.2
				}
			}
		},
		edit: {
			featureGroup: drawnItems
		}
	});

	leafletMap.addControl(drawControl);

	// Handle draw rectangle -> populate coordinates
	leafletMap.on(L.Draw.Event.CREATED, function (e) {
		drawnItems.clearLayers();
		drawnItems.addLayer(e.layer);
		const bounds = e.layer.getBounds();

		document.getElementById('min_lon').value = bounds.getWest().toFixed(6);
		document.getElementById('min_lat').value = bounds.getSouth().toFixed(6);
		document.getElementById('max_lon').value = bounds.getEast().toFixed(6);
		document.getElementById('max_lat').value = bounds.getNorth().toFixed(6);
	});

	// --- Optional: ensure map renders fully if inside a hidden tab ---
	const targetDiv = document.querySelector('#manualUploadDiv');
	if (targetDiv) {
		const observer = new MutationObserver(() => {
			if (!targetDiv.classList.contains('d-none')) {
				setTimeout(() => leafletMap.invalidateSize(), 300);
			}
		});
		observer.observe(targetDiv, { attributes: true, attributeFilter: ['class'] });
	}
});

async function getProvinceFromCoordinates(minLat, minLon, maxLat, maxLon) {
    // Parse coordinates
    minLat = parseFloat(minLat);
    minLon = parseFloat(minLon);
    maxLat = parseFloat(maxLat);
    maxLon = parseFloat(maxLon);

    // Validate coordinates
    if (isNaN(minLat) || isNaN(minLon) || isNaN(maxLat) || isNaN(maxLon)) {
        return 'Unknown';
    }

    // Correct centroid calculation
    let centroidLon = parseFloat(minLon) + (parseFloat(maxLon) - parseFloat(minLon)) / 2;
    let centroidLat = parseFloat(minLat) + (parseFloat(maxLat) - parseFloat(minLat)) / 2;

    const url = `https://example.sansa.org.za/geoserver/workspace/wms?service=WMS&version=1.1.1&request=GetFeatureInfo` +
        `&layers=workspace:Province` +
        `&query_layers=workspace:Province` +
        `&bbox=${centroidLon - 0.01},${centroidLat - 0.01},${centroidLon + 0.01},${centroidLat + 0.01}` +
        `&width=101&height=101` +
        `&x=50&y=50` +
        `&info_format=application/json` +
        `&srs=EPSG:4326`;

    console.log("GeoServer request URL:", url);

    try {
        const response = await fetch(url, {
            mode: 'cors'
        });

        if (!response.ok) {
            console.error("GeoServer response not OK:", response.status, response.statusText);
            return 'Unknown';
        }

        const data = await response.json();
        console.log("GeoServer response:", data);

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const province = feature.properties?.ADM1_EN || 
                             feature.properties?.province_name || 
                             feature.properties?.name || 
                             feature.properties?.PROVINCE ||
                             "Unknown";
            return province;
        }
        return 'Unknown';
    } catch (error) {
        console.error("GeoServer province fetch error:", error);
        return 'Unknown';
    }
}

async function submitManualMetadata() {
	const userRoleMeta = document.querySelector('meta[name="user-role"]');
	const currentUserRole = userRoleMeta ? userRoleMeta.content.toLowerCase() : '';

	if (!['admin', 'publisher'].includes(currentUserRole)) {
		alert('You are not authorized to upload metadata.');
		return;
	}

    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            throw new Error('CSRF token not found');
        }

        const minLat = document.getElementById('min_lat')?.value.trim();
        const minLon = document.getElementById('min_lon')?.value.trim();
        const maxLat = document.getElementById('max_lat')?.value.trim();
        const maxLon = document.getElementById('max_lon')?.value.trim();
        let originalProvince = document.getElementById('province')?.value.trim();

        if (!minLat || !minLon || !maxLat || !maxLon || !originalProvince) {
            throw new Error('Required fields are missing');
        }

        // Step 1: Detect province based on coordinates
        const detectedProvince = await getProvinceFromCoordinates(minLat, minLon, maxLat, maxLon);
        
        if (detectedProvince !== 'Unknown' && detectedProvince !== originalProvince) {
			const confirmed = await showProvinceConfirm(`The detected province is "${detectedProvince}", but you entered "${originalProvince}". Do you want to use the detected province?`);
			if (confirmed) {
				originalProvince = detectedProvince;
				document.getElementById('province').value = detectedProvince;
			} else {
				return; // Stop submission if user says No
			}
		}

        // Step 3: Continue with form submission
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value.trim());
        formData.append('category', document.getElementById('category').value.trim());
        formData.append('description', document.getElementById('description').value.trim());
        formData.append('owner', document.getElementById('owner').value.trim());
        formData.append('province', originalProvince);
        formData.append('min_lon', minLon);
        formData.append('min_lat', minLat);
        formData.append('max_lon', maxLon);
        formData.append('max_lat', maxLat);
        formData.append('contact_email', document.getElementById('contact_email').value.trim());
        formData.append('contact_phone', document.getElementById('contact_phone').value.trim());
        formData.append('website', document.getElementById('website').value.trim());

        const thumbnail = document.getElementById('thumbnail').files[0];
        if (thumbnail) formData.append('thumbnail', thumbnail);

        const spatial = document.getElementById('spatial_file').files[0];
        if (spatial) formData.append('spatial_file', spatial);

        const response = await fetch('/upload-manual-metadata', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': token,
                'Accept': 'application/json'
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        alert("Metadata uploaded successfully!");
        
        try {
            const countResponse = await fetch('/metadata/count');
            if (countResponse.ok) {
                const countData = await countResponse.json();
                document.getElementById('record-count').textContent = `Total number of metadata records: ${countData.count}`;
            }
        } catch (err) {
            console.warn('Error fetching updated count:', err);
        }

        return result;
    } catch (error) {
        console.error('Error:', error);
        alert("Error: " + error.message);
        throw error;
    }
}

function showProvinceConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('province-confirm-modal');
        const messageEl = document.getElementById('province-confirm-message');
        const yesBtn = document.getElementById('province-confirm-yes');
        const noBtn = document.getElementById('province-confirm-no');

        messageEl.textContent = message;
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
        };

        const onYes = () => {
            cleanup();
            resolve(true);
        };

        const onNo = () => {
            cleanup();
            resolve(false);
        };

        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
    });
}



	
	
	
	
	
