// --- MAP & DRAW (unchanged but functional)
let map, drawnItems, rectLayer = null;
const westInput = document.getElementById('westLon');
const southInput = document.getElementById('southLat');
const eastInput = document.getElementById('eastLon');
const northInput = document.getElementById('northLat');
const bboxHidden = document.getElementById('bboxWkt');

function initDrawMap() {
    map = L.map('extentMap').setView([-29.0, 24.0], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB',
        subdomains: 'abcd'
    }).addTo(map);
    map.invalidateSize();
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
        draw: { polygon: false, polyline: false, circle: false, circlemarker: false, marker: false,
            rectangle: { shapeOptions: { color: '#0a2642', weight: 3, fillOpacity: 0.2 } }
        },
        edit: { featureGroup: drawnItems, remove: true }
    });
    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, function(e) {
        drawnItems.clearLayers(); drawnItems.addLayer(e.layer); rectLayer = e.layer;
        const b = e.layer.getBounds();
        updateCoordInputs(b.getWest(), b.getSouth(), b.getEast(), b.getNorth());
    });
    map.on(L.Draw.Event.DELETED, () => updateCoordInputs(-22.1265, -34.8212, 32.8931, 16.4699));
    function addDefaultRect(w,s,e,n) { drawnItems.clearLayers(); let rect = L.rectangle([[s,w],[n,e]], { color:'#0a2642', weight:3, fillOpacity:0.2 }); drawnItems.addLayer(rect); rectLayer=rect; map.fitBounds([[s,w],[n,e]]); }
    addDefaultRect(-22.1265, -34.8212, 32.8931, 16.4699);
}
function updateCoordInputs(west,south,east,north) { westInput.value = west.toFixed(6); southInput.value = south.toFixed(6); eastInput.value = east.toFixed(6); northInput.value = north.toFixed(6); updateWktAndRect(); }
function updateWktAndRect() { let w=parseFloat(westInput.value), s=parseFloat(southInput.value), e=parseFloat(eastInput.value), n=parseFloat(northInput.value); if(isNaN(w)||isNaN(s)||isNaN(e)||isNaN(n)) return; bboxHidden.value = `POLYGON((${w} ${s}, ${e} ${s}, ${e} ${n}, ${w} ${n}, ${w} ${s}))`; if(drawnItems) { drawnItems.clearLayers(); let rect = L.rectangle([[s,w],[n,e]], { color:'#0a2642', weight:3, fillOpacity:0.2 }); drawnItems.addLayer(rect); rectLayer=rect; map.fitBounds([[s,w],[n,e]]); } }
westInput.addEventListener('change', updateWktAndRect); southInput.addEventListener('change', updateWktAndRect); eastInput.addEventListener('change', updateWktAndRect); northInput.addEventListener('change', updateWktAndRect);

// --- CONTRIBUTORS DYNAMIC (name, role, contact details)
let contributorIndex = 0;
const contributorsContainer = document.getElementById('contributorsContainer');

function createContributorCard(index, data = { name: '', role: '', email: '', phone: '' }) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'contributor-card';
    cardDiv.dataset.contributorId = index;
    cardDiv.innerHTML = `
        <div class="contributor-header">
            <span class="contributor-title"><i class="fas fa-user-circle me-1"></i> Contributor ${index+1}</span>
            <button type="button" class="btn-remove-contrib" data-idx="${index}" title="Remove contributor"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
        <div class="contributor-fields">
            <div class="row g-2">
                <div class="col-md-6"><label class="form-label" style="font-size:0.7rem;">Full name *</label><input type="text" class="form-control" name="contributor_name_${index}" placeholder="e.g., Thabo Nkosi" value="${escapeHtml(data.name)}" required><div class="input-hint"><i class="fas fa-id-card"></i> Full name of contributor</div></div>
                <div class="col-md-6"><label class="form-label" style="font-size:0.7rem;">Role / responsibility *</label><input type="text" class="form-control" name="contributor_role_${index}" placeholder="e.g., Metadata author, Data steward" value="${escapeHtml(data.role)}" required><div class="input-hint">e.g., author, reviewer, pointOfContact</div></div>
                <div class="col-md-6"><label class="form-label" style="font-size:0.7rem;">Email address</label><input type="email" class="form-control" name="contributor_email_${index}" placeholder="name@domain.com" value="${escapeHtml(data.email)}"><div class="input-hint">Preferred contact email</div></div>
                <div class="col-md-6"><label class="form-label" style="font-size:0.7rem;">Phone number</label><input type="tel" class="form-control" name="contributor_phone_${index}" placeholder="+27 ..." value="${escapeHtml(data.phone)}"><div class="input-hint">Phone (optional)</div></div>
            </div>
        </div>
    `;
    const removeBtn = cardDiv.querySelector('.btn-remove-contrib');
    removeBtn.addEventListener('click', () => cardDiv.remove());
    return cardDiv;
}

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){ if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

function addContributor(data = {}) {
    const card = createContributorCard(contributorIndex, data);
    contributorsContainer.appendChild(card);
    contributorIndex++;
}

document.getElementById('addContributorBtn').addEventListener('click', () => addContributor());

// --- WIZARD LOGIC with contributors validation
const stepContents = document.querySelectorAll('.step-content');
const arrowSteps = document.querySelectorAll('.arrow-step');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('formError');
let currentStep = 0;
const totalSteps = stepContents.length;

function validateCurrentGroup(stepIdx) {
    const group = document.querySelector(`.step-content[data-step="${stepIdx}"]`);
    if (!group) return true;
    const requiredInputs = group.querySelectorAll('[required]');
    let isValid = true;
    requiredInputs.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = "#dc3545";
            isValid = false;
        } else field.style.borderColor = "#e2edf2";
    });
    if (stepIdx === 0) {
        let w = parseFloat(westInput.value), s = parseFloat(southInput.value), e = parseFloat(eastInput.value), n = parseFloat(northInput.value);
        if (isNaN(w)||isNaN(s)||isNaN(e)||isNaN(n) || w>=e || s>=n) {
            errorDiv.style.display = 'block'; errorDiv.innerText = 'Invalid bounding box: West<East and South<North.';
            return false;
        }
        updateWktAndRect(); errorDiv.style.display = 'none';
    } else if(stepIdx === 4){
        // validate at least one contributor's name+role (mandatory per contributor card)
        const cards = document.querySelectorAll('.contributor-card');
        if(cards.length === 0){
            errorDiv.style.display = 'block'; errorDiv.innerText = 'Please add at least one person contributing to metadata.';
            return false;
        }
        let allValid = true;
        cards.forEach((card, idx) => {
            const nameInp = card.querySelector(`input[name="contributor_name_${card.dataset.contributorId}"]`);
            const roleInp = card.querySelector(`input[name="contributor_role_${card.dataset.contributorId}"]`);
            if(!nameInp?.value.trim() || !roleInp?.value.trim()) allValid = false;
        });
        if(!allValid) { errorDiv.style.display = 'block'; errorDiv.innerText = 'Each contributor must have a name and role.'; return false; }
        errorDiv.style.display = 'none';
    } else { errorDiv.style.display = 'none'; }
    if (!isValid) { errorDiv.style.display = 'block'; errorDiv.innerText = 'Please fill all mandatory fields in this section.'; return false; }
    return true;
}

