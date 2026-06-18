let organisationsData = [];

document.addEventListener('DOMContentLoaded', function() {
    loadOrganisations();
    initializeSearch();
    initializeAddOrganisationForm();
});

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            filterOrganisations(this.value);
        });
    }
}

// ============================================================================
// Logo Handling - Ensures logos fit perfectly in cards
// ============================================================================

function getOrganisationLogo(organisation) {
    const assetBase = window.assetUrl || '';
    const defaultLogo = window.defaultLogo || '/images/default-org-logo.jpg';
    
    // If organisation has a logo path in the database, use it
    if (organisation.logo && organisation.logo !== '' && organisation.logo !== 'images/default-org-logo.jpg') {
        let logoPath = organisation.logo;
        // Remove leading slash if present to avoid double slashes
        if (logoPath.startsWith('/')) {
            logoPath = logoPath.substring(1);
        }
        return assetBase + '/' + logoPath;
    }
    // Fallback to default logo
    return defaultLogo;
}

function adjustLogoOrientation(imgElement) {
    if (!imgElement) return;
    
    imgElement.onload = function() {
        const img = this;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        img.classList.remove('portrait', 'landscape', 'cover');
        
        if (imgWidth > imgHeight * 1.2) {
            img.classList.add('landscape');
        } else if (imgHeight > imgWidth * 1.2) {
            img.classList.add('portrait');
        }
        
        console.log(`Logo loaded: ${img.src}, Dimensions: ${imgWidth}x${imgHeight}`);
    };
    
    if (imgElement.complete) {
        imgElement.onload();
    }
}

// ============================================================================
// API Calls
// ============================================================================

function loadOrganisations() {
    const container = document.getElementById('organisationsContainer');
    if (!container) {
        console.error('organisationsContainer not found');
        return;
    }
    
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading organisations...</p>
        </div>
    `;
    
    fetch('/api/organisations', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('API Response:', data);
        
        // Handle the response structure from your controller
        // Your controller returns: { success: true, organisations: [...] }
        let organisations = [];
        
        if (data.success && Array.isArray(data.organisations)) {
            organisations = data.organisations;
        } else if (Array.isArray(data)) {
            organisations = data;
        } else if (data.data && Array.isArray(data.data)) {
            organisations = data.data;
        } else if (data.organisations && Array.isArray(data.organisations)) {
            organisations = data.organisations;
        } else {
            console.error('Unexpected data structure:', data);
            organisations = [];
        }
        
        console.log('Organisations loaded:', organisations.length);
        organisationsData = organisations;
        displayOrganisations(organisations);
    })
    .catch(error => {
        console.error('Error loading organisations:', error);
        showError('Failed to load organisations. Please refresh the page.', error.message);
    });
}

function fetchOrganisationDetails(identifier) {
    fetch(`/api/organisations/${identifier}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Organisation not found');
        }
        return response.json();
    })
    .then(data => {
        // Handle the response structure from your controller
        let org = data;
        if (data.success && data.organisation) {
            org = data.organisation;
        }
        showOrganisationModal(org);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load organisation details: ' + error.message);
    });
}

// ============================================================================
// Display Functions
// ============================================================================

