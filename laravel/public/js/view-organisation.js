(function() {
    document.addEventListener('DOMContentLoaded', function() {
        
        const allRecords = window.organisationData?.allRecords || [];
        const itemsPerPage = 12;
        let currentPage = 1;
        let currentFilteredRecords = [...allRecords];
        let currentSearchTerm = '';

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        function filterRecords() {
            const searchTerm = currentSearchTerm.toLowerCase();
            if (!searchTerm) {
                currentFilteredRecords = [...allRecords];
            } else {
                currentFilteredRecords = allRecords.filter(record => {
                    const title = (record.title || '').toLowerCase();
                    const desc = (record.descriptio || '').toLowerCase();
                    return title.includes(searchTerm) || desc.includes(searchTerm);
                });
            }
            currentPage = 1;
            renderRecords();
        }

        function changePage(page) {
            const totalPages = Math.ceil(currentFilteredRecords.length / itemsPerPage);
            if (page < 1 || page > totalPages) return;
            currentPage = page;
            renderRecords();
        }

        function renderPagination() {
            const totalPages = Math.ceil(currentFilteredRecords.length / itemsPerPage);
            const paginationContainer = document.getElementById('pagination');
            const pageInfoContainer = document.getElementById('pageInfo');
            
            if (!paginationContainer) return;
            
            if (totalPages <= 1) {
                paginationContainer.innerHTML = '';
                if (pageInfoContainer) pageInfoContainer.innerHTML = '';
                return;
            }
            
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, currentFilteredRecords.length);
            if (pageInfoContainer) {
                pageInfoContainer.innerHTML = `Showing ${startItem} to ${endItem} of ${currentFilteredRecords.length} records`;
            }
            
            let paginationHtml = '';
            paginationHtml += `<button onclick="window.changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>`;
            
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            if (startPage > 1) {
                paginationHtml += `<button onclick="window.changePage(1)">1</button>`;
                if (startPage > 2) paginationHtml += `<button disabled>...</button>`;
            }
            
            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `<button onclick="window.changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) paginationHtml += `<button disabled>...</button>`;
                paginationHtml += `<button onclick="window.changePage(${totalPages})">${totalPages}</button>`;
            }
            
            paginationHtml += `<button onclick="window.changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
            
            paginationContainer.innerHTML = paginationHtml;
        }

        function renderRecords() {
            const container = document.getElementById('recordsContainer');
            if (!container) {
                console.error('recordsContainer element not found');
                return;
            }
            
            if (!allRecords || allRecords.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open" style="font-size: 2rem; opacity: 0.6; margin-bottom: 1rem; display: block;"></i>No metadata records found for this organisation.</div>`;
                const paginationContainer = document.getElementById('pagination');
                const pageInfoContainer = document.getElementById('pageInfo');
                if (paginationContainer) paginationContainer.innerHTML = '';
                if (pageInfoContainer) pageInfoContainer.innerHTML = '';
                return;
            }
            
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedRecords = currentFilteredRecords.slice(startIndex, endIndex);
            
            if (paginatedRecords.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open" style="font-size: 2rem; opacity: 0.6; margin-bottom: 1rem; display: block;"></i>No matching records found.</div>`;
                const paginationContainer = document.getElementById('pagination');
                const pageInfoContainer = document.getElementById('pageInfo');
                if (paginationContainer) paginationContainer.innerHTML = '';
                if (pageInfoContainer) pageInfoContainer.innerHTML = '';
                return;
            }
            
            container.innerHTML = paginatedRecords.map(record => `
                <div class="record-card fade-in" data-id="${record.id}">
                    <div class="card-header">
                        <div class="title-badge">
                            <h3><i class="fas fa-map-marked-alt" style="font-size: 0.9rem; color:#2b8c6e; margin-right: 8px;"></i>${escapeHtml(record.title || 'Untitled')}</h3>
                        </div>
                        <span class="privacy-badge ${(record.status || 'public') === 'private' ? 'private' : ''}">
                            <i class="fas ${(record.status || 'public') === 'private' ? 'fa-lock' : 'fa-globe'}"></i>
                            ${((record.status || 'PUBLIC')).toUpperCase()}
                        </span>
                    </div>
                    <div class="record-description">${escapeHtml(record.descriptio || record.description || 'No description available').substring(0, 150)}${(record.descriptio || record.description || '').length > 150 ? '...' : ''}</div>
                    <div class="card-footer">
                        <div class="date"><i class="far fa-calendar-alt"></i> Updated ${record.updated_at ? record.updated_at.split('T')[0] : (record.created_at ? record.created_at.split('T')[0] : 'N/A')}</div>
                        <a href="#" class="action-link view-details" data-id="${record.id}">View details <i class="fas fa-chevron-right"></i></a>
                    </div>
                </div>
            `).join('');
            
            renderPagination();
            
            const recordCountDisplay = document.getElementById('recordCountDisplay');
            if (recordCountDisplay) {
                recordCountDisplay.innerText = `${currentFilteredRecords.length} Metadata Record${currentFilteredRecords.length !== 1 ? 's' : ''}`;
            }
            
            document.querySelectorAll('.view-details').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const id = link.getAttribute('data-id');
                    alert(`Viewing details for metadata record ID: ${id}`);
                });
            });
        }

        function populateMetadataTable() {
            const tbody = document.getElementById('metadataTableBody');
            if (!tbody) {
                console.log('metadataTableBody not found');
                return;
            }
            
            if (!allRecords || allRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No metadata records found</td></tr>`;
                return;
            }
            
            tbody.innerHTML = allRecords.map(record => `
                <tr>
                    <td class="checkbox-cell"><input type="checkbox" class="metadata-checkbox" data-id="${record.id}"></td>
                    <td>${escapeHtml(record.title || 'Untitled')}</td>
                    <td><span class="status-badge ${(record.status || 'public') === 'private' ? 'status-private' : 'status-public'}">${((record.status || 'PUBLIC')).toUpperCase()}</span></td>
                    <td>${record.updated_at ? record.updated_at.split('T')[0] : (record.created_at ? record.created_at.split('T')[0] : 'N/A')}</td>
                    <td class="action-buttons-cell">
                        <button class="btn-sm ${(record.status || 'public') === 'private' ? 'btn-public' : 'btn-private'}" onclick="window.toggleStatus(${record.id})">
                            ${(record.status || 'public') === 'private' ? 'Make Public' : 'Make Private'}
                        </button>
                        <button class="btn-sm btn-delete" onclick="window.deleteMetadataItem(${record.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        }

        window.toggleStatus = function(id) {
            alert(`Toggle status for metadata ID: ${id}`);
        };

        window.deleteMetadataItem = function(id) {
            if (confirm('Are you sure you want to delete this metadata record?')) {
                alert(`Delete metadata ID: ${id}`);
            }
        };

        window.changePage = changePage;

        function initTabs() {
            const tabs = document.querySelectorAll('.nav-tab');
            const tabContents = {
                'metadata': document.getElementById('metadata-tab'),
                'details': document.getElementById('details-tab'),
                'analytics': document.getElementById('analytics-tab'),
                'manage': document.getElementById('manage-tab')
            };
            
            if (tabs.length === 0) return;
            
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    Object.values(tabContents).forEach(content => {
                        if (content) content.style.display = 'none';
                    });
                    
                    const tabName = this.getAttribute('data-tab');
                    if (tabContents[tabName]) {
                        tabContents[tabName].style.display = 'block';
                        
                        if (tabName === 'manage') {
                            populateMetadataTable();
                        }
                    }
                });
            });
        }

        function initSubTabs() {
            const subTabs = document.querySelectorAll('.sub-tab');
            const subTabContents = {
                'edit': document.getElementById('edit-subtab'),
                'metadata': document.getElementById('metadata-subtab'),
                'members': document.getElementById('members-subtab')
            };
            
            if (subTabs.length === 0) return;
            
            subTabs.forEach(subTab => {
                subTab.addEventListener('click', function() {
                    subTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    Object.values(subTabContents).forEach(content => {
                        if (content) content.style.display = 'none';
                    });
                    
                    const subTabName = this.getAttribute('data-subtab');
                    if (subTabContents[subTabName]) {
                        subTabContents[subTabName].style.display = 'block';
                        
                        // Refresh metadata table when switching to metadata subtab
                        if (subTabName === 'metadata') {
                            populateMetadataTable();
                        }
                    }
                });
            });
        }

        function initSearch() {
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;
            
            function handleSearch() {
                currentSearchTerm = searchInput.value;
                filterRecords();
            }
            
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
            searchInput.addEventListener('input', handleSearch);
        }

        function initButtons() {
            const addRecordBtn = document.getElementById('addRecordBtn');
            if (addRecordBtn) {
                addRecordBtn.addEventListener('click', function() {
                    alert('Add metadata record is under construction');
                });
            }
            
            // Filter button
            const filterBtn = document.getElementById('filterBtn');
            if (filterBtn) {
                filterBtn.addEventListener('click', function() {
                    alert('Filter options would appear here');
                });
            }
            
            // Read more button
            const readMoreBtn = document.getElementById('readMoreBtn');
            if (readMoreBtn) {
                readMoreBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const detailsTab = document.querySelector('[data-tab="details"]');
                    if (detailsTab) detailsTab.click();
                });
            }
            
            // Batch actions
            const selectAllCheckbox = document.getElementById('selectAll');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('.metadata-checkbox');
                    checkboxes.forEach(cb => cb.checked = this.checked);
                });
            }
            
            const batchPublic = document.getElementById('batchPublic');
            if (batchPublic) {
                batchPublic.addEventListener('click', () => alert('Make selected records public'));
            }
            
            const batchPrivate = document.getElementById('batchPrivate');
            if (batchPrivate) {
                batchPrivate.addEventListener('click', () => alert('Make selected records private'));
            }
            
            const batchDelete = document.getElementById('batchDelete');
            if (batchDelete) {
                batchDelete.addEventListener('click', () => alert('Delete selected records'));
            }
            
            // Edit form handlers
            const editForm = document.getElementById('editOrganisationForm');
            if (editForm) {
                editForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('Organisation saved successfully!');
                });
            }
            
            const deleteLogoBtn = document.getElementById('deleteLogoBtn');
            if (deleteLogoBtn) {
                deleteLogoBtn.addEventListener('click', () => alert('Logo deleted'));
            }
            
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', () => alert('Changes cancelled'));
            }
            
            const addMemberBtn = document.getElementById('addMemberBtn');
            if (addMemberBtn) {
                addMemberBtn.addEventListener('click', () => alert('Add member form would open'));
            }
        }

        // Logo display adjustment
        function adjustLogoDisplay() {
            const logoImg = document.querySelector('.logo-banner img');
            if (!logoImg) return;
            
            logoImg.onload = function() {
                const img = this;
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                
                img.classList.remove('landscape', 'portrait', 'has-transparent');
                
                if (imgWidth > imgHeight) {
                    img.classList.add('landscape');
                } else if (imgHeight > imgWidth) {
                    img.classList.add('portrait');
                }
                
                if (img.src.includes('.png') || img.src.includes('logo')) {
                    img.classList.add('has-transparent');
                }
            };
            
            if (logoImg.complete) {
                logoImg.onload();
            }
        }

        // Initialize everything
        console.log('Starting initialization...');
        renderRecords();
        populateMetadataTable();
        initTabs();
        initSubTabs();
        initSearch();
        initButtons();
        adjustLogoDisplay();
        
        console.log('Initialization complete');
    });
})();
