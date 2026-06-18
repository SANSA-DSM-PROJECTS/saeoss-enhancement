$(document).ready(function () {	
	$('#connect').click(function () {
		const conn = document.getElementById('connect-content');
		const layerList = document.getElementById('layer-list');
		layerList.innerHTML = '';
		document.getElementById('layer-list').style.display = "block";
		document.getElementById('local-server').style.display = "none";
		conn.style.display = "block";

		function formatLayerName(layerName) {
		    const matches = layerName.match(/[_ ](\d{4})[_ ](\d{2})$/);
		    if (!matches) return layerName.replace(/_/g, ' ');

		    const year = matches[1];
		    const monthNum = parseInt(matches[2], 10);
		    const monthNames = [
		        "January", "February", "March", "April", "May", "June",
		        "July", "August", "September", "October", "November", "December"
		    ];
		    const monthName = monthNames[monthNum - 1] || 'Unknown';

		    const baseName = layerName.replace(/[_ ]\d{4}[_ ]\d{2}$/, '').replace(/_/g, ' ');
		    return `${baseName} ${monthName} ${year}`;
		}

		conn.innerHTML = `
		    <div class="text-center">
		        <p class="text-danger fw-bold">Please wait while establishing connection...</p>
		        <div class="spinner-border text-danger"></div>
		    </div>
		`;

		const wmsUrl = 'https://example.sansa.org.za/geoserver/workspace/wms';

		fetch(`${wmsUrl}?service=WMS&request=GetCapabilities`)
		    .then(res => res.text())
		    .then(str => {
		        const parser = new DOMParser();
		        const xml = parser.parseFromString(str, "application/xml");

		        const layersXml = Array.from(xml.querySelectorAll("Layer > Layer"));
		        const layers = layersXml.map(layerEl => {
		            const name = layerEl.querySelector("Name")?.textContent || '';
		            const title = layerEl.querySelector("Title")?.textContent || '';
		            const abstract = layerEl.querySelector("Abstract")?.textContent || 'No abstract available.';
		            const keywords = Array.from(layerEl.querySelectorAll("Keyword")).map(k => k.textContent);
		            const crsList = Array.from(layerEl.querySelectorAll("CRS")).map(c => c.textContent);
		            return { name, title, abstract, keywords, crsList };
		        });

		        if (!layers.length) {
		            conn.innerHTML = '<p class="text-warning fw-bold">No layers found on GeoServer.</p>';
		            return;
		        }

		        conn.innerHTML = '<p class="text-success fw-bold">Layers fetched from GeoServer</p>';
		        conn.style.display = 'none';

		        layerList.innerHTML = layers.map(layer => {
				const layerName = layer.name.includes(':') ? layer.name.split(':')[1] : layer.name;
				const displayName = formatLayerName(layerName);

				const disabledLayers = ['District', 'Local', 'world', 'Province', 'Meta'];
				const isDisabled = disabledLayers.includes(layerName);

				return `
					<div class="form-check mb-2">
						<div class="d-flex align-items-start justify-content-between">
						    <div class="d-flex align-items-start flex-grow-1">
						        <input class="form-check-input me-2 mt-1" type="checkbox" value="${layer.name}" id="${layerName}" ${isDisabled ? 'disabled' : ''}>						            
						        <label 
						            class="form-check-label fw-bold d-flex align-items-center ${isDisabled ? 'text-muted' : ''}" for="${layerName}"> ${displayName}
						        </label>
						    </div>
						    <div class="ms-2">
						        <i id="metadata-${layerName}" class="bi bi-layers ${isDisabled ? 'text-secondary' : 'text-primary'}" style="cursor: ${isDisabled ? 'not-allowed' : 'pointer'};"
						            ${isDisabled ? '' : `data-bs-toggle="modal" data-bs-target="#layerModal" onclick='showLayerMetadata(${JSON.stringify(layer)}, ${JSON.stringify(displayName)})'`}>
						        </i>
						    </div>
						</div>
						<div id="slider-${layerName}" class="mt-2 w-100" style="display:none;">
						    <label>Opacity: <span id="opacity-label-${layerName}">50%</span></label>
						    <input type="range" class="form-range vci-sliders" min="0" max="100" value="50" id="range-${layerName}" ${isDisabled ? 'disabled' : ''}/>
						</div>
					</div>`;
				}).join('');

		        if (!document.getElementById('layerModal')) {
		            document.body.insertAdjacentHTML('beforeend', `
		                <div class="modal fade" id="layerModal" tabindex="-1" aria-labelledby="layerModalLabel" aria-hidden="true">
		                    <div class="modal-dialog">
		                        <div class="modal-content">
		                            <div class="modal-body" id="modalLayerContent">
		                                <h3 class="modal-title fw-bold" id="layerModalLabel">
		                                    Product Name: <span id="modalLayerTitle"></span>
		                                </h3>
		                                <div class="mb-2 mt-2">
		                                    <p><strong>Abstract</strong></p> 
		                                    <div id="modalLayerValue"></div>
		                                    <div class="mt-4" id="additionalMetadata"></div>
		                                </div>
		                            </div>
		                        </div>
		                    </div>
		                </div>
		            `);
		        }

		        layers.forEach(layer => {
		            const layerName = layer.name.includes(':') ? layer.name.split(':')[1] : layer.name;
		            const checkbox = document.getElementById(layerName);
		            const sliderDiv = document.getElementById(`slider-${layerName}`);
		            const slider = document.getElementById(`range-${layerName}`);
		            const opacityLabel = document.getElementById(`opacity-label-${layerName}`);
		            let olLayer = null;

		            checkbox.addEventListener('change', () => {
		                if (checkbox.checked) {
		                    sliderDiv.style.display = 'block';
		                    olLayer = new ol.layer.Tile({
		                        source: new ol.source.TileWMS({
		                            url: wmsUrl,
		                            params: {
		                                'LAYERS': layer.name,
		                                'TILED': true
		                            },
		                            serverType: 'geoserver',
		                            transition: 0
		                        }),
		                        opacity: parseFloat(slider.value) / 100
		                    });
		                    map.addLayer(olLayer);
		                } else {
		                    sliderDiv.style.display = 'none';
		                    if (olLayer) {
		                        map.removeLayer(olLayer);
		                        olLayer = null;
		                    }
		                }
		            });

		            slider.addEventListener('input', () => {
		                const value = parseInt(slider.value, 10);
		                const opacity = value / 100;
		                opacityLabel.textContent = `${value}%`;
		                if (olLayer) {
		                    olLayer.setOpacity(opacity);
		                }
		            });
		        });
		    })
		    .catch(error => {
		        console.error(error);
		        conn.innerHTML = '<p class="text-danger fw-bold">Failed to connect to GeoServer.</p>';
		    });
	});
});

window.showLayerMetadata = function (layer, displayName) {
	document.getElementById('modalLayerTitle').textContent = displayName;
	document.getElementById('modalLayerValue').textContent = layer.abstract;

	const keywordsHtml = layer.keywords?.length
	    ? `<h6 class="fw-bold mt-3">Keywords:</h6>
	       <div class="d-flex flex-wrap gap-1">
	           ${layer.keywords.map(k => `<span class="badge bg-success">${k}</span>`).join('')}
	       </div>`
	    : '';

	const crsHtml = layer.crsList?.length
	    ? `<h6 class="fw-bold mt-4">Supported CRS:</h6>
	       <ul class="list-unstyled">
	           ${layer.crsList.map(crs => `<li>${crs}</li>`).join('')}
	       </ul>`
	    : '';

	document.getElementById('additionalMetadata').innerHTML = `${keywordsHtml}${crsHtml}`;
};