function updateUI() {
    stepContents.forEach((content, idx) => { content.style.display = idx === currentStep ? 'block' : 'none'; });
    arrowSteps.forEach((arrow, idx) => {
        arrow.classList.remove('active', 'completed');
        if (idx < currentStep) arrow.classList.add('completed');
        else if (idx === currentStep) arrow.classList.add('active');
    });
    prevBtn.disabled = currentStep === 0;
    if (currentStep === totalSteps - 1) { nextBtn.style.display = 'none'; submitBtn.style.display = 'inline-flex'; }
    else { nextBtn.style.display = 'inline-flex'; submitBtn.style.display = 'none'; }
    if (currentStep === 0 && map) setTimeout(() => map.invalidateSize(), 80);
}

function goToStep(newStep) {
    if (newStep < 0 || newStep >= totalSteps) return;
    if (newStep > currentStep && !validateCurrentGroup(currentStep)) return;
    currentStep = newStep;
    updateUI();
}

nextBtn.addEventListener('click', () => goToStep(currentStep + 1));
prevBtn.addEventListener('click', () => goToStep(currentStep - 1));
arrowSteps.forEach((arrow, idx) => { arrow.addEventListener('click', () => { if (idx > currentStep && !validateCurrentGroup(currentStep)) return; goToStep(idx); }); });

function setDefaultDates() {
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateValue = now.toISOString().slice(0,16);
    const refDate = document.querySelector('input[name="referenceDateTime"]');
    const stampDate = document.querySelector('input[name="metadataStampDate"]');
    if (refDate && !refDate.value) refDate.value = dateValue;
    if (stampDate && !stampDate.value) stampDate.value = dateValue;
}

document.getElementById('metadataForm').addEventListener('submit', (e) => {
    e.preventDefault();
    for (let i = 0; i < totalSteps; i++) { if (!validateCurrentGroup(i)) { goToStep(i); return; } }
    const formData = new FormData(e.target);
    const payload = {};
    for (let [k, v] of formData.entries()) payload[k] = v;
    // collect contributors array
    const contributors = [];
    document.querySelectorAll('.contributor-card').forEach(card => {
        const idx = card.dataset.contributorId;
        contributors.push({
            name: formData.get(`contributor_name_${idx}`) || '',
            role: formData.get(`contributor_role_${idx}`) || '',
            email: formData.get(`contributor_email_${idx}`) || '',
            phone: formData.get(`contributor_phone_${idx}`) || ''
        });
    });
    payload.contributors = contributors;
    payload.geographicExtent = { west: parseFloat(westInput.value), south: parseFloat(southInput.value), east: parseFloat(eastInput.value), north: parseFloat(northInput.value), wkt: bboxHidden.value };
    console.log("Metadata record with contributors:", payload);
    alert(`Metadata validated! ${contributors.length} contributor(s) included. Check console for full payload.`);
});

initDrawMap();
setDefaultDates();
updateUI();
// add one default contributor as example
addContributor({ name: "Nomfundo Dlamini", role: "Metadata specialist", email: "nomfundo@saeoss.org", phone: "+27 21 123 4567" });