function displayOrganisations(organisations) {
    const container = document.getElementById('organisationsContainer');
    
    if (!container) {
        console.error('organisationsContainer not found');
        return;
    }
    
    // Make sure organisations is an array
    if (!organisations || !Array.isArray(organisations) || organisations.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i> No organisations found.
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="row">
            <div class="col-12">
                <p class="text-muted">
                    Showing ${organisations.length} organisation${organisations.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
        <div class="row">
    `;
    
    organisations.forEach(org => {
        html += createOrganisationCard(org);
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Apply logo orientation after images are loaded
    setTimeout(() => {
        document.querySelectorAll('.card-img-top').forEach(img => {
            adjustLogoOrientation(img);
        });
    }, 100);
}

function createOrganisationCard(org) {
    const logoUrl = getOrganisationLogo(org);
    const description = org.description || '';
    const shortDesc = description.length > 150 ? description.substring(0, 150) + '...' : description;
    const defaultLogo = window.defaultLogo || '/images/default-org-logo.jpg';
    
    // Get metadata count - handle both 'metadata_count' and 'metadataCount'
    const metadataCount = org.metadata_count || org.metadataCount || 0;
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <span class="badge-type">${escapeHtml(org.type || 'government')}</span>
                <div class="image-container" style="height: 200px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                    <img class="card-img-top" 
                         src="${logoUrl}" 
                         alt="${escapeHtml(org.organisation || 'Organisation')}"
                         style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;"
                         onerror="this.onerror=null; this.src='${defaultLogo}';">
                </div>
                <div class="card-body">
                    <h4 class="card-title fw-bold">${escapeHtml(org.organisation || 'Unknown Organisation')}</h4>
                    <p class="card-text">${escapeHtml(shortDesc || 'No description available.')}</p>
                    <div class="cardfoo">
                        <div class="records-meta">
                            <i class="bi bi-database"></i> 
                            Total ${metadataCount} Metadata Records
                        </div>
                        ${org.director ? `<small class="text-muted d-block mt-2"><i class="bi bi-person"></i> Director: ${escapeHtml(org.director)}</small>` : ''}
                        <button class="btn btn-sm conns mt-3 w-100" onclick="showOrganisationDetails('${org.identifier}')">
                            View Details <i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// Search and Filter
// ============================================================================

function filterOrganisations(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        displayOrganisations(organisationsData);
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = organisationsData.filter(org => {
        const description = org.description || '';
        const organisation = org.organisation || '';
        const director = org.director || '';
        const alias = org.alias || '';
        
        return organisation.toLowerCase().includes(term) ||
               description.toLowerCase().includes(term) ||
               director.toLowerCase().includes(term) ||
               alias.toLowerCase().includes(term);
    });
    
    displayOrganisations(filtered);
}

// ============================================================================
// Modal Functions
// ============================================================================

function showOrganisationDetails(identifier) {
    fetchOrganisationDetails(identifier);
}

function showOrganisationModal(org) {
    let modal = document.getElementById('organisationModal');
    if (!modal) {
        modal = createModalElement();
    }
    
    const logoUrl = getOrganisationLogo(org);
    const defaultLogo = window.defaultLogo || '/images/default-org-logo.jpg';
    
    const description = org.description || 'No description available';
    const contactEmail = org.contact_email || 'N/A';
    const contactPhone = org.contact_phone || 'N/A';
    const website = org.website || '';
    const director = org.director || 'N/A';
    const type = org.type || 'government';
    const metadataCount = org.metadata_count || org.metadataCount || 0;
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header" style="background: #0a2642; color: white;">
                    <h5 class="modal-title">${escapeHtml(org.organisation)}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px; overflow: hidden;">
                                <img src="${logoUrl}" 
                                     class="img-fluid" 
                                     alt="${escapeHtml(org.organisation)}"
                                     style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;"
                                     onerror="this.onerror=null; this.src='${defaultLogo}';">
                            </div>
                        </div>
                        <div class="col-md-8">
                            <h6 class="fw-bold">Description</h6>
                            <p>${escapeHtml(description)}</p>
                            
                            <h6 class="fw-bold mt-3">Contact Information</h6>
                            <ul class="list-unstyled">
                                <li><strong>Email:</strong> ${escapeHtml(contactEmail)}</li>
                                <li><strong>Phone:</strong> ${escapeHtml(contactPhone)}</li>
                                <li><strong>Website:</strong> ${website ? `<a href="${website}" target="_blank">${escapeHtml(website)}</a>` : 'N/A'}</li>
                                <li><strong>Director:</strong> ${escapeHtml(director)}</li>
                                <li><strong>Type:</strong> <span class="badge bg-secondary">${escapeHtml(type)}</span></li>
                            </ul>
                            
                            <h6 class="fw-bold mt-3"><i class="bi bi-bar-chart"></i> Statistics</h6>
                            <p>Total Metadata Records: <strong>${metadataCount}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="viewOrganisation('${escapeHtml(org.organisation).replace(/'/g, "\\'")}')"> 
                        View Organisation 
                    </button>
                    <button type="button" class="btn btn-primary" onclick="viewOrganisationRecords('${escapeHtml(org.organisation).replace(/'/g, "\\'")}')">
                        <i class="bi bi-database"></i> View All Metadata
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

function createModalElement() {
    const modal = document.createElement('div');
    modal.id = 'organisationModal';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    document.body.appendChild(modal);
    return modal;
}

function viewOrganisation(organisationName) {
    // URL encode the organisation name for safe URL
    const encodedName = encodeURIComponent(organisationName);
    window.location.href = `/organisation/${encodedName}`;
}

function viewOrganisationRecords(organisationName) {
    sessionStorage.setItem('selectedOrganisation', organisationName);
    window.location.href = '/metadata';
}

// ============================================================================
// Form Handling
// ============================================================================

function initializeAddOrganisationForm() {
    const form = document.getElementById('addOrganisationForm');
    if (!form) return;
    
    form.addEventListener('submit', handleAddOrganisationSubmit);
    
    const modal = document.getElementById('addOrganisationModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', resetAddOrganisationModal);
    }
}

async function handleAddOrganisationSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitOrganisationBtn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Creating...';
    
    removeExistingAlerts();
    
    const data = collectFormData();
    
    try {
        const response = await submitOrganisation(data);
        
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage(result.organisation.identifier);
            e.target.reset();
            
            setTimeout(() => {
                closeModalAndReload();
            }, 2000);
        } else {
            throw new Error(result.message || 'Failed to create organisation');
        }
    } catch (error) {
        console.error('Error details:', error);
        showErrorMessage(error.message);
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function collectFormData() {
    return {
        organisation: document.getElementById('organisation')?.value || '',
        alias: document.getElementById('alias')?.value || '',
        description: document.getElementById('description')?.value || '',
        director: document.getElementById('director')?.value || '',
        type: document.getElementById('type')?.value || 'government',
        contact_email: document.getElementById('contact_email')?.value || '',
        contact_phone: document.getElementById('contact_phone')?.value || '',
        website: document.getElementById('website')?.value || '',
    };
}

function submitOrganisation(data) {
    return fetch('/organisations/store', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

function removeExistingAlerts() {
    const existingAlerts = document.querySelectorAll('#addOrganisationModal .alert');
    existingAlerts.forEach(alert => alert.remove());
}

function showSuccessMessage(identifier) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show';
    successDiv.innerHTML = `
        <i class="bi bi-check-circle-fill"></i> 
        Organisation created successfully! Identifier: <strong>${escapeHtml(identifier)}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    const modalBody = document.querySelector('#addOrganisationModal .modal-body');
    if (modalBody) {
        modalBody.insertBefore(successDiv, modalBody.firstChild);
    }
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill"></i> 
        Error: ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    const modalBody = document.querySelector('#addOrganisationModal .modal-body');
    if (modalBody) {
        modalBody.insertBefore(errorDiv, modalBody.firstChild);
    }
}

function closeModalAndReload() {
    const modalElement = document.getElementById('addOrganisationModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }
    location.reload();
}

function resetAddOrganisationModal() {
    const alerts = document.querySelectorAll('#addOrganisationModal .alert');
    alerts.forEach(alert => alert.remove());
    
    const form = document.getElementById('addOrganisationForm');
    if (form) form.reset();
    
    const submitBtn = document.getElementById('submitOrganisationBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-save"></i> Create Organisation';
    }
}

function showError(title, message) {
    const container = document.getElementById('organisationsContainer');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                <strong>${escapeHtml(title)}</strong>
                <br><small class="text-muted">${escapeHtml(message)}</small>
            </div>
        `;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
