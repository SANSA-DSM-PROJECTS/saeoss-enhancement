const neighbourhood = new ol.layer.Tile({
    name: '<b>Neighbourhood</b>',
    visible: true,
    source: new ol.source.XYZ({
        url: 'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=85b21f0f345b40c880729c091a6acb6c',
        attributions: `© ${new Date().getFullYear()} Microsoft, © ${new Date().getFullYear()} DigitalGlobe`,
        tileSize: 256
    })
});    

const osm = new ol.layer.Tile({
    visible: false,
	source: new ol.source.OSM()
});

const satellite = new ol.layer.Tile({
    visible: false,
	source: new ol.source.XYZ({
    	url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: `© ${new Date().getFullYear()} ESRI World Imagery, © ${new Date().getFullYear()}`,
  	})
});

const vci_raster = new ol.layer.Tile({
    visible: true,
    source: new ol.source.TileWMS({
        url: 'http://localhost:8080/geoserver/workspace/wms',
        params: {
            'LAYERS': 'workspace:VCI_2024_03',
            'TRANSPARENT': true
        },
        crossOrigin: 'anonymous'
    })
});

//process();

const province = new ol.layer.Tile({
    visible: true,
    source: new ol.source.TileWMS({
        url: 'http://localhost:8080/geoserver/workspace/wms',
        params: {
            'LAYERS': 'workspace:Province',
            'TRANSPARENT': true
        },
        crossOrigin: 'anonymous'
    })
});

/***********************************************************************************/



/***********************************************************************************/

let vciLayer, ndviLayer, rasterLayer;
let selectedProvince = null;
let map, view;
let chart; // Added chart variable for global access

proj4.defs("EPSG:32735", "+proj=utm +zone=35 +south +datum=WGS84 +units=m +no_defs");
ol.proj.proj4.register(proj4);

view = new ol.View({
    projection: 'EPSG:4326',
    center: [24.4542, -28.5734],
    zoom: 6.3,
    minZoom: 6.3
});

map = new ol.Map({
    target: 'map',
    layers: [neighbourhood, osm, satellite, province],
    view: view,
    interactions: [
        new ol.interaction.DragPan(),
        new ol.interaction.PinchZoom(),
        new ol.interaction.MouseWheelZoom(),
        new ol.interaction.DragRotate(),
        new ol.interaction.DragZoom()
    ]
});

const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

function analyses(long, lat, prov){
	const panel = document.getElementById('accordion');	
	const head = document.getElementById('analyses-header');
	const content = document.getElementById('accordion-analyses');
	panel.style.display = "block";
	
	head.innerHTML = `<div class="d-flex justify-content-between align-items-center">
        <div>
            Province: ${prov}
        </div>
        <div class="d-flex align-items-center">
            <span class="me-2">Download As:</span>
            <div class="btn-group btn-group-sm"> 
                <button type="button" class="btn btn-head" id="downloadCsvBtn"> CSV </button>
                <button type="button" class="btn btn-head" id="downloadJPEGBtn"> JPEG </button>
            </div>
        </div>
    </div>`;
    
	content.innerHTML = `
        <div class="text-center">
            <p class="text-danger fw-bold">Please wait while loading...</p>
            <div class="spinner-border text-danger"></div>
        </div>
    `;	    
}

map.on('click', async function (e) {
    const [lng, lat] = e.coordinate;

    const accordion = document.getElementById('accordion');	
    const ndvi = document.getElementById('ndvi-content');	
    const evi = document.getElementById('evi-content');

    accordion.style.display = "block";

    const loadingHtml = `
        <div class="text-center">
            <p class="text-danger fw-bold">Please wait while loading...</p>
            <div class="spinner-border text-danger"></div>
        </div>
    `;

    evi.innerHTML = loadingHtml;
    ndvi.innerHTML = loadingHtml;
    
    setTimeout(() => {
    	document.getElementById('close-analyses').style.display = "block";
    }, 800);

    eviChart(lng, lat);
    ndviChart(lng, lat);
});

async function eviChart(lng, lat) {
    const evi = document.getElementById('evi-content');
    
    if ($('#national-evi').css('display') === 'none') {
		document.getElementById("national-evi").style.display = "block";
		document.getElementById("national-evi").style.display = "block";
	}

    try {
        const response = await fetch('/get-province-vci', {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ lat, lng })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data?.province) {
            selectedProvince = data.province;

            evi.innerHTML = `
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2 fw-bold mt-2">
                        <button id = "national-evi" class="national-view">View National Overview</button>
                        <div class="d-flex align-items-center">
                            <span class="me-2">Download As:</span>
                            <div class="btn-group btn-group-sm"> 
                                <button type="button" class="btn btn-lib" id="downloadCsvBtn"> CSV </button>
                                <button type="button" class="btn btn-lib" id="downloadJPEGBtn"> JPEG </button>
                            </div>
                        </div>
                    </div>
                    <div style="position: relative; height:400px; width:100%">
                        <canvas id="vciChart"></canvas>
                    </div>
                    <div class = "mt-3 text-center">Selected: ${data.province} Province</div>
                </div>`;
                
            document.getElementById('national-evi').addEventListener('click', async () => {
				const content = document.getElementById('evi-content');

				content.innerHTML = `
					<div class="text-center mb-3">
						<p class="text-danger fw-bold">Loading national data...</p>
						<div class="spinner-border text-danger"></div>
					</div>
				`;
				
				try {
					const response = await fetch('/get-national-data');
					const result = await response.json();

					const { labels, datasets } = result.vci_data;

					content.innerHTML = `
				        <div>
				            <div class="d-flex justify-content-between align-items-center mb-2 fw-bold mt-2">
				                <div>
				                    <span class="me-2">Download As:</span>
				                    <div class="btn-group btn-group-sm"> 
				                        <button type="button" class="btn btn-lib" id="nationalCSV"> CSV </button>
				                        <button type="button" class="btn btn-lib" id="nationalJPEG"> JPEG </button>
				                    </div>
				                </div>
				                <div class="d-flex align-items-center">
				                 	National Overview  
				                </div>
				            </div>
				            <div style="position: relative; height:400px; width:100%">
				            	<canvas id="nationalChart"></canvas>
				            </div>
				        </div>`;
				    
					//content.innerHTML = `<canvas id="nationalChart" style="height: 400px; width: auto;"></canvas>`;
					const ctx = document.getElementById('nationalChart').getContext('2d');

					if (window.chart) {
						window.chart.destroy();
					}

					window.chart = new Chart(ctx, {
						type: 'line',
						data: {
						    labels: labels,
						    datasets: datasets.map((ds, index) => ({
						        label: ds.label,
						        data: ds.data,
						        borderColor: getColor(index),
						        backgroundColor: getColor(index, 0.1),
						        fill: false,
						        tension: 0.3
						    }))
						},
						options: {
						    responsive: true,
						    maintainAspectRatio: false,
						    plugins: {
						        title: {
						            display: true,
						            text: 'National Enhanced Condition Index (EVI)'
						        },
						        tooltip: {
						            mode: 'index',
						            intersect: false,
						            callbacks: {
						                label: context => {
						                    const val = context.parsed.y;
						                    return `${context.dataset.label}: ${val !== null ? val.toFixed(2) : 'N/A'}`;
						                }
						            }
						        },
						        legend: {
						            position: 'top',
						            align: 'center', 
									labels: {
										boxWidth: 12,     
										padding: 10,      
										font: {
											size: 10      
										},
										usePointStyle: true, 
										pointStyle: 'circle'
									}
						        }
						    },
						    scales: {
						        x: {
						            type: 'time',
						            time: {
						                unit: 'month',
				        				tooltipFormat: 'MMMM yyyy'
						            },
						            title: {
						                display: true,
						                text: 'Enhanced Condition Index Date'
						            }
						        },
						        y: {
						            beginAtZero: false,
						            title: {
						                display: true,
						                text: 'EVI Value'
						            }
						        }
						    }
						}
					});
					
					setTimeout(adjustCardWidth, 100);
					window.addEventListener('resize', adjustCardWidth);

				} catch (error) {
					console.error('National data fetch error:', error);
					content.innerHTML = `<p class="text-danger fw-bold">Failed to load national data.</p>`;
				}

				function getColor(index, alpha = 1) {
					const colors = [
						'rgb(255, 99, 132)',
						'rgb(54, 162, 235)',
						'rgb(255, 206, 86)',
						'rgb(75, 192, 192)',
						'rgb(153, 102, 255)',
						'rgb(255, 159, 64)',
						'rgb(0, 128, 0)',
						'rgb(128, 0, 128)',
						'rgb(0, 0, 128)'
					];
					const baseColor = colors[index % colors.length];
					return alpha < 1
						? baseColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
						: baseColor;
				}
			});

            if (data.vci_data?.length) {
                createLineChart(data.vci_data, "vciChart", "Enhanced Vegetation Index (EVI)", "EVI Value");
            } else {
                evi.innerHTML += `<p class="mt-3">No VCI data available for this location</p>`;
            }
        } else {
            evi.innerHTML = `<div class='text-center text-danger fw-bold'>
                No dataset found in this area / outside boundary of South Africa
            </div>`;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        evi.innerHTML = `<div class="alert alert-danger">
            <strong>Error:</strong> ${error.message}<br>
            The application will refresh, then try again
        </div>`;
        
        setTimeout(() => {
    		window.location.reload(true);
    	}, 1200);
    }
}
				
