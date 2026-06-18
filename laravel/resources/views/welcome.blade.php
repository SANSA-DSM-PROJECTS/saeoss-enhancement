<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>SAEOSS Portal</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link href="{{ asset('css/home.css') }}" rel="stylesheet">
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css">
    <script src="https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js"></script>

    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body>

<x-app-layout>
    <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h1>SAEOSS Portal</h1>
                    <p>
                        The SAEOSS-Portal is the result of a pioneering collaboration between SANSA (South African National Space Agency) and 
                        SAEON (South African Environmental Observation Network). United by a common vision, the SAEOSS-Portal platform was conceived 
                        to revolutionize data sharing among diverse entities, fostering synergy and knowledge exchange.
                    </p>

                    <div class="hero-buttons">
                        <a href="/mapping" class="btn conns btn-lg">Explore Metadata</a>
                        <a href="#how-section" class="btn btn-outline-light btn-lg">Learn More</a>
                    </div>
                </div>  
            </div>
        </div>
    </section>

    <!-- STATS -->
    <section class="stats-section">
        <div class="container">
            <div class="row g-4 justify-content-center">
                <div class="col-lg-3 col-md-6">
                    <a href="/mapping" class="stat-card-link">   
                        <div class="stat-card">
                            <i class="bi bi-database"></i>
                            <div>
                                <h1>109+</h1>
                                <p>Metadata Records</p>
                            </div>
                        </div>
                    </a>
                </div>

                <div class="col-lg-3 col-md-6">
                    <a href="/organisation" class="stat-card-link">  
                        <div class="stat-card">
                            <i class="bi bi-people"></i>
                            <div>
                                <h1>15+</h1>
                                <p>Custodians</p>
                            </div>
                        </div>
                    </a>
                </div>

                <div class="col-lg-3 col-md-6">
                    <div class="stat-card">
                        <i class="bi bi-layers"></i>
                        <div>
                            <h1>10+</h1>
                            <p>Data Sources</p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-6">
                    <div class="stat-card">
                        <i class="bi bi-clock"></i>
                        <div>
                            <h1>24/7</h1>
                            <p>Availability</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- DATASETS -->
    <section class="dataset-section">
        <div class="container">
            <div class="section-header">
                <h1 class="fw-bold">Featured Datasets</h1>
                <div class="carousel-controls">
                    <button class="scroll-btn scroll-left" id="scrollLeft">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                    <button class="scroll-btn scroll-right" id="scrollRight">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>

            <div class="datasets-carousel-container">
                <div class="datasets-carousel" id="datasetsCarousel">
                    <!-- Dataset 1 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Vegetation.jpg') }}" alt="Dataset">
                        <div class="dataset-content">
                            <span class="dataset-tag green">Vegetation</span>
                            <h4>Vegetation Cover Map 2023</h4>
                            <p class="fw-bold">SANSA</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 2 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Deforestation.jpg') }}" alt="Dataset">
                        <div class="dataset-content">
                            <span class="dataset-tag blue">Forest</span>
                            <h4>Deforestation Monitor</h4>
                            <p class="fw-bold">DFFE</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 3 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Land_Cover.jpg') }}" alt="Dataset">
                        <div class="dataset-content">
                            <span class="dataset-tag green">Land Cover</span>
                            <h4>Land Cover 2022</h4>
                            <p class="fw-bold">SANSA</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 4 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Road_Network.jpg') }}" alt="Dataset">
                        <div class="dataset-content">
                            <span class="dataset-tag orange">Infrastructure</span>
                            <h4>Road Network</h4>
                            <p class="fw-bold">SANRAL</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 5 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Water.jpg') }}" alt="Water Resources">
                        <div class="dataset-content">
                            <span class="dataset-tag blue">Water</span>
                            <h4>Water Resources Map</h4>
                            <p class="fw-bold">DWS</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 6 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Urban_Development.jpg') }}" alt="Urban Development">
                        <div class="dataset-content">
                            <span class="dataset-tag orange">Urban</span>
                            <h4>Urban Development</h4>
                            <p class="fw-bold">COGTA</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 7 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Fire.jpg') }}" alt="Disaster">
                        <div class="dataset-content">
                            <span class="dataset-tag green">Disaster</span>
                            <h4>Disaster - Fire</h4>
                            <p class="fw-bold">DMC</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>

                    <!-- Dataset 8 -->
                    <div class="dataset-card">
                        <img src="{{ asset('images/Protected_Areas.jpg') }}" alt="Dataset">
                        <div class="dataset-content">
                            <span class="dataset-tag green">Conservation</span>
                            <h4>Protected Areas</h4>
                            <p class="fw-bold">SANParks</p>
                            <button class="btn btn-primary btn-sm">View</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how-section" class="how-section">
        <div class="container">
            <div class="row">
                <div class="col-lg-4">
                    <div class="map-card">
                        <h4>Metadata Records</h4>
                        <div id="map" style="height: 300px; width: 100%;"></div>
                        <p class="map-description">
                            Point on bounding box to view metadata. 
                            <a href="/mapping/" class="btn btn-outline-success fw-bold">SAEOSS Map Portal</a>
                        </p>
                    </div>
                </div>

                <div class="col-lg-8">
                    <div class="howz">
                        <div class="row g-4">
                            <div class="col-md-4">
                                <div class="how-card">
                                    <div class="how-icon">
                                        <i class="bi bi-search"></i>
                                    </div>
                                    <h4>Search</h4>
                                    <p>Filter by topic, place, and time.</p>
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="how-card">
                                    <div class="how-icon">
                                        <i class="bi bi-file-earmark-text"></i>
                                    </div>
                                    <h4>Discover</h4>
                                    <p>View metadata records and detailed dataset information.</p>
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="how-card">
                                    <div class="how-icon">
                                        <i class="bi bi-download"></i>
                                    </div>
                                    <h4>Download</h4>
                                    <p>Access datasets, APIs, and geospatial services.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <footer class="footers">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>Quick Links</h4>
                <ul class="footer-links">
                    <li><a href="https://desa.sansa.org.za/" target="_blank"><i class="bi bi-grid-3x3-gap-fill"></i> Digital Earth South Africa (DESA)</a></li>
                    <li><a href="/metadata"><i class="bi bi-search"></i> Explore Metadata</a></li>
                    <li><a href="https://catalogue.sansa.org.za/" target="_blank"><i class="bi bi-database"></i> Data Catalogue</a></li>
                    <li><a href="{{ asset('DST-SAEOS-Strategy.pdf') }}" target="_blank"><i class="bi bi-file-earmark-text"></i> SAEOSS Strategy</a></li>
                    <li><a href="#"><i class="bi bi-shield-lock"></i> Privacy Policy</a></li>
                </ul>
            </div>
            
            <div class="footer-col">
                <h4>Partners</h4>
                <div class="partner-badge">
                    <span class="partner-item"><a href="https://www.africageoportal.com/">🌍 SAGEO</a></span>
                    <span class="partner-item"><a href="https://www.africageoportal.com/">🌱 AfriGEO</a></span>
                    <span class="partner-item"><a href="https://www.africageoportal.com/">🛰️ GEO</a></span>
                </div>
                <p style="font-size: 0.7rem; color:#7e8ba0; margin-top: 12px;">Collaborative Earth Observation Initiatives</p>
                <div class="contactus">
                    <h3 class="fw-bold mb-3">Contact Us</h3>
                    <div class="contact-item">
                        <i class="bi bi-envelope-fill me-2"></i>
                        <span>Email Address: <a href="mailto:saeoss@sansa.org.za">saeoss@sansa.org.za</a></span>
                    </div>
                    <div class="contact-item mt-2">
                        <i class="bi bi-telephone-fill me-2"></i>
                        <span>Contact No.: <a href="tel:+27128440433">+27(12) 844 0433</a></span>
                    </div>
                </div>
            </div>
            
            <div class="footer-col">
                <h4>Proudly brought to you by</h4>
                <div class="proudly-container">
                    <div class="dsi-logo">
                        <a href="https://www.dsti.gov.za/" target="_blank"><img src="{{ asset('images/dstlogo-white.png') }}" class="rounded" alt="DSI Logo"></a>
                    </div>
                    <div class="sansa-logo">
                        <a href="https://www.sansa.org.za" target="_blank"><img src="{{ asset('images/sansalogo.png') }}" class="rounded" alt="SANSA Logo"></a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="copyright">
                &copy; <script>document.write(new Date().getFullYear())</script> South African National Space Agency. All rights reserved.
            </div>
            <div class="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" class="x-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
            </div>
        </div>
    </footer>

</x-app-layout>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script src="{{ asset('js/home.js') }}"></script>
</body>
</html>
