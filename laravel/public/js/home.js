// ========== FEATURED DATASETS CAROUSEL ==========
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const container = document.querySelector('.datasets-carousel-container');
        const scrollLeftBtn = document.getElementById('scrollLeft');
        const scrollRightBtn = document.getElementById('scrollRight');
        
        if (!container || !scrollLeftBtn || !scrollRightBtn) {
            console.log('Carousel elements not found');
            return;
        }
        
        console.log('Carousel initialized');
        
        // Function to get scroll amount (scroll by one card width)
        function getScrollAmount() {
            const firstCard = container.querySelector('.dataset-card');
            if (firstCard) {
                // Get card width including gap
                const cardWidth = firstCard.offsetWidth;
                const gap = 24; // The gap between cards
                return cardWidth + gap;
            }
            return 400; // Default fallback
        }
        
        // Scroll right
        scrollRightBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const scrollAmount = getScrollAmount();
            const maxScroll = container.scrollWidth - container.clientWidth;
            let newScrollLeft = container.scrollLeft + scrollAmount;
            
            // Don't scroll beyond the maximum
            if (newScrollLeft > maxScroll) {
                newScrollLeft = maxScroll;
            }
            
            container.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        });
        
        // Scroll left
        scrollLeftBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const scrollAmount = getScrollAmount();
            let newScrollLeft = container.scrollLeft - scrollAmount;
            
            // Don't scroll beyond the start
            if (newScrollLeft < 0) {
                newScrollLeft = 0;
            }
            
            container.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        });
        
        // Update button states
        function updateScrollButtons() {
            const maxScroll = container.scrollWidth - container.clientWidth;
            const currentScroll = container.scrollLeft;
            const tolerance = 5;
            
            // Left button state
            if (currentScroll <= tolerance) {
                scrollLeftBtn.disabled = true;
                scrollLeftBtn.style.opacity = '0.5';
                scrollLeftBtn.style.cursor = 'not-allowed';
            } else {
                scrollLeftBtn.disabled = false;
                scrollLeftBtn.style.opacity = '1';
                scrollLeftBtn.style.cursor = 'pointer';
            }
            
            // Right button state
            if (currentScroll >= maxScroll - tolerance) {
                scrollRightBtn.disabled = true;
                scrollRightBtn.style.opacity = '0.5';
                scrollRightBtn.style.cursor = 'not-allowed';
            } else {
                scrollRightBtn.disabled = false;
                scrollRightBtn.style.opacity = '1';
                scrollRightBtn.style.cursor = 'pointer';
            }
        }
        
        // Add scroll event listener
        container.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', function() {
            setTimeout(updateScrollButtons, 100);
        });
        
        // Initial button state
        setTimeout(updateScrollButtons, 100);
        
    }, 100);
});

// Helper function for XYZ layers
const createXYZLayer = (
    name,
    url,
    attribution,
    visible = false
) => {
    return new ol.layer.Tile({
        properties: {
            name: name
        },
        visible: visible,
        source: new ol.source.XYZ({
            url: url,
            attributions: `© ${new Date().getFullYear()} ${attribution}`,
            tileSize: 256,
            crossOrigin: 'anonymous'
        })
    });
};

