<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SA Earth Observation Metadata Portal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h1 class="h3 mb-0">🌍 South Africa's Earth Observation Metadata Portal</h1>
            </div>
            <div class="card-body">
                <div class="alert alert-success">
                    <h4>✅ System is Running!</h4>
                    <p>PHP is working correctly with Nginx and PostgreSQL.</p>
                </div>
                
                <h3>System Information:</h3>
                <table class="table table-bordered">
                    <tr>
                        <th>PHP Version</th>
                        <td><?php echo phpversion(); ?></td>
                    </tr>
                    <tr>
                        <th>Server Software</th>
                        <td><?php echo $_SERVER['SERVER_SOFTWARE']; ?></td>
                    </tr>
                    <tr>
                        <th>Document Root</th>
                        <td><?php echo $_SERVER['DOCUMENT_ROOT']; ?></td>
                    </tr>
                    <tr>
                        <th>Database Status</th>
                        <td>
                            <?php
                            try {
                                $pdo = new PDO('pgsql:host=postgres;dbname=eo_metadata', 'eo_user', 'eo_password');
                                echo '<span class="text-success">✓ Connected to PostgreSQL</span>';
                            } catch (Exception $e) {
                                echo '<span class="text-danger">✗ Database connection failed</span>';
                            }
                            ?>
                        </td>
                    </tr>
                </table>
                
                <div class="mt-4">
                    <h3>Featured Datasets</h3>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Vegetation Cover Map 2023</h5>
                                    <p class="text-muted">SAIDI | 2022-2023</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Flood Event Map (Jan 2024)</h5>
                                    <p class="text-muted">SAIDI | 2024</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Land Cover 2022</h5>
                                    <p class="text-muted">SANSA | 2022-2023</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Road Network (National)</h5>
                                    <p class="text-muted">SANRAL | 2021-2023</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