function adjustCardWidth() {
	const accordion = document.getElementById('accordion');
	const canvas = document.getElementById('nationalChart');
	
	if (canvas && accordion) {
		const chartWidth = canvas.width;
		
		const requiredWidth = chartWidth + 40;
		
		const maxWidth = window.innerWidth * 0.5;
		
		accordion.style.width = Math.min(requiredWidth, maxWidth) + 'px';
		
		console.log("chartWidth: " + chartWidth + " | requiredWidth" + requiredWidth + " | maxWidth: " + maxWidth);
		
		if (window.chart) {
			setTimeout(() => window.chart.resize(), 50);
		}
	}
}

/********************************************************************************************************************************/

async function ndviChart(lng, lat) {
    const ndvi = document.getElementById('ndvi-content');

    try {
        const response = await fetch('/get-province-ndvi', {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ lat, lng })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data?.province) {
            selectedProvince = data.province;

            ndvi.innerHTML = `
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2 fw-bold mt-2">
                        <button id="national-ndvi" class="national-view">View National Overview</button>
                        <div class="d-flex align-items-center">
                            <span class="me-2">Download As:</span>
                            <div class="btn-group btn-group-sm"> 
                                <button type="button" class="btn btn-lib" id="downloadCsvBtn"> CSV </button>
                                <button type="button" class="btn btn-lib" id="downloadJPEGBtn"> JPEG </button>
                            </div>
                        </div>
                    </div>
                    <div style="position: relative; height:400px; width:100%">
                        <canvas id="ndviChart"></canvas> 
                    </div>
                    <div class="mt-3 text-center">Selected: ${data.province} Province</div>
                </div>`;
                
            // Add event listener for national NDVI view
            document.getElementById('national-ndvi').addEventListener('click', async () => {
                const content = document.getElementById('ndvi-content'); // Changed to ndvi-content

                content.innerHTML = `
                    <div class="text-center mb-3">
                        <p class="text-danger fw-bold">Loading national data...</p>
                        <div class="spinner-border text-danger"></div>
                    </div>
                `;
                
                try {
                    const response = await fetch('/get-national-ndvi-data'); // Changed to NDVI-specific endpoint
                    const result = await response.json();

                    const { labels, datasets } = result.ndvi_data; // Changed to ndvi_data
                    alert(result.ndvi_data);

                    content.innerHTML = `
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2 fw-bold mt-2">
                                <div>
                                    <span class="me-2">Download As:</span>
                                    <div class="btn-group btn-group-sm"> 
                                        <button type="button" class="btn btn-lib" id="nationalNDVICSV"> CSV </button>
                                        <button type="button" class="btn btn-lib" id="nationalNDVIJPEG"> JPEG </button>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center">
                                    National Overview  
                                </div>
                            </div>
                            <div style="position: relative; height:400px; width:100%">
                                <canvas id="nationalNDVIChart"></canvas>
                            </div>
                        </div>`;
                    
                    const ctx = document.getElementById('nationalNDVIChart').getContext('2d');

                    // Destroy existing chart if it exists
                    if (window.ndviChartInstance) {
                        window.ndviChartInstance.destroy();
                    }

                    window.ndviChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: datasets.map((ds, index) => ({
                                label: ds.label,
                                data: ds.data,
                                borderColor: getColor(index),
                                backgroundColor: getColor(index, 0.1),
                                fill: false,
                                tension: 0.3
                            }))
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'National Normalized Difference Vegetation Index (NDVI)' // Changed title
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                    callbacks: {
                                        label: context => {
                                            const val = context.parsed.y;
                                            return `${context.dataset.label}: ${val !== null ? val.toFixed(2) : 'N/A'}`;
                                        }
                                    }
                                },
                                legend: {
                                    position: 'top',
                                    align: 'center', 
                                    labels: {
                                        boxWidth: 12,     
                                        padding: 10,      
                                        font: {
                                            size: 10      
                                        },
                                        usePointStyle: true, 
                                        pointStyle: 'circle'
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    type: 'category',
                                    time: {
                                        unit: 'month',
                                        tooltipFormat: 'MMMM yyyy'
                                    },
                                    title: {
                                        display: true,
                                        text: 'NDVI Date' // Changed label
                                    }
                                },
                                y: {
                                    beginAtZero: false,
                                    title: {
                                        display: true,
                                        text: 'NDVI Value' // Changed label
                                    }
                                }
                            }
                        }
                    });

					function getColor(index, alpha = 1) {
						const colors = [
							'rgb(255, 99, 132)',
							'rgb(54, 162, 235)',
							'rgb(255, 206, 86)',
							'rgb(75, 192, 192)',
							'rgb(153, 102, 255)',
							'rgb(255, 159, 64)',
							'rgb(0, 128, 0)',
							'rgb(128, 0, 128)',
							'rgb(0, 0, 128)'
						];
						const baseColor = colors[index % colors.length];
						return alpha < 1
							? baseColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
							: baseColor;
					}
                    
                    document.getElementById('nationalNDVICSV').addEventListener('click', () => {
                        nationalNDVICSV();
                    });
                    
                    document.getElementById('nationalNDVIJPEG').addEventListener('click', () => {
                        nationalNDVIJPEG();
                    });
                    
                } catch (error) {
                    console.error('National NDVI data fetch error:', error);
                    content.innerHTML = `<p class="text-danger fw-bold">Failed to load national NDVI data.</p>`;
                }
            });

            if (data.ndvi_data?.length) {
                createLineChart(data.ndvi_data, "ndviChart", "Normalized Difference Vegetation Index (NDVI)", "NDVI Value");
            } else {
                ndvi.innerHTML += `<p class="mt-3">No NDVI data available for this location</p>`;
            }
        } else {
            ndvi.innerHTML = `<div class='text-center text-danger fw-bold'>
                No dataset found in this area / outside boundary of South Africa
            </div>`;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        ndvi.innerHTML = `<div class="alert alert-danger">
            <strong>Error:</strong> ${error.message}<br>
            The application will refresh, then try again
        </div>`;
        
        setTimeout(() => {
            window.location.reload(true);
        }, 1200);
    }
}

