(function() {
    document.addEventListener('DOMContentLoaded', function() {
        
        // ===================== DATA INITIALIZATION =====================
        let allRecords = [];
        let organisationData = null;
        const itemsPerPage = 12;
        let currentPage = 1;
        let currentFilteredRecords = [];
        let currentSearchTerm = '';
        let membersLoadController = null;

        // ===================== FETCH ORGANISATION DATA =====================
        
        /**
         * Load organisation data from API
         */
        function loadOrganisationData() {
            // Get organisation identifier from URL
            const path = window.location.pathname;
            const match = path.match(/\/organisation\/(.+)/);
            
            if (!match) {
                console.error('Could not extract organisation identifier from URL');
                showError('Invalid organisation URL');
                return;
            }
            
            const identifier = match[1];
            console.log('Loading organisation data for:', identifier);
            
            // Show loading state
            showLoadingState();
            
            // Fetch organisation data
            fetch(`/api/organisations/${identifier}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Failed to load organisation data');
                    }
                    
                    organisationData = data.organisation;
                    allRecords = organisationData.metadata || [];
                    currentFilteredRecords = [...allRecords];
                    
                    // Store in window for other functions
                    window.organisationData = {
                        allRecords: allRecords,
                        organisation: organisationData
                    };
                    
                    console.log('Organisation data loaded:', organisationData);
                    console.log('Records count:', allRecords.length);
                    
                    // Initialize the page
                    initializePage();
                })
                .catch(error => {
                    console.error('Error loading organisation:', error);
                    showError('Failed to load organisation: ' + error.message);
                });
        }

        /**
         * Show loading state
         */
        function showLoadingState() {
            const container = document.getElementById('recordsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="loading-state" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0a2642;"></i>
                        <p style="margin-top: 1rem;">Loading organisation data...</p>
                    </div>
                `;
            }
        }

        /**
         * Show error state
         */
        function showError(message) {
            const container = document.getElementById('recordsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="error-state" style="text-align: center; padding: 3rem; color: #e74c3c;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>${message}</p>
                        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0a2642; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                `;
            }
        }

        // ===================== UTILITY FUNCTIONS =====================
        
        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        /**
         * Show notification
         */
        function showNotification(message, type = 'info') {
            const colors = {
                success: '#2ecc71',
                error: '#e74c3c',
                info: '#3498db',
                warning: '#f39c12'
            };
            
            const existingNotifications = document.querySelectorAll('.custom-notification');
            existingNotifications.forEach(n => n.remove());
            
            const notification = document.createElement('div');
            notification.className = 'custom-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${colors[type] || colors.info};
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                font-size: 0.9rem;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        /**
         * Generate consistent avatar color based on ID or email
         */
        function getAvatarColor(identifier) {
            const colors = [
                '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
                '#2c3e50', '#16a085', '#27ae60', '#2980b9',
                '#8e44ad', '#d35400', '#c0392b', '#7f8c8d'
            ];
            
            let hash = 0;
            const str = String(identifier || '');
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % colors.length;
            return colors[index];
        }

        // ===================== MEMBERS FUNCTIONS =====================

        /**
         * Load members for the organisation
         */
        function loadMembers() {
            const membersList = document.getElementById('membersList');
            if (!membersList) return;
            
            if (!organisationData) {
                membersList.innerHTML = '<div class="empty-state">Organisation data not available</div>';
                return;
            }
            
            if (membersLoadController) {
                membersLoadController.abort();
            }
            
            const identifier = organisationData.identifier || organisationData.id;
            
            membersList.innerHTML = `
                <div class="loading-members" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem;"></i>
                    <p>Loading members...</p>
                </div>
            `;
            
            membersLoadController = new AbortController();
            const timeoutId = setTimeout(() => {
                membersLoadController.abort();
            }, 10000);

            fetch(`/organisation/${identifier}/members`, {
                signal: membersLoadController.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error('Failed to fetch members');
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message || 'Failed to load members');
                }
                renderMembers(data.members);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error('Error loading members:', error);
                
                const message = error.name === 'AbortError'
                    ? 'Request timed out after 10 seconds.'
                    : 'Failed to load members. Please try again.';
                
                membersList.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 2rem; color: #e74c3c;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                        <p>${message}</p>
                        <button onclick="window.loadMembers()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0a2642; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                `;
            });
        }

        /**
         * Render members list
         */
        function renderMembers(members) {
            const membersList = document.getElementById('membersList');
            if (!membersList) return;
            
            if (!members || members.length === 0) {
                membersList.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-users" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem;"></i>
                        <p>No members found for this organisation.</p>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Add members using the "Add Member" button above.</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            members.forEach(member => {
                const initials = (member.name || 'U')
                    .split(' ')
                    .map(word => word.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                
                const avatarColor = getAvatarColor(member.id || member.email);
                
                // Get role class and label based on role
                let roleClass = 'role-member';
                let roleLabel = 'Member';
                
                if (member.role === 'admin') {
                    roleClass = 'role-admin';
                    roleLabel = 'Admin';
                } else if (member.role === 'editor') {
                    roleClass = 'role-editor';
                    roleLabel = 'Editor';
                } else if (member.role === 'publisher') {
                    roleClass = 'role-publisher';
                    roleLabel = 'Publisher';
                }
                
                html += `
                    <div class="member-item" data-user-id="${member.id}">
                        <div class="member-info">
                            <div class="member-avatar" style="background-color: ${avatarColor};">${initials}</div>
                            <div>
                                <div class="member-name">${escapeHtml(member.name)}</div>
                                <div class="member-email">${escapeHtml(member.email)}</div>
                            </div>
                        </div>
                        <div class="member-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="member-role ${roleClass}">${roleLabel}</span>
                            <button class="btn-sm btn-remove-member" data-user-id="${member.id}" title="Remove member" style="background: none; border: none; color: #e74c3c; cursor: pointer; padding: 0.25rem 0.5rem;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            membersList.innerHTML = html;
            
            document.querySelectorAll('.btn-remove-member').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const userId = this.getAttribute('data-user-id');
                    removeMember(userId);
                });
            });
        }

        /**
         * Remove a member from the organisation
         */
        function removeMember(userId) {
            if (!confirm('Are you sure you want to remove this member from the organisation?')) {
                return;
            }
            
            if (!organisationData) {
                showNotification('Organisation data not available', 'error');
                return;
            }
            
            const identifier = organisationData.identifier || organisationData.id;
            
            fetch(`/organisation/${identifier}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Member removed successfully', 'success');
                    loadMembers();
                } else {
                    throw new Error(data.message || 'Failed to remove member');
                }
            })
            .catch(error => {
                console.error('Error removing member:', error);
                showNotification('Failed to remove member: ' + error.message, 'error');
            });
        }

        /**
         * Show add member modal
         */
        function showAddMemberDialog() {
            const existingModal = document.querySelector('.add-member-modal');
            if (existingModal) {
                existingModal.remove();
                return;
            }
            
            if (!organisationData) {
                showNotification('Organisation data not available', 'error');
                return;
            }
            
            const identifier = organisationData.identifier || organisationData.id;
            
            const modal = document.createElement('div');
            modal.className = 'add-member-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <h3 style="margin-bottom: 1.5rem; color: #0a2642;">Add Member</h3>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
                        <input type="email" id="memberEmail" placeholder="Enter member's email" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Role</label>
                        <select id="memberRole" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                            <option value="member">Member</option>
                            <option value="editor">Editor</option>
                            <option value="publisher">Publisher</option>
                        </select>
                    </div>
                    <div id="addMemberError" style="color: #e74c3c; margin-bottom: 1rem; display: none;"></div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancelAddMember" style="padding: 0.75rem 1.5rem; background: #f0f0f0; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">Cancel</button>
                        <button type="button" id="submitAddMember" style="padding: 0.75rem 1.5rem; background: #0a2642; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
                            <i class="fas fa-user-plus"></i> Add Member
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#cancelAddMember').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
            modal.querySelector('#submitAddMember').addEventListener('click', function() {
                const email = document.getElementById('memberEmail').value.trim();
                const role = document.getElementById('memberRole').value;
                
                if (!email) {
                    showNotification('Please enter an email address', 'warning');
                    return;
                }
                
                addMemberByEmail(email, role, modal);
            });
            
            setTimeout(() => {
                const emailInput = document.getElementById('memberEmail');
                if (emailInput) emailInput.focus();
            }, 100);
        }

        /**
         * Add a member by email
         */
        function addMemberByEmail(email, role, modal) {
            if (!organisationData) {
                showNotification('Organisation data not available', 'error');
                return;
            }
            
            const identifier = organisationData.identifier || organisationData.id;
            
            const submitBtn = modal?.querySelector('#submitAddMember');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            }
            
            const errorDiv = document.getElementById('addMemberError');
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }
            
            fetch(`/organisation/${identifier}/members`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    role: role
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Failed to add member');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showNotification('Member added successfully', 'success');
                    if (modal) modal.remove();
                    loadMembers();
                } else {
                    throw new Error(data.message || 'Failed to add member');
                }
            })
            .catch(error => {
                console.error('Error adding member:', error);
                
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = error.message || 'Failed to add member. Please try again.';
                }
                
                showNotification('Failed to add member: ' + error.message, 'error');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Member';
                }
            });
        }

        // ===================== RECORDS FUNCTIONS =====================

        function filterRecords() {
            const searchTerm = currentSearchTerm.toLowerCase();
            if (!searchTerm) {
                currentFilteredRecords = [...allRecords];
            } else {
                currentFilteredRecords = allRecords.filter(record => {
                    const title = (record.title || '').toLowerCase();
                    const desc = (record.descriptio || record.description || '').toLowerCase();
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
                <div class="record-card fade-in" data-id="${record.identifier}">
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
                        <a href="#" class="action-link view-details" data-id="${record.identifier}">View details <i class="fas fa-chevron-right"></i></a>
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
                    window.open(`/metadata/${id}`, '_blank');
                });
            });
        }

        // ===================== METADATA TABLE FUNCTIONS =====================

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

        // ===================== WINDOW FUNCTIONS =====================

        window.toggleStatus = function(id) {
            alert(`Toggle status for metadata ID: ${id}`);
        };

        window.deleteMetadataItem = function(id) {
            if (confirm('Are you sure you want to delete this metadata record?')) {
                alert(`Delete metadata ID: ${id}`);
            }
        };

        window.changePage = changePage;
        window.loadMembers = loadMembers;

        // ===================== TAB INITIALIZATION =====================

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
                        
                        if (subTabName === 'metadata') {
                            populateMetadataTable();
                        } else if (subTabName === 'members') {
                            setTimeout(loadMembers, 100);
                        }
                    }
                });
            });
        }

        // ===================== SEARCH INITIALIZATION =====================

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

        // ===================== BUTTONS INITIALIZATION =====================

        function initButtons() {
            const addRecordBtn = document.getElementById('addRecordBtn');
            if (addRecordBtn) {
                addRecordBtn.addEventListener('click', function() {
                    alert('Add metadata record is under construction');
                });
            }
            
            const filterBtn = document.getElementById('filterBtn');
            if (filterBtn) {
                filterBtn.addEventListener('click', function() {
                    alert('Filter options would appear here');
                });
            }
            
            const readMoreBtn = document.getElementById('readMoreBtn');
            if (readMoreBtn) {
                readMoreBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const detailsTab = document.querySelector('[data-tab="details"]');
                    if (detailsTab) detailsTab.click();
                });
            }
            
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
                addMemberBtn.addEventListener('click', showAddMemberDialog);
            }
        }

        // ===================== LOGO DISPLAY =====================

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

        // ===================== INITIALIZE PAGE =====================

        function initializePage() {
            console.log('Initializing page...');
            renderRecords();
            populateMetadataTable();
            initTabs();
            initSubTabs();
            initSearch();
            initButtons();
            adjustLogoDisplay();
            
            // Check if members subtab is visible
            const membersSubtab = document.getElementById('members-subtab');
            if (membersSubtab && membersSubtab.style.display !== 'none') {
                loadMembers();
            }
            
            console.log('Initialization complete');
        }

        // ===================== START =====================

        console.log('Starting application...');
        
        // Check if we already have data from server (server-side rendering)
        if (window.organisationData && window.organisationData.organisation) {
            console.log('Using server-side data');
            organisationData = window.organisationData.organisation;
            allRecords = window.organisationData.allRecords || [];
            currentFilteredRecords = [...allRecords];
            initializePage();
        } else {
            // Load data from API
            console.log('Loading data from API');
            loadOrganisationData();
        }
    });
})();
