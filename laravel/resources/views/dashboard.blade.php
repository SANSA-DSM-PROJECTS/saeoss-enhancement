<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title> SAEOSS | Admin Dashboard </title>
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    <link href="{{ asset('css/dashboard.css') }}" rel="stylesheet">
    <!-- Google Fonts + Font Awesome 6 -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    
    <style>
        
    </style>
</head>
<body>
    <x-app-layout>
        <div class="dashboard-layout">
            <!-- Sidebar - starts at 65px below navbar -->
            <aside class="admin-sidebar" id="adminSidebar">

                <div class="nav-section">
                    <div class="nav-label">ADMIN</div>
                    <div class="nav-item active" data-tooltip="Dashboard">
                        <i class="fas fa-chart-pie"></i>
                        <span>Dashboard</span>
                    </div>
                    <div class="nav-item" data-tooltip="Metadata">
                        <i class="fas fa-folder-tree"></i>
                        <span>Metadata Management</span>
                    </div>
                    <div class="nav-item" data-tooltip="Harvest">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Harvest Management</span>
                    </div>
                    <div class="nav-item" data-tooltip="Organizations">
                        <i class="fas fa-building"></i>
                        <span>Organizations</span>
                    </div>
                    <div class="nav-item" data-tooltip="Users">
                        <i class="fas fa-users"></i>
                        <span>Users & Roles</span>
                    </div>
                </div>

                <div class="nav-section">
                    <div class="nav-label">INSIGHTS</div>
                    <div class="nav-item" data-tooltip="Analytics">
                        <i class="fas fa-chart-line"></i>
                        <span>Reports & Analytics</span>
                    </div>
                    <div class="nav-item" data-tooltip="Audit">
                        <i class="fas fa-history"></i>
                        <span>Audit Logs</span>
                    </div>
                    <div class="nav-item" data-tooltip="Settings">
                        <i class="fas fa-sliders-h"></i>
                        <span>System Settings</span>
                    </div>
                </div>

                <div class="nav-section">
                    <div class="nav-label">EXTERNAL</div>
                    <div class="nav-item" data-tooltip="Notifications">
                        <i class="fas fa-bell"></i>
                        <span>Notifications</span>
                        <span class="badge">3</span>
                    </div>
                    <div class="nav-item" data-tooltip="API">
                        <i class="fas fa-plug"></i>
                        <span>API / Integrations</span>
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="main-content">
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <span>Total Metadata</span>
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="stat-number">24,520</div>
                        <div class="stat-trend">
                            <i class="fas fa-arrow-up trend-up"></i>
                            <span>10% this week</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <span>Organisations</span>
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="stat-number">320</div>
                        <div class="stat-trend">
                            <i class="fas fa-arrow-up trend-up"></i>
                            <span>8% this week</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <span>Active Harvests</span>
                            <i class="fas fa-cogs"></i>
                        </div>
                        <div class="stat-number">7</div>
                        <div class="stat-sub">2 running now</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <span>Users</span>
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-number">156</div>
                        <div class="stat-trend">
                            <i class="fas fa-arrow-up trend-up"></i>
                            <span>6% this week</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <span>Failed Harvests</span>
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-number">3</div>
                        <div class="stat-sub">Needs attention</div>
                    </div>
                </div>

                <!-- Two Column Content -->
                <div class="two-col">
                    <!-- Left Column -->
                    <div class="col-left">
                        <!-- Harvest Status -->
                        <div class="card">
                            <div class="card-header">
                                <h3><i class="fas fa-cloud-download-alt"></i> Harvest Status</h3>
                                <a href="#" class="card-link">View all <i class="fas fa-arrow-right"></i></a>
                            </div>
                            <div class="card-body">
                                <div class="harvest-item">
                                    <span class="harvest-name">Cogta</span>
                                    <span class="status status-success"><i class="fas fa-check-circle"></i> Success</span>
                                </div>
                                <div class="harvest-item">
                                    <span class="harvest-name">Council for Geoscience</span>
                                    <span class="status status-success"><i class="fas fa-check-circle"></i> Success</span>
                                </div>
                                <div class="harvest-item">
                                    <span class="harvest-name">DMRE</span>
                                    <span class="status status-running"><i class="fas fa-sync-alt"></i> Running</span>
                                </div>
                                <div class="harvest-item">
                                    <span class="harvest-name">DFFE</span>
                                    <span class="status status-success"><i class="fas fa-check-circle"></i> Success</span>
                                </div>
                                <div class="harvest-item">
                                    <span class="harvest-name">DALRRD</span>
                                    <span class="status status-failed"><i class="fas fa-exclamation-triangle"></i> Failed</span>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Metadata -->
                        <div class="card">
                            <div class="card-header">
                                <h3><i class="fas fa-table-list"></i> Recent Metadata Records</h3>
                                <a href="#" class="card-link">View all</a>
                            </div>
                            <div class="card-body">
                                <table class="data-table">
                                    <thead>
                                        <tr><th>Title</th><th>Organization</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Mpumalanga Geology</td><td>Geoscience</td><td><span class="badge-published">Published</span></td></tr>
                                        <tr><td>Western Cape Agriculture</td><td>DALRRD</td><td><span class="badge-published">Published</span></td></tr>
                                        <tr><td>Free State Energy</td><td>DMRE</td><td><span class="badge-draft">Draft</span></td></tr>
                                        <tr><td>KZN Transportation</td><td>Transport</td><td><span class="badge-published">Published</span></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="col-right">
                        <!-- User Activity -->
                        <div class="card">
                            <div class="card-header">
                                <h3><i class="fas fa-user-check"></i> User Activity (Last 7 Days)</h3>
                                <a href="#" class="card-link">Details</a>
                            </div>
                            <div class="card-body">
                                <div class="activity-item">
                                    <div class="activity-row">
                                        <span>Active Users</span>
                                        <span><strong>95</strong> (61%)</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 61%"></div>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-row">
                                        <span>Inactive</span>
                                        <span><strong>34</strong> (22%)</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 22%; background: #8e9eae"></div>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-row">
                                        <span>Pending Approval</span>
                                        <span><strong>17</strong> (11%)</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 11%; background: #f59e0b"></div>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-row">
                                        <span>Suspended</span>
                                        <span><strong>10</strong> (6%)</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 6%; background: #ef4444"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Users -->
                        <div class="card">
                            <div class="card-header">
                                <h3><i class="fas fa-users"></i> Recent Users</h3>
                                <a href="#" class="card-link">Manage</a>
                            </div>
                            <div class="card-body">
                                <table class="data-table">
                                    <thead>
                                        <tr><th>Name</th><th>Role</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Luzuko Mali</td><td>Admin</td><td style="color: #166534;">Active</td></tr>
                                        <tr><td>Sarah Kula</td><td>Editor</td><td style="color: #166534;">Active</td></tr>
                                        <tr><td>Michael Lee</td><td>Viewer</td><td style="color: #166534;">Active</td></tr>
                                        <tr><td>Priya Nair</td><td>Editor</td><td style="color: #d97706;">Pending</td></tr>
                                        <tr><td>Sethu Wonga</td><td>Viewer</td><td style="color: #64748b;">Inactive</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Audit Logs -->
                        <div class="card">
                            <div class="card-header">
                                <h3><i class="fas fa-history"></i> Audit Logs (Latest 5)</h3>
                                <a href="#" class="card-link">View all</a>
                            </div>
                            <div class="card-body">
                                <div class="harvest-item">
                                    <span>Luzuko Mali updated metadata</span>
                                    <span class="status-success">5 min ago</span>
                                </div>
                                <div class="harvest-item">
                                    <span>Harvest completed: GeoNetwork</span>
                                    <span class="status-success">1 hour ago</span>
                                </div>
                                <div class="harvest-item">
                                    <span>New user registered</span>
                                    <span class="status-running">3 hours ago</span>
                                </div>
                                <div class="harvest-item">
                                    <span>Harvest failed: OpenData API</span>
                                    <span class="status-failed">Yesterday</span>
                                </div>
                                <div class="harvest-item">
                                    <span>Metadata record deleted</span>
                                    <span class="status-failed">Yesterday</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer-copyright">
                    © 2026 South African National Space Agency. All rights reserved.
                </div>
            </main>
        </div>
    </x-app-layout>

    <script>
        // Sidebar scroll animation - smooth float effect when scrolling down
        const sidebar = document.getElementById('adminSidebar');
        let isFloating = false;
        let scrollTimeout;
        let lastScrollY = 0;

        function checkScroll() {
            const scrollY = window.scrollY;
            // Float when scrolled down more than 100px (navbar mostly hidden)
            const shouldFloat = scrollY > 80;
            
            if (shouldFloat && !isFloating) {
                sidebar.classList.add('sidebar-float');
                isFloating = true;
            } else if (!shouldFloat && isFloating) {
                sidebar.classList.remove('sidebar-float');
                isFloating = false;
            }
        }

        // Throttle scroll event for performance
        window.addEventListener('scroll', function() {
            if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
            scrollTimeout = requestAnimationFrame(checkScroll);
        });

        // Initial check
        checkScroll();
    </script>
</body>
</html>