// Add these functions for NDVI-specific downloads
function nationalNDVICSV() {
    const nationalCanvas = document.getElementById("nationalNDVIChart");
    if (!nationalCanvas) {
        alert('National NDVI chart not available for download');
        return;
    }
    
    const nationalChart = Chart.getChart("nationalNDVIChart");
    if (!nationalChart) {
        alert('No national NDVI chart data available for download');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    csvContent += "Date," + nationalChart.data.datasets.map(ds => ds.label).join(",") + "\n";

    // Rows
    nationalChart.data.labels.forEach((label, i) => {
        let row = [label];
        nationalChart.data.datasets.forEach(ds => {
            row.push(ds.data[i] !== null && ds.data[i] !== undefined ? ds.data[i] : 'N/A');
        });
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "national_ndvi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function nationalNDVIJPEG() {
    const originalCanvas = document.getElementById("nationalNDVIChart");
    if (!originalCanvas) {
        alert('National NDVI chart not available for download');
        return;
    }
    
    const nationalChart = Chart.getChart("nationalNDVIChart");
    if (!nationalChart) {
        alert('No national NDVI chart data available for download');
        return;
    }
    
    const chartWidth = originalCanvas.width;
    const chartHeight = originalCanvas.height;
    const footerHeight = 50;
    const totalHeight = chartHeight + footerHeight;

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = chartWidth;
    compositeCanvas.height = totalHeight;

    const ctx = compositeCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chartWidth, totalHeight);

    // Chart
    ctx.drawImage(originalCanvas, 0, 0);

    // Watermark (center)
    const watermarkText = "© SANSA Dashboard";
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.textAlign = 'center';
    ctx.fillText(watermarkText, chartWidth / 2, chartHeight / 2);

    const logo = new Image();
    logo.crossOrigin = 'Anonymous';
    logo.src = 'images/SANSA_Logo.jpg';

    logo.onload = () => {
        const logoWidth = 120;
        const logoHeight = 40;
        const logoX = 10;
        const logoY = chartHeight + 5;

        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('National NDVI Overview', chartWidth / 2, chartHeight + 30);

        // Date (right)
        const now = new Date();
        const dateText = now.toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, chartWidth - 10, chartHeight + 30);

        const link = document.createElement('a');
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.download = 'national_ndvi_' + now.toISOString().slice(0, 10) + '.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    logo.onerror = () => {
        console.warn('Logo failed to load. Proceeding without logo.');

        // Still add title
        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('National NDVI Overview', chartWidth / 2, chartHeight + 30);

        const now = new Date();
        const dateText = now.toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, chartWidth - 10, chartHeight + 30);

        const link = document.createElement('a');
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.download = 'national_ndvi_' + now.toISOString().slice(0, 10) + '.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

function getColor(index, alpha = 1) {
	const colors = [
		'rgb(255, 99, 132)',
		'rgb(54, 162, 235)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(0, 128, 0)',
		'rgb(128, 0, 128)',
		'rgb(0, 0, 128)'
	];
	const baseColor = colors[index % colors.length];
	return alpha < 1
		? baseColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
		: baseColor;
}

/********************************************************************************************************************************/

function createLineChart(data, canvasId, title, yLabel) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const years = [...new Set(data.map(item => item.date.substring(0, 4)))];

    const datasets = years.map(year => {
        const yearData = data.filter(item => item.date.startsWith(year));
        return {
            label: year,
            data: yearData.map(item => item.value),
            borderColor: getRandomColor(),
            backgroundColor: 'rgba(0, 0, 0, 0)',
            tension: 0.1
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = context.parsed.y;
                            const label = context.dataset.label || '';
                            return typeof value === 'number'
                                ? `${label}: ${value.toFixed(2)}`
                                : `${label}: N/A`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: yLabel
                    }
                }
            }
        }
    });
}