// Base layers
const baseLayers = {
    neighbourhood: createXYZLayer(
        'Neighbourhood',
        'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=85b21f0f345b40c880729c091a6acb6c',
        'Thunderforest',
        false
    ),

    osm: new ol.layer.Tile({
        properties: {
            name: 'OpenStreetMap'
        },
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

// Province layer - FIXED duplicate url and params
const province = new ol.layer.Tile({
    properties: {
        name: 'Province'
    },
    visible: true,
    source: new ol.source.TileWMS({
        url: 'https://10.150.16.184/geoserver/geonode/wms',
        params: {
            'LAYERS': 'geonode:south_africa_provincial_boundaries',
            'TRANSPARENT': true,
            'TILED': true
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    })
});

// Metadata layer - FIXED
const metadata = new ol.layer.Tile({
    properties: {
        name: 'metadata'
    },
    visible: true,
    source: new ol.source.TileWMS({
        url: 'https://10.150.16.184/geoserver/geonode/wms',
        params: {
            'LAYERS': 'geonode:metadata',
            'TRANSPARENT': true,
            'TILED': true
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    })
});

// Map view
const view = new ol.View({
    projection: 'EPSG:4326',
    center: [24.4542, -28.5734],
    zoom: 4.5,
    minZoom: 4.5,
    maxZoom: 6
});

// Map initialization
const map = new ol.Map({
    target: 'map',
    layers: [
        ...Object.values(baseLayers),
        province,
        metadata
    ],
    view: view
});

// ========== TOOLTIP THAT FOLLOWS MOUSE ==========

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 8px 15px;
    border-radius: 6px;
    font-size: 13px;
    font-family: Arial, sans-serif;
    pointer-events: none;
    z-index: 9999;
    display: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border-left: 3px solid #FFF;
    white-space: nowrap;
    backdrop-filter: blur(4px);
    max-width: 300px;
    white-space: normal;
    word-wrap: break-word;
`;
document.body.appendChild(tooltip);

// Variable to store current mouse position
let currentMouseX = 0;
let currentMouseY = 0;

// Track mouse position
document.addEventListener('mousemove', function(e) {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
});

// Debounce timer
let hoverTimeout;
let currentRequest = null;

// Function to update tooltip position next to cursor
function updateTooltipPosition() {
    if (tooltip.style.display === 'block') {
        // Position tooltip 15px right and 20px above cursor
        let left = currentMouseX + 15;
        let top = currentMouseY - 30;
        
        // Prevent tooltip from going off-screen
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left + tooltipRect.width > viewportWidth) {
            left = currentMouseX - tooltipRect.width - 15;
        }
        
        if (top < 0) {
            top = currentMouseY + 20;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
}

// Update position on mouse move
document.addEventListener('mousemove', updateTooltipPosition);

// Function to get metadata info
function getMetadataInfo(coordinate) {
    const viewResolution = map.getView().getResolution();
    
    const url = metadata.getSource().getFeatureInfoUrl(
        coordinate,
        viewResolution,
        'EPSG:4326',
        {
            'INFO_FORMAT': 'application/json',
            'FEATURE_COUNT': 1,
            'QUERY_LAYERS': 'geonode:metadata'
        }
    );
    
    if (url) {
        // Abort previous request if still pending
        if (currentRequest) {
            currentRequest.abort();
        }
        
        currentRequest = new AbortController();
        
        fetch(url, { signal: currentRequest.signal })
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    const props = data.features[0].properties;
                    
                    // Build tooltip text
                    let tooltipText = '';
                    if (props.title) {
                        tooltipText += `<strong>${props.title}</strong>`;
                    }
                    if (props.province) {
                        if (tooltipText) tooltipText += '<br>';
                        tooltipText += `📍 ${props.province}`;
                    }
                    if (props.owner || props.organisation) {
                        if (tooltipText) tooltipText += '<br>';
                        tooltipText += `🏢 ${props.owner || props.organisation}`;
                    }
                    
                    if (tooltipText) {
                        tooltip.innerHTML = tooltipText;
                        tooltip.style.display = 'block';
                        updateTooltipPosition();
                    } else {
                        tooltip.style.display = 'none';
                    }
                } else {
                    tooltip.style.display = 'none';
                }
                currentRequest = null;
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching metadata:', error);
                    tooltip.style.display = 'none';
                }
                currentRequest = null;
            });
    }
}

// Mouse move handler for map
map.on('pointermove', function(evt) {
    if (evt.dragging) {
        tooltip.style.display = 'none';
        clearTimeout(hoverTimeout);
        return;
    }
    
    // Update cursor
    map.getTargetElement().style.cursor = 'pointer';
    
    // Clear previous timeout
    clearTimeout(hoverTimeout);
    
    // Show loading indicator
    tooltip.innerHTML = '🔍 Loading...';
    tooltip.style.display = 'block';
    updateTooltipPosition();
    
    // Debounce: wait 200ms before making request
    hoverTimeout = setTimeout(() => {
        getMetadataInfo(evt.coordinate);
    }, 200);
});

// Hide tooltip when mouse leaves map
map.getTargetElement().addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
    clearTimeout(hoverTimeout);
    if (currentRequest) {
        currentRequest.abort();
        currentRequest = null;
    }
    map.getTargetElement().style.cursor = '';
});

// Optional: Add a small status indicator
console.log('✅ Hover tooltip enabled - Move mouse over metadata areas');
