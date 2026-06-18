<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>SAEOSS Portal | Metadata</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link href="{{ asset('css/metadata.css') }}" rel="stylesheet">
    <link href="{{ asset('css/all.css') }}" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@8.2.0/ol.css">
    <script src="https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js"></script>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body>

<x-app-layout>
    <section class = "metadata-section">
        <h1 class = "fw-bold mb-4"> Total Metadata records <span id = ""> 400 </span> found</h1>  
        <h3 class = "fw-bold"> Metadata records <span id = "metadata-records"> 0 </span> found</h3>  
        
        <div class = "home-btn">
            <button type="button" class="btn btns btn-lg"> <a href = "/add-records"> Add Metadata Records </a></button>
            <button type="button" class="btn btn-outline-light btn-lg"> Add Metadata File </button>
        </div>
    </section>
    
    <section class="metadata-home">
        <div class="container">
            <div class="metadata-grid">
                <!-- Left Column - Filters -->
                <aside class="filters-panel" aria-label="Search filters">
                    <div class="filters-accordion">
                        <!-- Location Filter (always visible, not in accordion) -->
                        <div class="filter-card">
                            <div class="filter-header">
                                <span class="filter-title">
                                    <i class="bi bi-geo-fill" aria-hidden="true"></i> Filter by location
                                </span>
                                <div>
                                    <div class="btn-group">
                                        <button id = "draw-polygon" type="button" class="btn text-white"><i class="bi bi-pencil-square"></i></button>
                                        <button id="clearmaps" class="clear-btn" aria-label="Clear location filter">Clear</button>
                                    </div>
                                </div>
                            </div>
                            <div class="filter-body p-0">
                                <div id="map" aria-label="Interactive map for location selection"></div>
                            </div>
                        </div>
                        
                        <!-- Accordion Section -->
                        <div class="accordion-container">
                            <!-- Temporal Range Filter -->
                            <div class="filter-card mb-1">
                                <div class="filter-header">
                                    <span class="filter-title">
                                        Temporal Range
                                    </span>
                                </div>
                                
                                <div class="filter-body p-3">
                                    <div class="date-range">
                                        <div class="date-field">
                                            <label for="start-date" class="form-label">Start Date</label>
                                            <input type="date" id="start-date" class="form-input" name="startdate">
                                        </div>
                                        <div class="date-field">
                                            <label for="end-date" class="form-label">End Date</label>
                                            <input type="date" id="end-date" class="form-input" name="enddate">
                                        </div>
                                    </div>
                                    <div class = "rangeBtn">
                                        <button id="clear-date-range" class="btn btn-danger fw-bold btn-sm">
                                            <i class="bi bi-x-circle"></i> Clear
                                        </button>
                                        <button id="apply-date-range" class="btn btn-success fw-bold btn-sm">
                                            <i class="bi bi-calendar-range"></i> Apply Date Range
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="filter-card accordion-item mb-1">
                                <button class="filter-header accordion-btn" data-accordion="Organisation" aria-expanded="false" aria-controls="Organisation">
                                    Organisation
                                    <i class="bi bi-chevron-down" aria-hidden="true"></i>
                                </button>
                                <div id="Organisation" class="accordion-content">
                                    <div class="filter-body mt-2">
                                        <div id="organisation-metadata" class="organisation-container">
                                            <div class="text-center p-4">
                                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span class="visually-hidden">Loading...</span>
                                                </div>
                                                <div class="ms-2 mt-2">Loading organisations...</div>
                                            </div>
                                        </div>
                                        
                                        <div class="d-grid mt-2">
                                            <button id="clear-all-filters" type="button" class="btn btn-outline-danger">
                                                <i class="bi bi-trash"></i> Clear All Filters    
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="filter-card accordion-item">
                                <button class="filter-header accordion-btn" data-accordion="Tags" aria-expanded="false" aria-controls="Tags">
                                    Tags
                                    <i class="bi bi-chevron-down" aria-hidden="true"></i>
                                </button>
                                <div id="Tags" class="accordion-content">
                                    <div class="filter-body p-3">
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="urban" name="urban">
                                            <label class="form-check-label" for="urban"> Urban Development </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="food" name="food">
                                            <label class="form-check-label" for="food"> Food Security </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="economy" name="economy">
                                            <label class="form-check-label" for="economy"> Economy </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="crime" name="crime">
                                            <label class="form-check-label" for="crime"> Crime </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="health" name="health">
                                            <label class="form-check-label" for="health"> Health </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="disaster" name="disaster">
                                            <label class="form-check-label" for="disaster"> Disaster </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="vegetation" name="vegetation">
                                            <label class="form-check-label" for="vegetation"> Vegetation </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="farming" name="farming">
                                            <label class="form-check-label" for="farming"> Farming </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="rural" name="rural">
                                            <label class="form-check-label" for="rural"> Rural Development </label>
                                        </div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="roads" name="roads">
                                            <label class="form-check-label" for="roads"> Roads </label>
                                        </div>
                                        <div class = "tag-div">
                                            <div class="form-check form-switch mb-2">
                                                <input class="form-check-input" type="checkbox" id="energy" name="energy">
                                                <label class="form-check-label" for="energy"> Energy </label>
                                            </div>
                                        </div>
                                        <div class = "tag-div">
                                            <div class="form-check form-switch mb-4">
                                                <input class="form-check-input" type="checkbox" id="agriculture" name="agriculture">
                                                <label class="form-check-label" for="agriculture"> Agriculture </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
                
                <!-- Right Column - Content -->
                <main class="content-panel" aria-label="Main content">
                    <div class="top-part">
                        <div class="top-buttons">
                            <button id="list-view-btn" class="btn conns view-toggle-btn active">
                                <i class="bi bi-list-ul"></i> List View
                            </button>

                            <button id="grid-view-btn" class="btn conns btn-outline-success view-toggle-btn">
                                <i class="bi bi-grid-3x3-gap-fill"></i> Grid View                          
                            </button>
                        </div>
                        
                        <div class="grid-sorters">
                            <div class="input-group">
                                <input type="text" id="search-input" class="form-control" placeholder="Search metadata, topic...">
                                <button id="clear-search" class="btn btn-light" type="button">
                                    <i class="bi bi-x-circle"></i> 
                                </button>
                                <button id="search-button" class="btn btn-success" type="button">
                                    <i class="bi bi-search"></i> Search
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bottom-part">
                        <div id="metadata-content"></div>
                    </div>
                </main>
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
                    <li><a href="https://catalogue.sansa.org.za/" target="_blank""><i class="bi bi-database"></i> Data Catalogue</a></li>
                    <li><a href="{{ asset('DST-SAEOS-Strategy.pdf') }}" target="_blank"><i class="bi bi-file-earmark-text"></i> SAEOSS Strategy</a></li>
                    <li><a href="#"><i class="bi bi-shield-lock"></i> Privacy Policy</a></li>
                </ul>
            </div>
            
            <div class="footer-col">
                <h4>Partners</h4>
                <div class="partner-badge">
                    <span class="partner-item"> <a href = "https://www.africageoportal.com/"> 🌍 SAGEO </a></span>
                    <span class="partner-item"> <a href = "https://www.africageoportal.com/">🌱 AfriGEO </a></span>
                    <span class="partner-item"> <a href = "https://www.africageoportal.com/"> 🛰️ GEO </a></span>
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
                        <a href = "https://www.dsti.gov.za/" target="_blank"><img src="{{ asset('images/dstlogo-white.png') }}" class="rounded" alt="DSI Logo"></a>
                    </div>
                    <div class="sansa-logo">
                        <a href = "https://www.sansa.org.za" target="_blank"><img src="{{ asset('images/sansalogo.png') }}" class="rounded" alt="SANSA Logo"></a>
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
<script src="{{ asset('js/metadata.js') }}"></script>

</body>
</html>