function getRandomColor() {
    return '#' + Array.from({ length: 6 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
}

const slider = document.getElementById("opacity-vci");
const valueDisplay = document.getElementById("slider-value");

const ndSlider = document.getElementById("opacity-ndvi");
const ndviDisplay = document.getElementById("slider-ndvi");

function updateSliderValue() {
    const val = slider.value;
    const percent = (val / slider.max) * 100;

    const sliderWidth = slider.offsetWidth;
    const labelPos = (percent / 100) * sliderWidth;

    valueDisplay.style.left = `${labelPos}px`;
    valueDisplay.textContent = `${val}%`;
    
    if (vciLayer) {
        vciLayer.setOpacity(val / 100);
    }
    
    
    const vals = ndSlider.value;
    const percents = (vals / ndSlider.max) * 100;

    const sliderWidths = ndSlider.offsetWidth;
    const labelPoss = (percents / 100) * sliderWidths;

    ndviDisplay.style.left = `${labelPoss}px`;
    ndviDisplay.textContent = `${vals}%`;
    
    if (ndviLayer) {
        ndviLayer.setOpacity(vals / 100);
    }
}

slider.addEventListener("input", updateSliderValue);
ndSlider.addEventListener("input", updateSliderValue);

window.addEventListener("load", updateSliderValue);

function updateMapLayer(geojsonData, year, month, actlayer) {
	if(actlayer == 'evi'){
		if (vciLayer) {
		    map.removeLayer(vciLayer);
		}
		
		if (rasterLayer) {
		    map.removeLayer(rasterLayer);
		}

		const vectorSource = new ol.source.Vector({
		    features: new ol.format.GeoJSON().readFeatures(geojsonData, {
		        dataProjection: 'EPSG:32735',
		        featureProjection: 'EPSG:4326'
		    })
		});

		const styleFunction = feature => {
		    const vciValue = parseFloat(feature.get('vci_value'));
		    return new ol.style.Style({
		        fill: new ol.style.Fill({
		            color: getColor(vciValue),
		            opacity: 0.5
		        }),
		        stroke: new ol.style.Stroke({
		            color: '#555',
		            width: 1
		        })
		    });
		};

		vciLayer = new ol.layer.Vector({
		    source: vectorSource,
		    style: styleFunction,
		    zIndex: 10
		});
		
		map.addLayer(vciLayer);
		
		slider.value = 50;
		updateSliderValue();
		
		const layerName = `workspace:EVI_${year}_${month}`; 
		checkLayerExists(layerName).then(exists => {
		    if (exists) {
		        showPopupAlert("Wait while data is loading", "success");

		        rasterLayer = new ol.layer.Image({
		            source: new ol.source.ImageWMS({
		                url: 'https://example.sansa.org.za/geoserver/workspace/wms',
		                params: { LAYERS: layerName, TILED: true },
		                ratio: 1,
		                serverType: 'geoserver'
		            }),
		            opacity: 0.8,
		    		zIndex: 10
		        });

		        map.addLayer(rasterLayer);
		    } else {
		        const monthName = getMonthName(month);
		        showPopupAlert(`No EVI national distribution data available for ${monthName} ${year}`, "error"); 
		    }
		});
    }
    else {
    	if (ndviLayer) {
		    map.removeLayer(ndviLayer);
		}
		
		if (rasterLayer) {
	    	map.removeLayer(rasterLayer);
		}

		const vectorSource = new ol.source.Vector({
		    features: new ol.format.GeoJSON().readFeatures(geojsonData, {
		        dataProjection: 'EPSG:32735',
		        featureProjection: 'EPSG:4326'
		    })
		});

		const styleFunction = feature => {
		    const ndviValue = parseFloat(feature.get('ndvi_value'));
		    return new ol.style.Style({
		        fill: new ol.style.Fill({
		            color: getColor(ndviValue),
		            opacity: 0.5
		        }),
		        stroke: new ol.style.Stroke({
		            color: '#555',
		            width: 1
		        })
		    });
		};

		ndviLayer = new ol.layer.Vector({
		    source: vectorSource,
		    style: styleFunction,
		    zIndex: 10
		});
		
		map.addLayer(ndviLayer);
		
		ndSlider.value = 50;
		updateSliderValue();
		
		const layerName = `workspace:NDVI_${year}_${month}`; 
		checkLayerExists(layerName).then(exists => {
		    if (exists) {
		        showPopupAlert("Wait while data is loading", "success");

		        rasterLayer = new ol.layer.Image({
		            source: new ol.source.ImageWMS({
		                url: 'https://example.sansa.org.za/geoserver/workspace/wms',
		                params: { LAYERS: layerName, TILED: true },
		                ratio: 1,
		                serverType: 'geoserver'
		            }),
		            opacity: 0.8,
		    		zIndex: 10
		        });

		        map.addLayer(rasterLayer);
		    } else {
		        const monthName = getMonthName(month);
		        showPopupAlert(`No NDVI national distribution data available for ${monthName} ${year}`, "error"); 
		    }
		});
    }
}

/**********************************************************************/

// Replace your entire event delegation section with this:
document.body.addEventListener('click', function(e) {
    // For VCI/NDVI chart downloads
    if (e.target.id === 'downloadCsvBtn' && e.target.closest('#evi-content, #ndvi-content')) {
        const canvasId = e.target.closest('#evi-content') ? 'vciChart' : 'ndviChart';
        const chartType = e.target.closest('#evi-content') ? 'EVI' : 'NDVI';
        downloadCsv(canvasId, chartType);
    } 
    else if (e.target.id === 'downloadJPEGBtn' && e.target.closest('#evi-content, #ndvi-content')) {
        const provinceName = selectedProvince || 'Unknown';
        const canvasId = e.target.closest('#evi-content') ? 'vciChart' : 'ndviChart';
        downloadJPEG(provinceName, canvasId);
    }
    // For national chart downloads
    else if (e.target.id === 'nationalCSV') {
        nationalCSV();
    } else if (e.target.id === 'nationalJPEG') {
        nationalJPEG();
    }
});

// Update the downloadCsv function:
function downloadCsv(canvasId, chartType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        alert('Chart not available for download');
        return;
    }
    
    const chartInstance = Chart.getChart(canvasId);
    if (!chartInstance) {
        alert('No chart data available for download');
        return;
    }
    
    try {
        const csvRows = [];
        // Add headers
        csvRows.push(['Month', ...chartInstance.data.datasets.map(ds => ds.label)]);
        
        for (let i = 0; i < chartInstance.data.labels.length; i++) {
            const row = [chartInstance.data.labels[i]];
            for (let ds of chartInstance.data.datasets) {
                row.push(ds.data[i] ?? 'N/A');
            }
            csvRows.push(row.join(','));
        }
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `${chartType.toLowerCase()}_data_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading CSV:', error);
        alert('Error downloading CSV file');
    }
}

// Update the downloadJPEG function:
function downloadJPEG(provinceName, canvasId) {
    console.log("Attempting download for:", provinceName);
    
    const originalCanvas = document.getElementById(canvasId);
    if (!originalCanvas) {
        alert('Chart not available for download');
        return;
    }

    const chartInstance = Chart.getChart(canvasId);
    if (!chartInstance) {
        alert('No chart data available for download');
        return;
    }

    const chartWidth = originalCanvas.width;
    const chartHeight = originalCanvas.height;
    const footerHeight = 50;
    const totalHeight = chartHeight + footerHeight;

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = chartWidth;
    compositeCanvas.height = totalHeight;

    const ctx = compositeCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chartWidth, totalHeight);

    // Chart
    ctx.drawImage(originalCanvas, 0, 0);

    // Watermark (center)
    const watermarkText = "© SANSA Dashboard";
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.textAlign = 'center';
    ctx.fillText(watermarkText, chartWidth / 2, chartHeight / 2);

    const logo = new Image();
    logo.crossOrigin = 'Anonymous'; // Important for CORS
    logo.src = 'images/SANSA_Logo.jpg';

    logo.onload = () => {
        const logoWidth = 120;
        const logoHeight = 40;
        const logoX = 10;
        const logoY = chartHeight + 5;

        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText((provinceName || 'Unknown') + ' Province', chartWidth / 2, chartHeight + 30);

        // Date (right)
        const now = new Date();
        const dateText = now.toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, chartWidth - 10, chartHeight + 30);

        const link = document.createElement('a');
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.download = `${canvasId.replace('Chart', '').toLowerCase()}_chart_${now.toISOString().slice(0, 10)}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    logo.onerror = () => {
        console.warn('Logo failed to load. Proceeding without logo.');

        // Still add province title
        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText((provinceName || 'Unknown') + ' Province', chartWidth / 2, chartHeight + 30);

        const now = new Date();
        const dateText = now.toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, chartWidth - 10, chartHeight + 30);

        const link = document.createElement('a');
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.download = `${canvasId.replace('Chart', '').toLowerCase()}_chart_${now.toISOString().slice(0, 10)}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// Update the nationalCSV function:
function nationalCSV() {
    const nationalCanvas = document.getElementById("nationalChart");
    if (!nationalCanvas) {
        alert('National chart not available for download');
        return;
    }
    
    const nationalChart = Chart.getChart("nationalChart");
    if (!nationalChart) {
        alert('No national chart data available for download');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    // Headers
    csvContent += "Date," + nationalChart.data.datasets.map(ds => ds.label).join(",") + "\n";

    // Rows
    nationalChart.data.labels.forEach((label, i) => {
        let row = [label];
        nationalChart.data.datasets.forEach(ds => {
            row.push(ds.data[i] !== null && ds.data[i] !== undefined ? ds.data[i] : 'N/A');
        });
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "national_vci.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update the nationalJPEG function:
function nationalJPEG() {
    const originalCanvas = document.getElementById("nationalChart");
    if (!originalCanvas) {
        alert('National chart not available for download');
        return;
    }
    
    const nationalChart = Chart.getChart("nationalChart");
    if (!nationalChart) {
        alert('No national chart data available for download');
        return;
    }
    
    const chartWidth = originalCanvas.width;
    const chartHeight = originalCanvas.height;
    const footerHeight = 50;
    const totalHeight = chartHeight + footerHeight;

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = chartWidth;
    compositeCanvas.height = totalHeight;

    const ctx = compositeCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chartWidth, totalHeight);

    // Chart
    ctx.drawImage(originalCanvas, 0, 0);

    // Watermark (center)
    const watermarkText = "© SANSA Dashboard";
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.textAlign = 'center';
    ctx.fillText(watermarkText, chartWidth / 2, chartHeight / 2);

    const logo = new Image();
    logo.crossOrigin = 'Anonymous';
    logo.src = 'images/SANSA_Logo.jpg';

    logo.onload = () => {
        const logoWidth = 120;
        const logoHeight = 40;
        const logoX = 10;
        const logoY = chartHeight + 5;

        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('National Overview', chartWidth / 2, chartHeight + 30);

        // Date (right)
        const now = new Date();
        const dateText = now.toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, chartWidth - 10, chartHeight + 30);

        const link = document.createElement('a');
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.download = 'national_' + now.toISOString().slice(0, 10) + '.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    logo.onerror = () => {
        console.warn('Logo failed to load. Proceeding without logo.');

        // Still add title
        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('National Overview', chartWidth / 2, chartHeight + 30);

        const now = new Date();
        const dateText = now.toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, chartWidth - 10, chartHeight + 30);

        const link = document.createElement('a');
        link.href = compositeCanvas.toDataURL('image/jpeg', 0.9);
        link.download = 'national_' + now.toISOString().slice(0, 10) + '.jpeg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

/**********************************************************************/

function getMonthName(month) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(month, 10) - 1];
}

function showPopupAlert(message, type = 'error') {
    const alertBox = document.getElementById('popup-alert');
    if (!alertBox) return;

    alertBox.textContent = message;

    alertBox.classList.remove('popup-success', 'popup-error');
    alertBox.classList.add(type === 'success' ? 'popup-success' : 'popup-error');

    alertBox.style.display = 'block';
    alertBox.classList.add('show');

    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 500);
    }, 2000);
}

async function checkLayerExists(layerName) {
    try {
        const cleanName = layerName.replace(/\.json$/, '');
        const encodedName = encodeURIComponent(cleanName);
        
        const response = await fetch(`/geoserver-proxy/layers/${encodedName}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.status === 404) {
            console.warn(`Layer ${layerName} not found`);
            return false;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Layer check failed:', error);
        return false;
    }
}

function getColor(value) {
    if (value >= 40) return '#2E7D32';
    if (value >= 30 && value < 40) return '#AED581'; 
    if (value >= 20 && value < 30) return '#FFC107';
    if (value >= 10 && value < 20) return '#A84300';
    if (value >= 0 && value < 10)  return '#D50000';
    return '#cccccc'; 
}

window.addEventListener('focus', function () {
    fetch('/check-session')
        .then(res => {
            if (res.status === 401) {
                alert('Session expired. Redirecting to login...');
                window.location.href = '/login';
            }
        });
});

$(document).ready(function () {
	/***********************************************************************************/
	
	const today = new Date().toISOString().split('T')[0];
    $('#uploaddate').val(today);
    
    // Get CSRF token from meta tag (Laravel default)
    const csrfTokens = $('meta[name="csrf-token"]').attr('content') || $('#csrfToken').val();
    const modalElement = document.getElementById('datasetModal');
            
    // Initialize the modal properly
    const datasetModal = new bootstrap.Modal(modalElement);
    
    // Handle form submission
    $('#datasetForm').on('submit', function(e) {
        e.preventDefault(); // prevent page reload
        
        // Disable button to prevent multiple submissions
        const uploadBtn = $('#uploadBtn');
        uploadBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Processing...');
        
        const errorDiv = $('#uploadDatasetError');
        
        // Collect form data into JSON
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        console.log(data);
        fetch('/upload-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfTokens,
                'Accept': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP status: ${res.status}`);
            }
            return res.json();
        })
        .then(response => {
            console.log("Server response:", response);

            if (response.success) {
                // Show success message
                errorDiv.removeClass('error-message').addClass('success-message');
                errorDiv.show();
                errorDiv.html('<div class="fw-bold">' + response.message + '</div>');
                
                // Reset form but keep the date
                $('#datasetForm')[0].reset();
                $('#uploaddate').val(today);
                
                setTimeout(() => {
                    errorDiv.hide();
                    // Hide the modal using the Bootstrap instance
                    datasetModal.hide();
                }, 2000);
            } else {
                // Show error message
                errorDiv.removeClass('success-message').addClass('error-message');
                errorDiv.show();
                errorDiv.html('<div class="fw-bold">' + response.message + ' || Something went wrong.</div>');
                
                setTimeout(() => {
                    errorDiv.hide();
                }, 5000);
            }
        })
        .catch(err => {
        	document.getElementById('uploadDatasetError').style.display = "block";
            console.error("Error:", err);
            document.getElementById('uploadDatasetError').innerHTML = '<div class = "text-success text-center fw-bold">' +  
            	'An error occurred while uploading data. Please check your connection and try again. </div>';
            	
        	setTimeout(() => {
			    document.getElementById('uploadDatasetError').style.display = "none";
			}, 5000);
        })
        .finally(() => {
            uploadBtn.prop('disabled', false).html('<i class="fas fa-upload me-2"></i>Submit Data');
        });
    });
    
    // Reset form when modal is closed
    modalElement.addEventListener('hidden.bs.modal', function () {
        $('#datasetForm')[0].reset();
        $('#uploaddate').val(today);
        $('#uploadDatasetError').hide().removeClass('success-message error-message');
    });
    
    // Initialize form when modal is shown
    modalElement.addEventListener('shown.bs.modal', function () {
        $('#uploaddate').val(today);
        $('#uploadDatasetError').hide().removeClass('success-message error-message');
    });
	
	/***********************************************************************************/
	
    const yearSlider = document.getElementById("evi-slider"); 
    const monthDropdown = document.getElementById("month-dropdown");
    const monthOptions = monthDropdown.options;
        
    const ndviSlider = document.getElementById("ndvi-slider"); 
    const monthndviDropdown = document.getElementById("month-ndvi-dropdown");
    const monthNDVIOptions = monthndviDropdown.options;
    
    let productVisible = true;
    
    const tabLinks = document.querySelectorAll('a[data-bs-toggle="tab"]');
    
    tabLinks.forEach(function (link) {
        link.addEventListener('shown.bs.tab', function (event) {
            const activatedTabId = event.target.getAttribute('href'); // e.g. '#Products'

            if (activatedTabId === '#Library' || activatedTabId === '#Compute') {
                const legend = document.getElementById('legend');
                if (legend) {
                    legend.style.display = 'none';
                }
            }
        });
    });
    
    /****************************************************************************************/

	$('#baseBtn').hover(function () {
        $(this).hide();
        $('#basemaps').addClass('visible');

        $('#zoombtn').stop().animate({ bottom: '120px' }, 300);
    });

    $('#basemaps').mouseleave(function () {
        $('#basemaps').removeClass('visible');
        $('#baseBtn').show();

        $('#zoombtn').stop().animate({ bottom: '80px' }, 300);
    });

	$('#zoomIn').click(function () {
		map.getView().setZoom(map.getView().getZoom() + 1);
	});

	$('#zoomOut').click(function () {
		map.getView().setZoom(map.getView().getZoom() - 1);
	});

    const fullExtent = [16.0, -35.0, 32.0, -22.0]; 

	$('#extent').click(function () {
		view.fit(fullExtent, { size: map.getSize(), duration: 1000 });
	});
	
    /***************************************************************************************/

	
    
    /***************************************************************************************/
    
	$('#satellite-id').click(function () {
		setBaseLayer(satellite);
	});

	$('#neighbourhoods-id').click(function () {
		setBaseLayer(neighbourhood);
	});

	$('#osm-id').click(function () {
		setBaseLayer(osm);	
	});

	function setBaseLayer(activeLayer) {
		satellite.setVisible(false);
		neighbourhood.setVisible(false);
		osm.setVisible(false);
		
		activeLayer.setVisible(true);
	}

    $(`.vci-years span[data-year="${yearSlider.value}"]`).addClass('active');

    const noDataElement = document.createElement('div');
    noDataElement.className = 'no-data-message';
    noDataElement.style.display = 'none';
    noDataElement.style.color = 'red';
    noDataElement.style.marginTop = '10px';
    noDataElement.textContent = 'No data available for this month/year combination';
    document.getElementById('vciinfo').appendChild(noDataElement);

    function updateMonthAvailability() {
        const selectedEVI = yearSlider.value;
        const selectedNDVI = ndviSlider.value;
        
        for (let i = 0; i < monthOptions.length; i++) {
            monthOptions[i].disabled = false;
        }
        
        for (let i = 0; i < monthNDVIOptions.length; i++) {
            monthNDVIOptions[i].disabled = false;
        }
        
        if (selectedEVI === "2025") {
            for (let i = 0; i < monthOptions.length; i++) {
                if (parseInt(monthOptions[i].value) > 10) {
                	
                    monthOptions[i].disabled = true;
                    if (monthDropdown.value === monthOptions[i].value) {
                        monthDropdown.value = "01";
                    }
                }
            }
        }
        
        if (selectedNDVI === "2025") {
            for (let i = 0; i < monthNDVIOptions.length; i++) {
                if (parseInt(monthNDVIOptions[i].value) > 10) {
                	
                    monthNDVIOptions[i].disabled = true;
                    if (monthndviDropdown.value === monthNDVIOptions[i].value) {
                        monthndviDropdown.value = "01";
                    }
                }
            }
        }
    }

    updateMonthAvailability();

    yearSlider.addEventListener("input", function() {
        $('.vci-years span').removeClass('active');
        $(`.vci-years span[data-year="${this.value}"]`).addClass('active');
        updateMonthAvailability();

        if ($('#productsdata').is(':checked')) {
            loadVCIData();
        }
    });  

    ndviSlider.addEventListener("input", function() {
        $('.vci-years span').removeClass('active');
        $(`.vci-years span[data-year="${this.value}"]`).addClass('active');
        updateMonthAvailability();

        if ($('#ndvi').is(':checked')) {
            loadNDVIData();
        }
    });  

    const layerStore = {};

	$('a[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
		if ($(e.target).attr('href') === '#Compute') {
			loadRasterLayers();
		}
	});
	
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

		// Set up event delegation FIRST
		layerList.addEventListener('change', function(e) {
		    if (e.target.type === 'checkbox') {
		        const layerName = e.target.id;
		        const sliderDiv = document.getElementById(`slider-${layerName}`);
		        const slider = document.getElementById(`range-${layerName}`);
		        
		        if (e.target.checked) {
		            sliderDiv.style.display = 'block';
		            const layer = layers.find(l => {
		                const lName = l.name.includes(':') ? l.name.split(':')[1] : l.name;
		                return lName === layerName;
		            });
		            
		            if (layer) {
		                const olLayer = new ol.layer.Tile({
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
		                olLayer.set('layerId', layerName); // Store layer ID for reference
		                map.addLayer(olLayer);
		                // Store reference to the layer
		                activeLayers[layerName] = olLayer;
		            }
		        } else {
		            sliderDiv.style.display = 'none';
		            if (activeLayers[layerName]) {
		                map.removeLayer(activeLayers[layerName]);
		                delete activeLayers[layerName];
		            }
		        }
		    }
		});

		layerList.addEventListener('input', function(e) {
		    if (e.target.classList.contains('vci-sliders')) {
		        const layerName = e.target.id.replace('range-', '');
		        const opacityLabel = document.getElementById(`opacity-label-${layerName}`);
		        const value = parseInt(e.target.value, 10);
		        const opacity = value / 100;
		        
		        opacityLabel.textContent = `${value}%`;
		        
		        if (activeLayers[layerName]) {
		            activeLayers[layerName].setOpacity(opacity);
		        }
		    }
		});

		// Store active layers and all layers
		let activeLayers = {};
		let layers = [];

		fetch(`${wmsUrl}?service=WMS&request=GetCapabilities`)
		    .then(res => res.text())
		    .then(str => {
		        const parser = new DOMParser();
		        const xml = parser.parseFromString(str, "application/xml");

		        const layersXml = Array.from(xml.querySelectorAll("Layer > Layer"));
		        layers = layersXml.map(layerEl => {
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

		        conn.innerHTML = '<p class="text-success fw-bold">SANSA Development GeoServer</p>';

		        layerList.innerHTML = layers
		            .filter(layer => {
		                const layerName = layer.name.includes(':') ? layer.name.split(':')[1] : layer.name;
		                const excludedLayers = ['Meta', 'Social', 'world'];
		                return !excludedLayers.includes(layerName);
		            })
		            .map(layer => {
		                const layerName = layer.name.includes(':') ? layer.name.split(':')[1] : layer.name;
		                let displayName = formatLayerName(layerName);
		                
		                if (displayName === "onemetre") {
		                    displayName = "1 Metre Inundated Risk";
		                }
		                
		                if (displayName === "threemetre") {
		                    displayName = "3 Metre Inundated Risk";
		                }
		                
		                if (displayName === "fivemetre") {
		                    displayName = "5 Metre Inundated Risk";
		                }

		                return `
		                    <div class="form-check mb-2">
		                        <div class="d-flex align-items-start justify-content-between">
		                            <div class="d-flex align-items-start flex-grow-1">
		                                <input class="form-check-input me-2 mt-1" type="checkbox" value="${layer.name}" id="${layerName}">
		                                <label class="form-check-label fw-bold d-flex align-items-center" for="${layerName}">
		                                    ${displayName}
		                                </label>
		                            </div>
		                            <div class="ms-2">
		                                <i id="metadata-${layerName}" class="bi bi-layers text-primary" style="cursor: pointer;"
		                                   data-bs-toggle="modal" data-bs-target="#layerModal"
		                                   onclick='showLayerMetadata(${JSON.stringify(layer).replace(/'/g, "\\'")}, ${JSON.stringify(displayName).replace(/'/g, "\\'")})'></i>
		                            </div>
		                        </div>
		                        <div id="slider-${layerName}" class="mt-2 w-100" style="display:none;">
		                            <label>Opacity: <span id="opacity-label-${layerName}">50%</span></label>
		                            <input type="range" class="form-range vci-sliders" min="0" max="100" value="50" id="range-${layerName}" />
		                        </div>
		                    </div>
		                `;
		            }).join('');

		        // Modal creation (if missing)
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
		                            <div class="modal-footer">
		                                <button type="button" class="btn" data-bs-dismiss="modal">Close</button>
		                            </div>
		                        </div>
		                    </div>
		                </div>
		            `);
		        }
		    })
		    .catch(error => {
		        console.error(error);
		        conn.innerHTML = '<p class="text-danger fw-bold">Failed to connect to GeoServer.</p>';
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
   
    document.getElementById('preview-btn').addEventListener('click', () => {
        const formula = document.getElementById('formula').value;
        document.getElementById('formula-preview').textContent = `NDVI = ${formula}`;
    });
    
    // Toggle between GeoServer and Upload sections
    document.getElementById('toggle-geoserver').addEventListener('click', () => {
        document.getElementById('geoserver-section').classList.remove('d-none');
        document.getElementById('upload-section').classList.add('d-none');
        document.getElementById('toggle-geoserver').classList.replace('btn-outline-secondary', 'btn-lib');
        document.getElementById('toggle-upload').classList.replace('btn-lib', 'btn-outline-secondary');
    });

    document.getElementById('toggle-upload').addEventListener('click', () => {
        document.getElementById('geoserver-section').classList.add('d-none');
        document.getElementById('upload-section').classList.remove('d-none');
        document.getElementById('toggle-upload').classList.replace('btn-outline-secondary', 'btn-lib');
        document.getElementById('toggle-geoserver').classList.replace('btn-lib', 'btn-outline-secondary');
    });

    document.getElementById('raster-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("Uploaded file:", file.name);
            // Process file (e.g., upload to server or parse client-side)
        }
    });

    document.getElementById('compute-run').addEventListener('click', async () => {
		const useGeoServer = !document.getElementById('geoserver-section').classList.contains('d-none');
		const formula = document.getElementById('formula').value;
		const outputName = document.getElementById('output-name').value;
		const band1 = document.getElementById('band1').value;
		const band2 = document.getElementById('band2').value;
		const outputDiv = document.getElementById('output');
		outputDiv.innerHTML = 'Processing... Please wait ⏳';

		if (!formula || !outputName) {
			alert('Please provide both formula and output name');
			return;
		}

		try {
			let formData = new FormData();
			formData.append('formula', formula);
			formData.append('band1', band1);
			formData.append('band2', band2);
			formData.append('output_name', outputName);

			if (useGeoServer) {
				const layer = document.getElementById('raster-layer-select').value;
				if (!layer) {
					alert('Please select a GeoServer layer');
					return;
				}
				formData.append('source_type', 'geoserver');
				formData.append('layer', layer);
			} else {
				const file = document.getElementById('raster-upload').files[0];
				if (!file) {
					alert('Please upload a raster file');
					return;
				}
				formData.append('source_type', 'upload');
				formData.append('file', file);
			}

			const response = await fetch('/jupyter/ndvi-run', {
				method: 'POST',
				headers: {
					'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
				},
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				console.error(`HTTP ${response.status}`, result);
				alert(`Error: ${result.message}`);
				outputDiv.innerHTML = 'Error occurred';
				return;
			}

			// Display results
			outputDiv.innerHTML = `
				<strong>Success!</strong><br>
				Output Layer: <code>${result.output_layer}</code><br>
				Jupyter Notebook: <code>${result.notebook}</code>
			`;

		} catch (err) {
			console.error(err);
			outputDiv.innerHTML = 'An unexpected error occurred';
			alert(`Error: ${err.message}`);
		}
	});
    
    /*******************************************************************************/
    
    document.getElementById('local-submit').addEventListener('click', function() {
		const workspace = document.getElementById('geoserver-workspace').value.trim();
		const baseUrl = document.getElementById('geoserver-url').value.trim();
		const username = document.getElementById('geoserver-username').value.trim();
		const password = document.getElementById('geoserver-password').value;
		const statusElement = document.getElementById('connection-status');
		
		// Basic validation
		if (!workspace || !baseUrl || !username || !password) {
		    statusElement.textContent = 'Please fill all fields';
		    statusElement.className = 'text-danger mt-2';
		    return;
		}
		
		statusElement.textContent = 'Connecting...';
		statusElement.className = 'text-info mt-2';
		
		// Construct URLs
		const wmsUrl = `${baseUrl}/${workspace}/wms`;
		const capabilitiesUrl = `${wmsUrl}?service=WMS&request=GetCapabilities&version=1.3.0`;
		
		// Create basic auth header
		const authHeader = 'Basic ' + btoa(username + ':' + password);
		
		// Determine if we need to use a proxy (for localhost)
		const useProxy = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
		const proxyUrl = 'http://localhost:3001';
		const finalCapabilitiesUrl = useProxy ? 
		    `${proxyUrl}/geoserver/${workspace}/wms?service=WMS&request=GetCapabilities&version=1.3.0` : 
		    capabilitiesUrl;
		
		fetch(finalCapabilitiesUrl, {
		    method: 'GET',
		    headers: {
		        'Authorization': authHeader
		    }
		})
		.then(response => {
		    if (!response.ok) {
		        if (response.status === 401) {
		            throw new Error('Authentication failed - check username/password');
		        }
		        throw new Error(`HTTP error! status: ${response.status}`);
		    }
		    return response.text();
		})
		.then(xmlData => {
		    parseCapabilities(xmlData, wmsUrl, username, password);
		    statusElement.textContent = 'Connected successfully!';
		    statusElement.className = 'text-success mt-2';
		    
		    setTimeout(function () {
				loadLayers();
			}, 2500);
		   
		})
		.catch(error => {
		    console.error('Error:', error);
		    statusElement.textContent = `Connection failed: ${error.message}`;
		    statusElement.className = 'text-danger mt-2';
		    
		    // For development, try without proxy
		    if (useProxy) {
		        statusElement.textContent += '. Trying direct connection...';
		        tryDirectConnection(capabilitiesUrl, authHeader, wmsUrl, username, password);
		    }
		});
	});
	
	function loadLayers(){
	    document.getElementById('local-server').style.display = "none";
	    document.getElementById('local-load').style.display = "block";
	    
	    document.getElementById('geoserver-content').innerHTML = '<div class = "text-center fw-bold"> Please wait while layers are loading... </div>';
	}

	function tryDirectConnection(url, authHeader, wmsUrl, username, password) {
		fetch(url, {
		    method: 'GET',
		    headers: { 'Authorization': authHeader }
		})
		.then(response => response.text())
		.then(xmlData => {
		    parseCapabilities(xmlData, wmsUrl, username, password);
		    document.getElementById('connection-status').textContent = 'Direct connection successful!';
		})
		.catch(error => {
		    console.error('Direct connection also failed:', error);
		    document.getElementById('connection-status').textContent = 
		        'Both proxy and direct connections failed. Check CORS configuration.';
		});
	}

	// Function to parse capabilities and display layers
	function parseCapabilities(xmlData, wmsUrl, username, password) {
		const parser = new DOMParser();
		const xml = parser.parseFromString(xmlData, "application/xml");
		
		// Check for parsing errors
		const parseError = xml.querySelector('parsererror');
		if (parseError) {
		    throw new Error('Invalid XML response from server');
		}
		
		const layersXml = Array.from(xml.querySelectorAll("Layer > Layer"));
		const layers = layersXml.map(layerEl => {
		    const name = layerEl.querySelector("Name")?.textContent || '';
		    const title = layerEl.querySelector("Title")?.textContent || '';
		    const abstract = layerEl.querySelector("Abstract")?.textContent || 'No abstract available.';
		    const keywords = Array.from(layerEl.querySelectorAll("Keyword")).map(k => k.textContent);
		    const crsList = Array.from(layerEl.querySelectorAll("CRS")).map(c => c.textContent);
		    return { name, title, abstract, keywords, crsList };
		});
		
		// Display layers in your UI
		displayLayers(layers, wmsUrl, username, password);
	}

	// Fallback method for CORS issues
	function tryFallbackConnection(capabilitiesUrl, wmsUrl) {
		const statusElement = document.getElementById('connection-status');
		statusElement.textContent = 'Trying alternative connection method...';
		
		// Use JSONP or proxy approach for CORS issues
		// Method 1: Use a CORS proxy
		const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Note: This may require temporary access
		const proxiedUrl = proxyUrl + capabilitiesUrl;
		
		fetch(proxiedUrl)
		.then(response => response.text())
		.then(xmlData => {
		    parseCapabilities(xmlData, wmsUrl);
		    statusElement.textContent = 'Connected via proxy!';
		    statusElement.className = 'text-success mt-2';
		})
		.catch(error => {
		    console.error('Proxy also failed:', error);
		    statusElement.textContent = 'Connection failed. Check CORS settings on GeoServer.';
		    statusElement.className = 'text-danger mt-2';
		});
	}

	// Function to display layers (similar to your existing code)
	function displayLayers(layers, wmsUrl, username, password) {
		const layerList = document.getElementById('layer-list');
		const conn = document.getElementById('connect-content');
		
		if (!layers.length) {
		    conn.innerHTML = '<p class="text-warning fw-bold">No layers found on GeoServer.</p>';
		    return;
		}
		
		conn.innerHTML = '<p class="text-success fw-bold">Connected to Local GeoServer</p>';
		
		layerList.innerHTML = layers.map(layer => {
		    const layerName = layer.name.includes(':') ? layer.name.split(':')[1] : layer.name;
		    // Your layer display logic here
		    return `<div>${layerName}</div>`; // Simplified for example
		}).join('');
	}

	// Alternative: Using XMLHttpRequest (better for basic auth in some cases)
	function connectWithXHR(workspace, baseUrl, username, password) {
		const xhr = new XMLHttpRequest();
		const wmsUrl = `${baseUrl}/${workspace}/wms`;
		const capabilitiesUrl = `${wmsUrl}?service=WMS&request=GetCapabilities`;
		
		xhr.open('GET', capabilitiesUrl, true);
		xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password));
		
		xhr.onreadystatechange = function() {
		    if (xhr.readyState === 4) {
		        if (xhr.status === 200) {
		            parseCapabilities(xhr.responseText, wmsUrl, username, password);
		        } else {
		            console.error('XHR Error:', xhr.status, xhr.statusText);
		        }
		    }
		};
		
		xhr.send();
	}
    
    /*******************************************************************************/		

	$('#close-legend').click(function () {
    	document.getElementById('legend').style.display = "none";
    });

    function displayLayers(layers) {
        const layerList = $('#layer-list');
        layerList.empty(); // Clear previous results
        
        if (layers && layers.length) {
            layers.forEach(layer => {
                layerList.append(
                    `<li>${layer.name} - <a href="${layer.href}" target="_blank">Details</a></li>`
                );
            });
        } else {
            layerList.append('<li>No layers found</li>');
        }
    }

    function showSuccess(message) {
        $('#connection-status').removeClass('error').addClass('success').text(message);
    }

    function showError(message) {
        $('#connection-status').removeClass('success').addClass('error').text(message);
    }
    
    $('#local').click(function () {
    	document.getElementById('layer-list').style.display = "none";
    	document.getElementById('local-server').style.display = "block";
    	
	 	if ($('#local-load').css('display') === 'block') {
	    	document.getElementById("local-load").style.display = "none";
		}
    	
    	document.getElementById('connect-content').style.display = "none";
    });
    
    $('#close-product').click(function () {
        const $productPanel = $('#products');
        const $icon = $('#product-icon');
        const btn = document.getElementById('uploaddata');
        
        document.getElementById('legend').style.display = "none";
        btn.style.display = "none";

        if (productVisible) {
            $productPanel.removeClass('slide-in').addClass('hide-card');

            setTimeout(() => {
                $productPanel.hide().removeClass('hide-card');
            }, 500);

            setTimeout(() => {
                btn.style.left = "10px";	
            	btn.style.top = "120px";
            	
        		btn.style.display = "block";
            }, 800);

            $icon.html('+');
        } else {
            $productPanel.show().addClass('slide-in');
            $icon.html('&times;');

            setTimeout(() => {
                btn.style.left = "525px";	
            	btn.style.top = "80px";
            	
        		btn.style.display = "block";
            }, 800);
            
            
        }

        productVisible = !productVisible;
    });
    
    $('#close-analyses').click(function () {
        const panel = document.getElementById('accordion');
        const close = document.getElementById('close-analyses');

        setTimeout(() => {
            close.style.display = 'none';
        }, 800);
        panel.style.display = 'none';
    });

    $('#myown').click(function () {
        const conn = document.getElementById('connect-content');
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        
        setTimeout(function (){
            conn.innerHTML = `
                <div class="text-center">
                    <p class="text-success fw-bold"> Function is under construction... </p>
                </div>
            `;
        }, 5000);
        
        conn.innerHTML = `
            <div class="text-center">
                <p class="text-danger fw-bold">Please wait while establishing connection...</p>
                <div class="spinner-border text-danger"></div>
            </div>
        `;
    });

    $('#productsdata').click(function () {
        if (this.checked) {
            loadVCIData();
            document.getElementById('legend').style.display = "block";
        } else {
        	if(rasterLayer)
        		rasterLayer.setVisible(false);
        
            document.getElementById('legend').style.display = "none";
            if (typeof vciLayer !== 'undefined' && vciLayer) {
                map.removeLayer(vciLayer);
                vciLayer = null;
            }
            noDataElement.style.display = 'none';
        }
        $('#vciinfo').toggle(this.checked);
    });
    
    $('#ndvi').click(function () {
    	if (this.checked) {
            loadNDVIData();
            document.getElementById('legend').style.display = "block";
        } else {
        	if(rasterLayer)
        		rasterLayer.setVisible(false);
        
            document.getElementById('legend').style.display = "none";
            if (typeof ndviLayer !== 'undefined' && ndviLayer) {
                map.removeLayer(ndviLayer);
                ndviLayer = null;
            }
            noDataElement.style.display = 'none';
        }
        $('#ndviinfo').toggle(this.checked);	
    });

    function loadVCIData() {
        const year = yearSlider.value;
        const month = monthDropdown.value.padStart(2, '0');
        const vciColumn = `mea${year}${month}`;

        noDataElement.style.display = 'none';

        fetch('/get-vci-map-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ column: vciColumn })
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data?.features?.length) {
                updateMapLayer(data, year, month, 'evi');
                noDataElement.style.display = 'none';
            } else {
                if (typeof vciLayer !== 'undefined' && vciLayer) {
                    map.removeLayer(vciLayer);
                    vciLayer = null;
                }
                noDataElement.style.display = 'block';
            }
        })
        .catch(err => {
            console.error(err);
            if (typeof vciLayer !== 'undefined' && vciLayer) {
                map.removeLayer(vciLayer);
                vciLayer = null;
            }
            noDataElement.style.display = 'block';
            noDataElement.textContent = 'Error loading data. Please try again.';
        });
    }

    monthDropdown.addEventListener("change", function() {
        if ($('#productsdata').is(':checked')) {
            loadVCIData();
        }
    });
    
    function loadNDVIData(){	
    	const year = ndviSlider.value;
        const month = monthndviDropdown.value.padStart(2, '0');
        const vciColumn = `mea${year}${month}`;

        noDataElement.style.display = 'none';

        fetch('/get-ndvi-map-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ column: vciColumn })
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data?.features?.length) {
                updateMapLayer(data, year, month, 'ndvi');
                noDataElement.style.display = 'none';
            } else {
                if (typeof ndviLayer !== 'undefined' && ndviLayer) {
                    map.removeLayer(ndviLayer);
                    ndviLayer = null;
                }
                noDataElement.style.display = 'block';
            }
        })
        .catch(err => {
            console.error(err);
            if (typeof ndviLayer !== 'undefined' && ndviLayer) {
                map.removeLayer(ndviLayer);
                ndviLayer = null;
            }
            noDataElement.style.display = 'block';
            noDataElement.textContent = 'Error loading data. Please try again.';
        });	
    }

    monthndviDropdown.addEventListener("change", function() {
        if ($('#ndvi').is(':checked')) {
            loadNDVIData();
        }
    });
    
    async function loadRasterLayers() {
		const username = 'alamba'; // or your GeoServer username
		const password = 'lamba'; // or your password
		const auth = btoa(`${username}:${password}`);
		const workspace = 'workspace';

		const select = document.getElementById('raster-layer-select');
		select.innerHTML = '<option value="">-- Choose from GeoServer --</option>';

		try {
		    const storesRes = await fetch(`https://example.sansa.org.za/geoserver/rest/workspaces/${workspace}/coveragestores.json`, {
		        headers: {
		            'Authorization': `Basic ${auth}`,
		            'Accept': 'application/json'
		        }
		    });

		    const storesJson = await storesRes.json();
		    const stores = storesJson.coverageStores.coverageStore;

		    for (const store of stores) {
		        const storeName = store.name;

		        const coveragesRes = await fetch(`https://example.sansa.org.za/geoserver/rest/workspaces/${workspace}/coveragestores/${storeName}/coverages.json`, {
		            headers: {
		                'Authorization': `Basic ${auth}`,
		                'Accept': 'application/json'
		            }
		        });

		        if (!coveragesRes.ok) continue;

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

		        const coveragesJson = await coveragesRes.json();
		        const coverages = coveragesJson.coverages.coverage;

		        for (const coverage of coverages) {
					const layerValue = `${workspace}:${coverage.name}`;
					
					const displayText = formatLayerName(
						coverage.title || 
						coverage.name.replace(/_/g, ' ') 
					);
					
					const option = new Option(displayText, layerValue);
					select.add(option);
				}
		    }
		} catch (error) {
		    console.error('Failed to load raster layers:', error);
		}
	}


	// Existing format function
	function formatLayerNames(raw) {
	  return raw.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
	}

    $('.vci-years span').click(function() {
        $('.vci-years span').removeClass('active');
        $(this).addClass('active');

        const selectedYear = $(this).data('year');
        yearSlider.value = selectedYear;

        updateMonthAvailability();

        if ($('#productsdata').is(':checked')) {
            loadVCIData();
        }
    });

    /* Initialize download button event listeners
    document.getElementById('nationalCSV')?.addEventListener('click', nationalCSV);
    document.getElementById('nationalJPEG')?.addEventListener('click', nationalJPEG);
    
    document.getElementById('downloadCsvBtn')?.addEventListener('click', downloadCsv);
    document.getElementById('downloadJPEGBtn')?.addEventListener('click', downloadJPEG(data.province));*/
});

